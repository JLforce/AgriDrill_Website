import "dotenv/config";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const HIVEMQ_HOST = process.env.HIVEMQ_HOST;
const HIVEMQ_PORT = Number(process.env.HIVEMQ_PORT || 8883);
const HIVEMQ_USERNAME = process.env.HIVEMQ_USERNAME;
const HIVEMQ_PASSWORD = process.env.HIVEMQ_PASSWORD;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================
// ENVIRONMENT CHECK
// ============================================================

if (
  !HIVEMQ_HOST ||
  !HIVEMQ_USERNAME ||
  !HIVEMQ_PASSWORD ||
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// ============================================================
// SUPABASE CLIENT
// (service role key: bypasses Row Level Security, so this
//  script is allowed to insert telemetry and notifications)
// ============================================================

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================
// MACHINE STATUS
// ============================================================

const MACHINE_STATUS_ID = 1;

async function updateMachineStatus(
  line1: string,
  line2: string,
  sourceMessage: string
) {
  const { error } = await supabase
    .from("machine_status")
    .update({
      line1,
      line2,
      source_message: sourceMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", MACHINE_STATUS_ID);

  if (error) {
    console.error(
      "Supabase machine status update error:",
      error
    );

    return;
  }

  console.log(
    `Machine status updated: ${line1} / ${line2}`
  );
}

// ============================================================
// ACTIVE SESSION LOOKUP
//
// The machine is physical and shared, so we find out WHO is
// operating it right now:
//   machine_status.active_session_id -> operation_sessions.user_id
//
// The result is cached for a short time so we do not query
// Supabase on every single MQTT message.
// ============================================================

type ActiveSession = {
  sessionId: number;
  userId: string;
};

const SESSION_CACHE_MS = 2000;

let cachedSession: ActiveSession | null = null;
let cachedAt = 0;

async function getActiveSession(): Promise<ActiveSession | null> {
  const now = Date.now();

  if (now - cachedAt < SESSION_CACHE_MS) {
    return cachedSession;
  }

  // 1. Which session currently owns the machine?
  const { data: status, error: statusError } = await supabase
    .from("machine_status")
    .select("active_session_id")
    .eq("id", MACHINE_STATUS_ID)
    .single();

  if (statusError) {
    console.error(
      "Supabase active session lookup error:",
      statusError
    );

    return null;
  }

  if (!status?.active_session_id) {
    cachedSession = null;
    cachedAt = now;

    return null;
  }

  // 2. Who owns that session?
  const { data: session, error: sessionError } = await supabase
    .from("operation_sessions")
    .select("id, user_id")
    .eq("id", status.active_session_id)
    .single();

  if (sessionError || !session?.user_id) {
    console.error(
      "Supabase session owner lookup error:",
      sessionError
    );

    return null;
  }

  cachedSession = {
    sessionId: session.id,
    userId: session.user_id,
  };
  cachedAt = now;

  return cachedSession;
}

// ============================================================
// NOTIFICATIONS
//
// Notifications now belong to the user who is operating the
// machine. If nobody is operating, there is nobody to notify,
// so nothing is saved.
// ============================================================

async function createNotification(
  type: string,
  message: string
): Promise<"saved" | "no_session" | "error"> {
  const session = await getActiveSession();

  if (!session) {
    console.warn(
      `No active session. Notification "${type}" not saved.`
    );

    return "no_session";
  }

  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: session.userId,
      type,
      message,
      is_read: false,
    });

  if (error) {
    console.error(
      `Supabase notification insert error (${type}):`,
      error
    );

    return "error";
  }

  return "saved";
}

// ============================================================
// MQTT CLIENT
// ============================================================

const mqttClient = mqtt.connect(
  `mqtts://${HIVEMQ_HOST}:${HIVEMQ_PORT}`,
  {
    username: HIVEMQ_USERNAME,
    password: HIVEMQ_PASSWORD,
    protocol: "mqtts",
    rejectUnauthorized: true,
  }
);

// ============================================================
// MQTT TOPIC
// ============================================================

const TELEMETRY_TOPIC = "agridrill/status";

let obstacleActive = false;

// ============================================================
// MQTT CONNECT
// ============================================================

mqttClient.on("connect", () => {
  console.log("Connected to HiveMQ Cloud.");

  mqttClient.subscribe(TELEMETRY_TOPIC, (error) => {
    if (error) {
      console.error(
        "Failed to subscribe to telemetry topic:",
        error
      );

      return;
    }

    console.log(`Subscribed to ${TELEMETRY_TOPIC}`);
    console.log("Waiting for AgriDrill telemetry...");
  });
});

// ============================================================
// MQTT MESSAGE
// ============================================================

mqttClient.on("message", async (topic, message) => {
  if (topic !== TELEMETRY_TOPIC) {
    return;
  }

  const payload = message.toString().trim();

  console.log("MQTT message received:", payload);

  // ==========================================================
  // MACHINE LCD-STYLE STATUS
  // ==========================================================

  if (payload === "MQTT CLOUD CONNECTED") {
    await updateMachineStatus(
      "MQTT",
      "CONNECTED",
      payload
    );

    return;
  }

  if (payload === "AGRIDRILL START REQUEST RECEIVED") {
    await updateMachineStatus(
      "AGRI DRILL",
      "START",
      payload
    );

    return;
  }

  if (payload === "HOMING ACTUATOR") {
    await updateMachineStatus(
      "HOMING",
      "RETRACTING...",
      payload
    );

    return;
  }

  if (payload === "DRILL DOWN") {
    await updateMachineStatus(
      "DRILL",
      "DOWN",
      payload
    );

    return;
  }

  if (payload === "DRILL UP") {
    await updateMachineStatus(
      "DRILL",
      "UP",
      payload
    );

    return;
  }

  // ==========================================================
  // OBSTACLE DETECTED
  // ==========================================================

  if (payload === "Obstacle Detected") {
    if (obstacleActive) {
      console.log(
        "Obstacle already active. Duplicate ignored."
      );

      return;
    }

    // Lock immediately so repeated ESP32 messages
    // cannot create duplicate notifications.
    obstacleActive = true;

    // Update the Web machine display.
    await updateMachineStatus(
      "OBSTACLE",
      "WAITING",
      payload
    );

    // Create the notification for the operator's
    // obstacle modal.
    const result = await createNotification(
      "obstacle_detected",
      "An obstacle has been detected by the AgriDrill machine."
    );

    if (result !== "saved") {
      // Allow another obstacle event to be processed
      // if nothing was saved.
      obstacleActive = false;

      return;
    }

    console.log(
      "Obstacle notification saved to Supabase."
    );

    return;
  }

  // ==========================================================
  // OBSTACLE CLEARED
  // ==========================================================

  if (payload === "Obstacle Cleared") {
    obstacleActive = false;

    await updateMachineStatus(
      "PATH CLEAR",
      "RESUMING",
      payload
    );

    console.log(
      "Obstacle cleared. Ready for the next obstacle."
    );

    return;
  }

  // ==========================================================
  // OTHER MACHINE STATUS
  // ==========================================================

  if (
    payload ===
    "FORWARD REQUESTED: EXECUTING SWEEP FIRST"
  ) {
    await updateMachineStatus(
      "STEER",
      "SWEEPING...",
      payload
    );

    return;
  }

  if (
    payload ===
    "SWEEP DONE: TRACKS ENGAGED FORWARD"
  ) {
    await updateMachineStatus(
      "MOVE",
      "FORWARD",
      payload
    );

    return;
  }

  if (payload === "MOVING BACKWARD") {
    await updateMachineStatus(
      "BACKWARD",
      "MOVING",
      payload
    );

    return;
  }

  if (payload === "TURN LEFT") {
    await updateMachineStatus(
      "TURN",
      "LEFT",
      payload
    );

    return;
  }

  if (payload === "TURN RIGHT") {
    await updateMachineStatus(
      "TURN",
      "RIGHT",
      payload
    );

    return;
  }

  // ==========================================================
  // SEEDLING EMPTY
  // ==========================================================

  if (payload === "Seedling Empty") {
    // Update the Web machine display.
    await updateMachineStatus(
      "PROCESS",
      "COMPLETE",
      payload
    );

    // Create the seedling-empty notification
    // for the operator.
    const result = await createNotification(
      "seedling_empty",
      "No seedling detected on the conveyor. Please refill the seedling supply."
    );

    if (result === "saved") {
      console.log(
        "Seedling-empty notification saved to Supabase."
      );
    }

    return;
  }

  if (payload === "ALL STOPPED") {
    await updateMachineStatus(
      "SYSTEM",
      "STOPPED",
      payload
    );

    return;
  }

  // ----------------------------------------------------------
  // Parse current ESP32 telemetry format:
  //
  // IR1:1 IR4:0 SeedCount:10 HoleCount:8 Drive:255
  // ----------------------------------------------------------

  const ir1Match = payload.match(/IR1:(\d+)/);
  const ir4Match = payload.match(/IR4:(\d+)/);
  const seedCountMatch =
    payload.match(/SeedCount:(\d+)/);
  const holeCountMatch =
    payload.match(/HoleCount:(\d+)/);
  const driveMatch =
    payload.match(/Drive:(\d+)/);

  // ----------------------------------------------------------
  // Ignore messages that are not telemetry
  // ----------------------------------------------------------

  if (
    !ir1Match ||
    !ir4Match ||
    !seedCountMatch ||
    !holeCountMatch ||
    !driveMatch
  ) {
    console.log(
      "Message is not a telemetry payload. Ignoring."
    );

    return;
  }

  // ----------------------------------------------------------
  // Convert values
  // ----------------------------------------------------------

  const ir1 = Number(ir1Match[1]) === 1;
  const ir4 = Number(ir4Match[1]) === 1;

  const seedCount = Number(seedCountMatch[1]);
  const holeCount = Number(holeCountMatch[1]);
  const driveSpeed = Number(driveMatch[1]);

  console.log("Parsed telemetry:", {
    ir1,
    ir4,
    seedCount,
    holeCount,
    driveSpeed,
  });

  // ----------------------------------------------------------
  // Find out which user's session this telemetry belongs to.
  // If nobody is operating the machine, do not save it, so it
  // can never show up on another user's dashboard.
  // ----------------------------------------------------------

  const session = await getActiveSession();

  if (!session) {
    console.log(
      "No active operation session. Telemetry ignored."
    );

    return;
  }

  // ----------------------------------------------------------
  // Insert telemetry into Supabase, linked to the session
  // ----------------------------------------------------------

  const { error } = await supabase
    .from("telemetry_events")
    .insert({
      operation_session_id: session.sessionId,
      ir1,
      ir4,
      seed_count: seedCount,
      hole_count: holeCount,
      drive_speed: driveSpeed,
    });

  if (error) {
    console.error(
      "Supabase telemetry insert error:",
      error
    );

    return;
  }

  console.log(
    `Telemetry saved to Supabase (session ${session.sessionId}).`
  );
});

// ============================================================
// MQTT ERROR
// ============================================================

mqttClient.on("error", (error) => {
  console.error("MQTT error:", error);
});

// ============================================================
// MQTT CLOSE
// ============================================================

mqttClient.on("close", () => {
  console.log("MQTT connection closed.");
});

// ============================================================
// MQTT RECONNECT
// ============================================================

mqttClient.on("reconnect", () => {
  console.log(
    "Attempting to reconnect to HiveMQ Cloud..."
  );
});