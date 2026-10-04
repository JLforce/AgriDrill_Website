import { NextRequest, NextResponse } from "next/server";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const MQTT_HOST = process.env.HIVEMQ_HOST;
const MQTT_PORT = Number(process.env.HIVEMQ_PORT || 8883);
const MQTT_USERNAME = process.env.HIVEMQ_USERNAME;
const MQTT_PASSWORD = process.env.HIVEMQ_PASSWORD;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const MQTT_TOPIC = "agridrill/control";

// The single row in machine_status that describes the machine
const MACHINE_STATUS_ID = 1;

// Commands allowed by the AgriDrill ESP32 firmware
const ALLOWED_COMMANDS = ["F", "B", "L", "R", "S", "D"] as const;

type AllowedCommand = (typeof ALLOWED_COMMANDS)[number];

type CommandStatus = "sent" | "failed";

const COMMAND_LABELS: Record<AllowedCommand, string> = {
  D: "Start",
  F: "Forward",
  B: "Backward",
  L: "Left",
  R: "Right",
  S: "Stop",
};

const MACHINE_BUSY_MESSAGE =
  "The machine is currently being operated by another user.";

// Service role client: used only on the server and bypasses
// Row Level Security. Never expose this key to the browser.
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

// ============================================================
// MACHINE COUNTERS
// The seed and hole counters belong to the machine itself, so
// the latest telemetry row (from any session) is used for the
// start and end counts of a session.
// ============================================================

async function getLatestTelemetry() {
  if (!supabase) {
    return {
      seedCount: 0,
      holeCount: 0,
    };
  }

  const { data, error } = await supabase
    .from("telemetry_events")
    .select("seed_count, hole_count, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to read latest telemetry:",
      error
    );

    return {
      seedCount: 0,
      holeCount: 0,
    };
  }

  return {
    seedCount: Number(data?.seed_count ?? 0),
    holeCount: Number(data?.hole_count ?? 0),
  };
}

// ============================================================
// MACHINE OWNERSHIP
//
// machine_status.active_session_id says which operation session
// currently "owns" the machine. That session belongs to one user.
// ============================================================

type MachineOwner = {
  sessionId: number;
  userId: string | null;
};

/** Frees the machine, but only if the given session still owns it. */
async function releaseMachine(sessionId: number) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("machine_status")
    .update({ active_session_id: null })
    .eq("id", MACHINE_STATUS_ID)
    .eq("active_session_id", sessionId);

  if (error) {
    console.error(
      "Failed to release the machine:",
      error
    );
  }
}

/**
 * Returns who currently operates the machine, or null if it is free.
 * A leftover pointer to a session that is no longer running is
 * cleaned up automatically.
 */
async function getMachineOwner(): Promise<MachineOwner | null> {
  if (!supabase) {
    throw new Error(
      "Supabase server configuration is missing"
    );
  }

  const { data: status, error: statusError } =
    await supabase
      .from("machine_status")
      .select("active_session_id")
      .eq("id", MACHINE_STATUS_ID)
      .single();

  if (statusError) {
    throw new Error(
      `Failed to read machine status: ${statusError.message}`
    );
  }

  const sessionId = status?.active_session_id as
    | number
    | null
    | undefined;

  if (!sessionId) {
    return null;
  }

  const { data: session, error: sessionError } =
    await supabase
      .from("operation_sessions")
      .select("id, user_id, status")
      .eq("id", sessionId)
      .maybeSingle();

  if (sessionError) {
    throw new Error(
      `Failed to read operation session: ${sessionError.message}`
    );
  }

  if (!session || session.status !== "running") {
    // Stale pointer. Free the machine.
    await releaseMachine(sessionId);

    return null;
  }

  return {
    sessionId: session.id,
    userId: session.user_id ?? null,
  };
}

// ============================================================
// OPERATION SESSIONS
// ============================================================

async function deleteOperationSession(sessionId: number) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("operation_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error(
      "Failed to delete operation session:",
      error
    );
  }
}

/**
 * Creates a session for this user and claims the machine for it.
 * The claim is atomic: it only succeeds if nobody else owns the
 * machine at that moment. Returns null if someone else got there
 * first.
 */
