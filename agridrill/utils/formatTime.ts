/** Formats an ISO timestamp as a short clock time, e.g. "10:43 AM". */
export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Formats an ISO timestamp as a full date + time, e.g. "Jul 29, 2026, 10:43:12 AM". */
export function formatFullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Seconds elapsed between an ISO timestamp and "now". Returns null if timestamp is missing/invalid. */
export function secondsSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 1000));
}