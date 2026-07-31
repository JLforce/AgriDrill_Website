import "dotenv/config";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";

// ======================================================
// 1. GET ENVIRONMENT VARIABLES
// ======================================================

const HIVEMQ_HOST = process.env.HIVEMQ_HOST;
const HIVEMQ_PORT = Number(process.env.HIVEMQ_PORT || 8883);
const HIVEMQ_USERNAME = process.env.HIVEMQ_USERNAME;
const HIVEMQ_PASSWORD = process.env.HIVEMQ_PASSWORD;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// ======================================================
// 2. CHECK REQUIRED ENVIRONMENT VARIABLES
// ======================================================

if (
  !HIVEMQ_HOST ||
  !HIVEMQ_USERNAME ||
  !HIVEMQ_PASSWORD ||
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "❌ Missing required environment variables."
  );

  console.error(
    "Please check your .env.local file."
  );

  process.exit(1);
}

// ======================================================
// 3. CREATE SUPABASE CLIENT
// ======================================================

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// ======================================================
// 4. CONNECT TO HIVEMQ CLOUD
// ======================================================

const mqttUrl = `mqtts://${HIVEMQ_HOST}:${HIVEMQ_PORT}`;

const mqttClient = mqtt.connect(mqttUrl, {
  username: HIVEMQ_USERNAME,
  password: HIVEMQ_PASSWORD,
  protocol: "mqtts",
  rejectUnauthorized: true,
});

// ======================================================
// 5. WHEN CONNECTED TO HIVEMQ
// ======================================================

mqttClient.on("connect", () => {
  console.log("");
  console.log("=================================");
  console.log("✅ Connected to HiveMQ Cloud");
  console.log("=================================");

  // Subscribe to ESP32 telemetry
  mqttClient.subscribe(
    "agridrill/status",
    { qos: 0 },
    (error) => {
      if (error) {
        console.error(
          "❌ MQTT subscription failed:"
        );

        console.error(error);

        return;
      }

      console.log(
        "📡 Subscribed to: agridrill/status"
      );

      console.log(
        "⏳ Waiting for ESP32 telemetry..."
      );
    }
  );
});

// ======================================================
// 6. RECEIVE TELEMETRY FROM ESP32
// ======================================================

mqttClient.on(
  "message",
  async (topic, message) => {
    try {
      // Convert MQTT message to normal text
      const payload = message
        .toString()
        .trim();

      console.log("");
      console.log(
        "================================="
      );

      console.log(
        "📡 MQTT MESSAGE RECEIVED"
      );

      console.log(
        "================================="
      );

      console.log(
        "Topic:",
        topic
      );

      console.log(
        "Message:",
        payload
      );

      // ==================================================
      // 7. PARSE ESP32 TELEMETRY
      // ==================================================
      //
      // Expected message:
      //
      // IR1:1 IR2:1 IR3:0 IR4:0
      // Battery:100 SeedCount:0
      // HoleCount:0 Drive:255
      //
      // ==================================================

      const ir1Match =
        payload.match(/IR1:(\d+)/);

      const ir2Match =
        payload.match(/IR2:(\d+)/);

      const ir3Match =
        payload.match(/IR3:(\d+)/);

      const ir4Match =
        payload.match(/IR4:(\d+)/);

      const batteryMatch =
        payload.match(/Battery:(\d+)/);

      const seedCountMatch =
        payload.match(/SeedCount:(\d+)/);

      const holeCountMatch =
        payload.match(/HoleCount:(\d+)/);

      const driveMatch =
        payload.match(/Drive:(\d+)/);

      // ==================================================
      // 8. CHECK IF ALL TELEMETRY VALUES EXIST
      // ==================================================

      if (
        !ir1Match ||
        !ir2Match ||
        !ir3Match ||
        !ir4Match ||
        !batteryMatch ||
        !seedCountMatch ||
        !holeCountMatch ||
        !driveMatch
      ) {
        console.log(
          "⚠️ Invalid telemetry format."
        );

        console.log(
          "Expected format:"
        );

        console.log(
          "IR1:1 IR2:1 IR3:0 IR4:0 Battery:100 SeedCount:0 HoleCount:0 Drive:255"
        );

        return;
      }

      // ==================================================
      // 9. CONVERT TELEMETRY VALUES
      // ==================================================

      const ir1 =
        Number(ir1Match[1]) === 1;

      const ir2 =
        Number(ir2Match[1]) === 1;

      const ir3 =
        Number(ir3Match[1]) === 1;

      const ir4 =
        Number(ir4Match[1]) === 1;

      const batteryPercent =
        Number(batteryMatch[1]);

      const seedCount =
        Number(seedCountMatch[1]);

      const holeCount =
        Number(holeCountMatch[1]);

      const driveSpeed =
        Number(driveMatch[1]);

      // ==================================================
      // 10. SHOW PARSED TELEMETRY
      // ==================================================

      console.log("");
      console.log(
        "📊 Parsed telemetry:"
      );

      console.log(
        "IR1:",
        ir1
      );

      console.log(
        "IR2:",
        ir2
      );

      console.log(
        "IR3:",
        ir3
      );

      console.log(
        "IR4:",
        ir4
      );

      console.log(
        "Battery:",
        batteryPercent
      );

      console.log(
        "Seed Count:",
        seedCount
      );

      console.log(
        "Hole Count:",
        holeCount
      );

      console.log(
        "Drive Speed:",
        driveSpeed
      );

      // ==================================================
      // 11. SAVE TELEMETRY TO SUPABASE
      // ==================================================

      const {
        data,
        error,
      } = await supabase
        .from("telemetry_events")
        .insert({
          ir1: ir1,
          ir2: ir2,
          ir3: ir3,
          ir4: ir4,
          battery_percent:
            batteryPercent,
          seed_count:
            seedCount,
          hole_count:
            holeCount,
          drive_speed:
            driveSpeed,
        })
        .select()
        .single();

      // ==================================================
      // 12. CHECK FOR SUPABASE ERROR
      // ==================================================

      if (error) {
        console.error("");
        console.error(
          "❌ Failed to save telemetry to Supabase:"
        );

        console.error(error);

        return;
      }

      // ==================================================
      // 13. SUCCESS
      // ==================================================

      console.log("");
      console.log(
        "================================="
      );

      console.log(
        "✅ TELEMETRY SAVED TO SUPABASE"
      );

      console.log(
        "================================="
      );

      console.log(
        "Database row:",
        data
      );

    } catch (error) {
      console.error("");
      console.error(
        "❌ Error processing MQTT message:"
      );

      console.error(error);
    }
  }
);

// ======================================================
// 14. MQTT ERROR HANDLER
// ======================================================

mqttClient.on(
  "error",
  (error) => {
    console.error("");
    console.error(
      "❌ MQTT connection error:"
    );

    console.error(error);
  }
);

// ======================================================
// 15. MQTT CONNECTION CLOSED
// ======================================================

mqttClient.on(
  "close",
  () => {
    console.log(
      "⚠️ MQTT connection closed."
    );
  }
);

// ======================================================
// 16. MQTT RECONNECTING
// ======================================================

mqttClient.on(
  "reconnect",
  () => {
    console.log(
      "🔄 Attempting to reconnect to HiveMQ..."
    );
  }
);