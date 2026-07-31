import { DELAYED_THRESHOLD_SECONDS, LIVE_THRESHOLD_SECONDS } from "@/constants/dashboard";
import { type ConnectionState } from "@/types/dashboard";
import { secondsSince } from "@/utils/formatTime";

export interface ConnectionStatusInfo {
  readonly state: ConnectionState;
  readonly label: string;
  readonly emoji: string;
}

const STATUS_LABELS: Record<ConnectionState, ConnectionStatusInfo> = {
  live: { state: "live", label: "LIVE", emoji: "🟢" },
  delayed: { state: "delayed", label: "DELAYED", emoji: "🟡" },
  offline: { state: "offline", label: "OFFLINE", emoji: "🔴" },
};

/**
 * Derives connection state from the last telemetry timestamp.
 * < LIVE_THRESHOLD_SECONDS  -> live
 * < DELAYED_THRESHOLD_SECONDS -> delayed
 * otherwise, or no timestamp -> offline
 */
export function getConnectionStatus(lastSeenIso: string | null): ConnectionStatusInfo {
  const elapsed = secondsSince(lastSeenIso);

  if (elapsed === null) {
    return STATUS_LABELS.offline;
  }
  if (elapsed < LIVE_THRESHOLD_SECONDS) {
    return STATUS_LABELS.live;
  }
  if (elapsed < DELAYED_THRESHOLD_SECONDS) {
    return STATUS_LABELS.delayed;
  }
  return STATUS_LABELS.offline;
}