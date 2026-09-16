"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { type TelemetryRow } from "@/types/dashboard";

interface FieldRecordsTableProps {
  readonly rows: readonly TelemetryRow[];
  readonly isLoading: boolean;
  readonly truncated: boolean;
}

const PAGE_SIZE = 15;
const COLUMN_HEADERS = ["Time", "IR1", "IR4", "Seeds", "Holes", "Drive Value"];

function StatusBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        value ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${value ? "bg-emerald-500" : "bg-slate-400"}`} aria-hidden="true" />
      {value ? "ON" : "OFF"}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="h-10 w-full rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

export function FieldRecordsTable({ rows, isLoading, truncated }: FieldRecordsTableProps) {
  const [page, setPage] = useState(0);

  // Most recent record first, matching the Recent Activity table's convention.
  const orderedRows = useMemo(() => [...rows].reverse(), [rows]);
  const pageCount = Math.max(1, Math.ceil(orderedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = orderedRows.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="dashboard-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Field Records</h2>
          <p className="mt-1 text-sm text-slate-500">Detailed telemetry records for the selected date range.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {orderedRows.length} record{orderedRows.length === 1 ? "" : "s"}
          {truncated ? " (range truncated)" : ""}
        </span>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : orderedRows.length > 0 ? (
        <>
          <div className="max-h-96 overflow-auto rounded-2xl">
            <table className="min-w-225 w-full border-separate border-spacing-y-2 text-left">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {COLUMN_HEADERS.map((header) => (
                    <th key={header} className="bg-white px-3 py-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <tr
                    key={`${row.created_at}-${index}`}
                    className={`rounded-2xl text-sm text-slate-700 transition hover:bg-emerald-50 ${
                      index % 2 === 0 ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">
                      {format(parseISO(row.created_at), "MMM d, yyyy HH:mm:ss")}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge value={row.ir1} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge value={row.ir4} />
                    </td>
                    <td className="px-3 py-3 tabular-nums">{row.seed_count}</td>
                    <td className="px-3 py-3 tabular-nums">{row.hole_count}</td>
                    <td className="rounded-r-2xl px-3 py-3 tabular-nums">{row.drive_speed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {currentPage + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(pageCount - 1, prev + 1))}
              disabled={currentPage >= pageCount - 1}
              className="rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
          No telemetry records for this date range.
        </div>
      )}
    </section>
  );
}