async function startOperationSession(
  userId: string
): Promise<number | null> {
  if (!supabase) {
    throw new Error(
      "Supabase server configuration is missing"
    );
  }

  const telemetry = await getLatestTelemetry();

  const { data: session, error: insertError } =
    await supabase
      .from("operation_sessions")
      .insert({
        user_id: userId,
        started_at: new Date().toISOString(),
        start_seed_count: telemetry.seedCount,
        start_hole_count: telemetry.holeCount,
        status: "running",
      })
      .select("id")
      .single();

  if (insertError) {
    throw new Error(
      `Failed to create operation session: ${insertError.message}`
    );
  }

  // Claim the machine only if it is still free.
  const { data: claimed, error: claimError } =
    await supabase
      .from("machine_status")
      .update({ active_session_id: session.id })
      .eq("id", MACHINE_STATUS_ID)
      .is("active_session_id", null)
      .select("id");

  if (claimError) {
    await deleteOperationSession(session.id);

    throw new Error(
      `Failed to claim the machine: ${claimError.message}`
    );
  }

  if (!claimed || claimed.length === 0) {
    // Another user claimed the machine first.
    await deleteOperationSession(session.id);

    return null;
  }

  console.log(
    `Operation session created: ${session.id} (user ${userId})`
  );

  return session.id;
}

async function finishOperationSession(sessionId: number) {
  if (!supabase) {
    throw new Error(
      "Supabase server configuration is missing"
    );
  }

  const telemetry = await getLatestTelemetry();

  const { error: updateError } = await supabase
    .from("operation_sessions")
    .update({
      ended_at: new Date().toISOString(),
      end_seed_count: telemetry.seedCount,
      end_hole_count: telemetry.holeCount,
      status: "completed",
    })
    .eq("id", sessionId);

  if (updateError) {
    throw new Error(
      `Failed to finish operation session: ${updateError.message}`
    );
  }

  // The machine is free again.
  await releaseMachine(sessionId);

  console.log(
    `Operation session completed: ${sessionId}`
  );
}

// ============================================================
// OPERATOR PROFILE
// ============================================================

async function getOperatorProfile(userId: string) {
  if (!supabase) {
    return {
      name: null,
      email: null,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load operator profile:",
      error
    );

    return {
      name: null,
      email: null,
    };
  }

  return {
    name: data?.full_name?.trim() || null,
    email: data?.email?.trim() || null,
  };
}

// ============================================================
// COMMAND LOG
// ============================================================

async function createMachineCommandLog({
  userId,
  operatorName,
  operatorEmail,
  operationSessionId,
  command,
  status,
}: {
  userId: string;
  operatorName: string | null;
  operatorEmail: string | null;
  operationSessionId: number | null;
  command: AllowedCommand;
  status: CommandStatus;
}) {
  if (!supabase) {
    console.error(
      "Unable to create machine command log: Supabase server configuration is missing"
    );

    return;
  }

  const commandLabel = COMMAND_LABELS[command];

  const { error } = await supabase
    .from("machine_command_logs")
    .insert({
      user_id: userId,
      operator_name: operatorName,
      operator_email: operatorEmail,
      operation_session_id: operationSessionId,
      command,
      command_label: commandLabel,
      status,
    });

  if (error) {
    console.error(
      "Failed to create machine command log:",
      error
    );
  }
}

// ============================================================
// POST /api/command
// ============================================================

