"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { type TelemetryRow } from "@/types/dashboard";
import { EmptyChartState } from "@/components/field-analytics/EmptyChartState";

interface HolesSeedsChartProps {
  readonly rows: readonly TelemetryRow[];
}

interface ChartDatum {
  readonly label: string;
  readonly hole_count: number;
  readonly seed_count: number;
}

function toChartData(rows: readonly TelemetryRow[]): ChartDatum[] {
  return rows.map((row) => ({
    label: format(parseISO(row.created_at), "MMM d, HH:mm"),
    hole_count: row.hole_count,
    seed_count: row.seed_count,
  }));
}

export function HolesSeedsChart({ rows }: HolesSeedsChartProps) {
  const data = toChartData(rows);

  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Holes &amp; Seeds Over Time</h2>
        <p className="mt-1 text-sm text-slate-500">Cumulative holes drilled and seeds planted across the selected range.</p>
      </div>

      {data.length > 0 ? (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: "#0f172a" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="hole_count" name="Holes" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="seed_count" name="Seeds" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChartState />
      )}
    </div>
  );
}