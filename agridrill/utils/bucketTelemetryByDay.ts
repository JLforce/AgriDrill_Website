import { format, parseISO } from "date-fns";
import { type TelemetryRow } from "@/types/dashboard";

/** One day's worth of derived stats, used to draw KPI card sparklines. */
export interface DailyBucket {
  readonly dateKey: string; // yyyy-MM-dd
  readonly holeCount: number;
  readonly seedCount: number;
  readonly completionRate: number;
  readonly averageDriveValue: number;
}

/**
 * Groups telemetry rows by calendar day and derives per-day stats.
 * hole_count / seed_count are cumulative counters, so each day's value is
 * the max observed that day; drive_speed is averaged for the day.
 */
export function bucketTelemetryByDay(rows: readonly TelemetryRow[]): DailyBucket[] {
  const byDay = new Map<string, TelemetryRow[]>();

  rows.forEach((row) => {
    const dateKey = format(parseISO(row.created_at), "yyyy-MM-dd");
    const existing = byDay.get(dateKey);
    if (existing) {
      existing.push(row);
    } else {
      byDay.set(dateKey, [row]);
    }
  });

  return Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([dateKey, dayRows]) => {
      const holeCount = dayRows.reduce((max, row) => Math.max(max, row.hole_count), 0);
      const seedCount = dayRows.reduce((max, row) => Math.max(max, row.seed_count), 0);
      const completionRate = holeCount > 0 ? (seedCount / holeCount) * 100 : 0;
      const averageDriveValue = dayRows.reduce((sum, row) => sum + row.drive_speed, 0) / dayRows.length;

      return { dateKey, holeCount, seedCount, completionRate, averageDriveValue };
    });
}