export async function POST(request: NextRequest) {
  let client: mqtt.MqttClient | null = null;

  let command = "";
  let authenticatedUserId: string | null = null;
  let operatorName: string | null = null;
  let operatorEmail: string | null = null;

  // The session this command belongs to (used for the command log).
  let operationSessionId: number | null = null;

  // A session created by THIS request that must be undone
  // if the command cannot be delivered to the machine.
  let rollbackSessionId: number | null = null;

  try {
    // ==========================================
    // AUTHENTICATION
    // ==========================================

    const authSupabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    authenticatedUserId = user.id;

    // Load the operator profile from the trusted
    // server-side Supabase client.
    const profile = await getOperatorProfile(user.id);

    operatorName = profile.name ?? user.email ?? null;
    operatorEmail = profile.email ?? user.email ?? null;

    // ==========================================
    // CHECK MQTT ENVIRONMENT VARIABLES
    // ==========================================

    if (
      !MQTT_HOST ||
      !MQTT_USERNAME ||
      !MQTT_PASSWORD
    ) {
      console.error(
        "Missing HiveMQ environment variables"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "MQTT configuration is missing on the server",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // READ JSON BODY
    // ==========================================

    const body = await request.json();

    command = String(body.command || "")
      .trim()
      .toUpperCase();

    // ==========================================
    // VALIDATE COMMAND
    // ==========================================

    if (!command) {
      return NextResponse.json(
        {
          success: false,
          error: "Command is required",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_COMMANDS.includes(
        command as AllowedCommand
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid command: ${command}`,
          allowedCommands: ALLOWED_COMMANDS,
        },
        { status: 400 }
      );
    }

    const allowedCommand =
      command as AllowedCommand;

    // ==========================================
    // MACHINE OWNERSHIP CHECK
    // Only the user who started the current
    // operation may control the machine.
    // ==========================================

    const owner = await getMachineOwner();

    if (owner && owner.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: MACHINE_BUSY_MESSAGE,
        },
        { status: 409 }
      );
    }

    // This user already owns the running session (if any).
    operationSessionId = owner?.sessionId ?? null;

    // ==========================================
    // START: CREATE THE SESSION BEFORE THE MACHINE
    // STARTS, so no telemetry is ever missed.
    // ==========================================

    if (allowedCommand === "D" && !owner) {
      let newSessionId: number | null = null;

      try {
        newSessionId = await startOperationSession(
          user.id
        );
      } catch (sessionError) {
        console.error(
          "Operation session start error:",
          sessionError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to start the operation session",
          },
          { status: 500 }
        );
      }

      if (newSessionId === null) {
        // Someone else claimed the machine a moment ago.
        return NextResponse.json(
          {
            success: false,
            error: MACHINE_BUSY_MESSAGE,
          },
          { status: 409 }
        );
      }

      operationSessionId = newSessionId;
      rollbackSessionId = newSessionId;
    }

    console.log(
      `Publishing command: ${allowedCommand}`
    );

    console.log(
      `MQTT topic: ${MQTT_TOPIC}`
    );

    // ==========================================
    // CONNECT TO HIVEMQ CLOUD
    // ==========================================

    client = mqtt.connect(
      `mqtts://${MQTT_HOST}:${MQTT_PORT}`,
      {
        username: MQTT_USERNAME,
        password: MQTT_PASSWORD,
        protocol: "mqtts",
        reconnectPeriod: 0,
        connectTimeout: 10000,
      }
    );

    await new Promise<void>(
      (resolve, reject) => {
        if (!client) {
          reject(
            new Error(
              "MQTT client was not created"
            )
          );

          return;
        }

        const connectionTimeout =
          setTimeout(() => {
            reject(
              new Error(
                "MQTT connection timed out"
              )
            );
          }, 10000);

        client.once("connect", () => {
          clearTimeout(
            connectionTimeout
          );

          console.log(
            "Connected to HiveMQ Cloud"
          );

          resolve();
        });

        client.once("error", (error) => {
          clearTimeout(
            connectionTimeout
          );

          reject(error);
        });
      }
    );

    // ==========================================
    // PUBLISH COMMAND TO ESP32
    // ==========================================

    await new Promise<void>(
      (resolve, reject) => {
        if (!client) {
          reject(
            new Error(
              "MQTT client is not available"
            )
          );

          return;
        }

        client.publish(
          MQTT_TOPIC,
          allowedCommand,
          {
            qos: 0,
            retain: false,
          },
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            console.log(
              `Command published successfully: ${allowedCommand} → ${MQTT_TOPIC}`
            );

            resolve();
          }
        );
      }
    );

    client.end();

    // The machine received the command, so the new
    // session must be kept.
    rollbackSessionId = null;

    // ==========================================
    // STOP: FINISH THE SESSION AND FREE THE MACHINE
    // ==========================================

    if (allowedCommand === "S" && owner) {
      try {
        await finishOperationSession(owner.sessionId);
      } catch (sessionError) {
        console.error(
          "Operation session stop error:",
          sessionError
        );
      }
    }

    // ==========================================
    // MACHINE COMMAND ACTIVITY LOG
    // ==========================================

    if (authenticatedUserId) {
      await createMachineCommandLog({
        userId: authenticatedUserId,
        operatorName,
        operatorEmail,
        operationSessionId,
        command: allowedCommand,
        status: "sent",
      });
    }

    return NextResponse.json({
      success: true,
      command: allowedCommand,
      topic: MQTT_TOPIC,
      message:
        "Command published successfully",
    });
  } catch (error) {
    console.error(
      "MQTT command error:",
      error
    );

    if (client) {
      client.end(true);
    }

    // ==========================================
    // UNDO A SESSION THAT NEVER REACHED THE MACHINE
    // ==========================================

    if (rollbackSessionId !== null) {
      try {
        await releaseMachine(rollbackSessionId);
        await deleteOperationSession(rollbackSessionId);
      } catch (rollbackError) {
        console.error(
          "Failed to roll back operation session:",
          rollbackError
        );
      }

      rollbackSessionId = null;
      operationSessionId = null;
    }

    // ==========================================
    // FAILED COMMAND ACTIVITY LOG
    // ==========================================

    if (
      authenticatedUserId &&
      ALLOWED_COMMANDS.includes(
        command as AllowedCommand
      )
    ) {
      await createMachineCommandLog({
        userId: authenticatedUserId,
        operatorName,
        operatorEmail,
        operationSessionId,
        command: command as AllowedCommand,
        status: "failed",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to publish command to HiveMQ",
      },
      { status: 500 }
    );
  }
}