import { type SensorStatus } from "@/types/dashboard";

/** Supabase table that stores telemetry rows. */
export const TELEMETRY_TABLE = "telemetry_events";

/** Realtime channel name used for the telemetry_events INSERT subscription. */
export const TELEMETRY_CHANNEL = "telemetry-events";

/** How many rows to pull for the initial load / Recent Activity table. */
export const ACTIVITY_ROW_LIMIT = 10;

/** Below this many seconds since last telemetry, the machine is considered LIVE. */
export const LIVE_THRESHOLD_SECONDS = 10;

/** Below this many seconds (and above LIVE), the machine is considered DELAYED. Above it, OFFLINE. */
export const DELAYED_THRESHOLD_SECONDS = 30;

/** Max drive speed value used to compute the drive speed progress bar. */
export const MAX_DRIVE_SPEED = 255;

/** Sensor metadata — index/label/telemetry key stay in sync with MachineTelemetry's ir1-ir4 fields. */
export const SENSOR_DEFINITIONS: readonly Omit<SensorStatus, "value">[] = [
  { index: 1, label: "IR Sensor 1", telemetryKey: "ir1" },
  { index: 2, label: "IR Sensor 2", telemetryKey: "ir2" },
  { index: 3, label: "IR Sensor 3", telemetryKey: "ir3" },
  { index: 4, label: "IR Sensor 4", telemetryKey: "ir4" },
];
