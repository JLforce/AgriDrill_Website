"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { type TelemetryRow } from "@/types/dashboard";
import { EmptyChartState } from "@/components/field-analytics/EmptyChartState";

interface DriveSpeedChartProps {
  readonly rows: readonly TelemetryRow[];
}

interface ChartDatum {
  readonly label: string;
  readonly drive_speed: number;
}

function toChartData(rows: readonly TelemetryRow[]): ChartDatum[] {
  return rows.map((row) => ({
    label: format(parseISO(row.created_at), "MMM d, HH:mm"),
    drive_speed: row.drive_speed,
  }));
}

export function DriveSpeedChart({ rows }: DriveSpeedChartProps) {
  const data = toChartData(rows);

  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Drive Speed Over Time</h2>
        <p className="mt-1 text-sm text-slate-500">
          Raw drive value reported by the machine. This reflects the firmware&apos;s drive command, not a calibrated
          physical speed.
        </p>
      </div>

      {data.length > 0 ? (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", fontSize: 12 }}
                labelStyle={{ fontWeight: 600, color: "#0f172a" }}
                formatter={(value: number) => [value, "Drive Value"]}
              />
              <Line type="monotone" dataKey="drive_speed" name="Drive Value" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChartState />
      )}
    </div>
  );
}