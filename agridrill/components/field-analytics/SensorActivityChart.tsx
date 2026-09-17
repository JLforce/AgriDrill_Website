"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { type TelemetryRow } from "@/types/dashboard";
import { EmptyChartState } from "@/components/field-analytics/EmptyChartState";

interface SensorActivityChartProps {
  readonly rows: readonly TelemetryRow[];
  readonly ir1ActivePercent: number;
  readonly ir4ActivePercent: number;
}

interface ChartDatum {
  readonly label: string;
  readonly ir1: number;
  readonly ir4: number;
}

function toChartData(rows: readonly TelemetryRow[]): ChartDatum[] {
  return rows.map((row) => ({
    label: format(parseISO(row.created_at), "MMM d, HH:mm"),
    ir1: row.ir1 ? 1 : 0,
    ir4: row.ir4 ? 1 : 0,
  }));
}

function SensorSummaryPill({ label, percent }: { label: string; percent: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
      {label}: {Math.round(percent)}% ON
    </span>
  );
}

export function SensorActivityChart({ rows, ir1ActivePercent, ir4ActivePercent }: SensorActivityChartProps) {
  const data = toChartData(rows);

  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sensor Activity</h2>
          <p className="mt-1 text-sm text-slate-500">IR1 / IR4 digital sensor states across the selected range.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SensorSummaryPill label="IR1" percent={ir1ActivePercent} />
          <SensorSummaryPill label="IR4" percent={ir4ActivePercent} />
        </div>
      </div>

      {data.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={24} />
              <YAxis
                domain={[0, 1]}
                ticks={[0, 1]}
                tickFormatter={(value: number) => (value === 1 ? "ON" : "OFF")}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: "#0f172a" }}
                formatter={(value) => (value === 1 ? "ON" : "OFF")}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="stepAfter" dataKey="ir1" name="IR1" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="stepAfter" dataKey="ir4" name="IR4" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChartState />
      )}
    </div>
  );
}