import { NextRequest, NextResponse } from "next/server";
import mqtt from "mqtt";

const MQTT_HOST = process.env.HIVEMQ_HOST;
const MQTT_PORT = Number(process.env.HIVEMQ_PORT || 8883);
const MQTT_USERNAME = process.env.HIVEMQ_USERNAME;
const MQTT_PASSWORD = process.env.HIVEMQ_PASSWORD;

const MQTT_TOPIC = "agridrill/control";

// Commands allowed by the AgriDrill ESP32 firmware
const ALLOWED_COMMANDS = ["F", "B", "L", "R", "S", "D"];

export async function POST(request: NextRequest) {
  let client: mqtt.MqttClient | null = null;

  try {
    // Check MQTT environment variables
    if (!MQTT_HOST || !MQTT_USERNAME || !MQTT_PASSWORD) {
      console.error("Missing HiveMQ environment variables");

      return NextResponse.json(
        {
          success: false,
          error: "MQTT configuration is missing on the server",
        },
        { status: 500 }
      );
    }

    // Read JSON body
    const body = await request.json();
    const command = String(body.command || "").trim().toUpperCase();

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

    console.log(`Publishing command: ${command}`);
    console.log(`MQTT topic: ${MQTT_TOPIC}`);

    // Connect to HiveMQ Cloud using secure MQTT (TLS)
    client = mqtt.connect(`mqtts://${MQTT_HOST}:${MQTT_PORT}`, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      protocol: "mqtts",
      reconnectPeriod: 0,
      connectTimeout: 10000,
    });

    // Wait until MQTT connection is established
    await new Promise<void>((resolve, reject) => {
      if (!client) {
        reject(new Error("MQTT client was not created"));
        return;
      }

      const connectionTimeout = setTimeout(() => {
        reject(new Error("MQTT connection timed out"));
      }, 10000);

      client.once("connect", () => {
        clearTimeout(connectionTimeout);
        console.log("Connected to HiveMQ Cloud");
        resolve();
      });

      client.once("error", (error) => {
        clearTimeout(connectionTimeout);
        reject(error);
      });
    });

    // Publish command to ESP32 topic
    await new Promise<void>((resolve, reject) => {
      if (!client) {
        reject(new Error("MQTT client is not available"));
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
    });

    // Close MQTT connection after publishing
    client.end();

    return NextResponse.json({
      success: true,
      command,
      topic: MQTT_TOPIC,
      message: "Command published successfully",
    });
  } catch (error) {
    console.error("MQTT command error:", error);

    // Safely close MQTT connection if an error occurs
    if (client) {
      client.end(true);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to publish command to HiveMQ",
      },
      { status: 500 }
    );
  }
}