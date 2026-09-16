import Papa from "papaparse";
import { format } from "date-fns";
import { type TelemetryRow } from "@/types/dashboard";
import { CSV_FILENAME_PREFIX } from "@/constants/fieldAnalytics";

interface CsvRow {
  readonly created_at: string;
  readonly ir1: string;
  readonly ir4: string;
  readonly seed_count: number;
  readonly hole_count: number;
  readonly drive_speed: number;
}

function toCsvRow(row: TelemetryRow): CsvRow {
  return {
    created_at: row.created_at,
    ir1: row.ir1 ? "ON" : "OFF",
    ir4: row.ir4 ? "ON" : "OFF",
    seed_count: row.seed_count,
    hole_count: row.hole_count,
    drive_speed: row.drive_speed,
  };
}

export function exportTelemetryCsv(rows: readonly TelemetryRow[]): void {
  const csv = Papa.unparse(rows.map(toCsvRow));
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${CSV_FILENAME_PREFIX}-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}