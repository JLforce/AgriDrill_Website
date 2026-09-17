"use client";

import { FiDownload } from "react-icons/fi";
import { type TelemetryRow } from "@/types/dashboard";
import { exportTelemetryCsv } from "@/utils/exportTelemetryCsv";

interface ExportCsvButtonProps {
  readonly rows: readonly TelemetryRow[];
  readonly disabled?: boolean;
}

export function ExportCsvButton({ rows, disabled }: ExportCsvButtonProps) {
  const handleExport = () => {
    if (rows.length === 0) return;
    exportTelemetryCsv(rows);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled || rows.length === 0}
      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      <FiDownload className="h-4 w-4" aria-hidden="true" />
      Export CSV
    </button>
  );
}