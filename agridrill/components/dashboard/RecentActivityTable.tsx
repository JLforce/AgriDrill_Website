"use client";

import { type ActivityRecord } from "@/types/dashboard";

interface RecentActivityTableProps {
  readonly activity: readonly ActivityRecord[];
  readonly isLoading: boolean;
}

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

const COLUMN_HEADERS = ["Time", "IR1", "IR4", "Seeds", "Holes", "Speed"];

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-10 w-full rounded-2xl bg-slate-100" />
      ))}
    </div>
  );
}

export function RecentActivityTable({ activity, isLoading }: RecentActivityTableProps) {
  return (
    <section className="dashboard-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <p className="mt-1 text-sm text-slate-500">Latest machine telemetry and command activity.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recent telemetry snapshot</span>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : activity.length > 0 ? (
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
              {activity.map((row, index) => (
                <tr
                  key={`${row.time}-${row.drive_speed}-${index}`}
                  className={`rounded-2xl text-sm text-slate-700 transition hover:bg-emerald-50 ${
                    index % 2 === 0 ? "bg-slate-50" : "bg-white"
                  }`}
                >
                  <td className="rounded-l-2xl px-3 py-3 font-semibold text-slate-900">{row.time}</td>
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
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
          No telemetry received yet.
          <br />
          Waiting for ESP32...
        </div>
      )}
    </section>
  );
}
