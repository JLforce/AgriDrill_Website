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

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
      )
    : null;

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

async function createOperationSession() {
  if (!supabase) {
    throw new Error(
      "Supabase server configuration is missing"
    );
  }

  const { data: existingSession, error: existingError } =
    await supabase
      .from("operation_sessions")
      .select("id")
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to check active operation session: ${existingError.message}`
    );
  }

  if (existingSession) {
    console.log(
      `Operation session already running: ${existingSession.id}`
    );

    return existingSession.id;
  }

  const telemetry = await getLatestTelemetry();

  const { data, error } = await supabase
    .from("operation_sessions")
    .insert({
      started_at: new Date().toISOString(),
      start_seed_count: telemetry.seedCount,
      start_hole_count: telemetry.holeCount,
      status: "running",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(
      `Failed to create operation session: ${error.message}`
    );
  }

  console.log(
    `Operation session created: ${data.id}`
  );

  return data.id;
}

async function getRunningOperationSessionId() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("operation_sessions")
    .select("id")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to find running operation session:",
      error
    );

    return null;
  }

  return data?.id ?? null;
}

async function finishOperationSession() {
  if (!supabase) {
    throw new Error(
      "Supabase server configuration is missing"
    );
  }

  const { data: activeSession, error: sessionError } =
    await supabase
      .from("operation_sessions")
      .select("id")
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (sessionError) {
    throw new Error(
      `Failed to find active operation session: ${sessionError.message}`
    );
  }

  if (!activeSession) {
    console.log(
      "No running operation session found."
    );

    return null;
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
    .eq("id", activeSession.id);

  if (updateError) {
    throw new Error(
      `Failed to finish operation session: ${updateError.message}`
    );
  }

  console.log(
    `Operation session completed: ${activeSession.id}`
  );

  return activeSession.id;
}

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

export async function POST(request: NextRequest) {
  let client: mqtt.MqttClient | null = null;

  let command = "";
  let authenticatedUserId: string | null = null;
  let operatorName: string | null = null;
  let operatorEmail: string | null = null;

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

    // ==========================================
    // OPERATION HISTORY INTEGRATION
    // ==========================================

    let operationSessionId: number | null = null;

    if (allowedCommand === "D") {
      try {
        operationSessionId =
          await createOperationSession();
      } catch (sessionError) {
        console.error(
          "Operation session start error:",
          sessionError
        );
      }
    }

    if (allowedCommand === "S") {
      try {
        operationSessionId =
          await finishOperationSession();
      } catch (sessionError) {
        console.error(
          "Operation session stop error:",
          sessionError
        );
      }
    }

    if (
      allowedCommand !== "D" &&
      allowedCommand !== "S"
    ) {
      operationSessionId =
        await getRunningOperationSessionId();
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
    // FAILED COMMAND ACTIVITY LOG
    // ==========================================

    if (
      authenticatedUserId &&
      ALLOWED_COMMANDS.includes(
        command as AllowedCommand
      )
    ) {
      const operationSessionId =
        await getRunningOperationSessionId();

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