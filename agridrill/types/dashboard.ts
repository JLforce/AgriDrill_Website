import { type IconType } from "react-icons";

/**
 * Raw telemetry fields as they exist on the `telemetry_events` table.
 * Keep this in sync with the Supabase schema — do not rename fields
 * without updating the ESP32 -> MQTT -> Edge Function pipeline.
 */
export interface MachineTelemetry {
  readonly ir1: boolean;
  readonly ir2: boolean;
  readonly ir3: boolean;
  readonly ir4: boolean;
  readonly battery_percent: number;
  readonly seed_count: number;
  readonly hole_count: number;
  readonly drive_speed: number;
}

/**
 * Raw row shape returned by Supabase for `telemetry_events`.
 * Same fields as MachineTelemetry plus the row's created_at timestamp.
 */
export interface TelemetryRow extends MachineTelemetry {
  readonly created_at: string;
}

/** Live connection state derived from how recently telemetry arrived. */
export type ConnectionState = "live" | "delayed" | "offline";

export interface MachineConnection {
  readonly state: ConnectionState;
  readonly lastSeenIso: string | null;
}

export interface ActivityRecord {
  readonly time: string;
  readonly battery_percent: number;
  readonly ir1: boolean;
  readonly ir2: boolean;
  readonly ir3: boolean;
  readonly ir4: boolean;
  readonly seed_count: number;
  readonly hole_count: number;
  readonly drive_speed: number;
}

/** Command values accepted by /api/command. Do not change without updating the firmware/MQTT contract. */
export type Command = "F" | "B" | "L" | "R" | "S" | "D";

export type CardTone = "success" | "warning" | "danger" | "neutral";

export interface MetricCardData {
  readonly title: string;
  /** Static display value, used as-is when numericValue is not provided (e.g. "ONLINE"). */
  readonly value: string;
  /** When provided, the card animates from 0 toward this number instead of showing `value` statically. */
  readonly numericValue?: number;
  /** Appended after the animated number, e.g. "%". */
  readonly suffix?: string;
  readonly note: string;
  readonly icon: IconType;
  readonly tone: CardTone;
  readonly progress?: number;
}

export interface OperationStat {
  readonly label: string;
  readonly value: string;
  readonly numericValue?: number;
  readonly suffix?: string;
  readonly icon: IconType;
  readonly progress?: number;
}

export interface SensorStatus {
  readonly index: number;
  readonly label: string;
  readonly telemetryKey: keyof Pick<MachineTelemetry, "ir1" | "ir2" | "ir3" | "ir4">;
  readonly value: boolean;
}

export interface NavLinkItem {
  readonly label: string;
  readonly route: string;
}

export type ToastVariant = "success" | "error" | "info";

export interface ToastMessage {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly variant: ToastVariant;
}