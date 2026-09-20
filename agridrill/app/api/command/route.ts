import { NextRequest, NextResponse } from "next/server";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";

const MQTT_HOST = process.env.HIVEMQ_HOST;
const MQTT_PORT = Number(process.env.HIVEMQ_PORT || 8883);
const MQTT_USERNAME = process.env.HIVEMQ_USERNAME;
const MQTT_PASSWORD = process.env.HIVEMQ_PASSWORD;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const MQTT_TOPIC = "agridrill/control";

// Commands allowed by the AgriDrill ESP32 firmware
const ALLOWED_COMMANDS = ["F", "B", "L", "R", "S", "D"];

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

  // Prevent multiple running sessions from being created.
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

export async function POST(request: NextRequest) {
  let client: mqtt.MqttClient | null = null;

  try {
    // Check MQTT environment variables
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

    // Read JSON body
    const body = await request.json();
    const command = String(
      body.command || ""
    )
      .trim()
      .toUpperCase();

    // Validate command
    if (!command) {
      return NextResponse.json(
        {
          success: false,
          error: "Command is required",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_COMMANDS.includes(command)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid command: ${command}`,
          allowedCommands: ALLOWED_COMMANDS,
        },
        { status: 400 }
      );
    }

    console.log(
      `Publishing command: ${command}`
    );
    console.log(`MQTT topic: ${MQTT_TOPIC}`);

    // Connect to HiveMQ Cloud using secure MQTT (TLS)
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

    // Wait until MQTT connection is established
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

    // Publish command to ESP32 topic
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
          command,
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
              `Command published successfully: ${command} → ${MQTT_TOPIC}`
            );

            resolve();
          }
        );
      }
    );

    // Close MQTT connection after publishing
    client.end();

    // ==========================================
    // OPERATION HISTORY INTEGRATION
    // ==========================================

    if (command === "D") {
      try {
        await createOperationSession();
      } catch (sessionError) {
        console.error(
          "Operation session start error:",
          sessionError
        );

        // The machine command was already published
        // successfully, so we do not fail the command.
      }
    }

    if (command === "S") {
      try {
        await finishOperationSession();
      } catch (sessionError) {
        console.error(
          "Operation session stop error:",
          sessionError
        );

        // The machine STOP command was already
        // published successfully.
      }
    }

    return NextResponse.json({
      success: true,
      command,
      topic: MQTT_TOPIC,
      message:
        "Command published successfully",
    });
  } catch (error) {
    console.error(
      "MQTT command error:",
      error
    );

    // Safely close MQTT connection if an error occurs
    if (client) {
      client.end(true);
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