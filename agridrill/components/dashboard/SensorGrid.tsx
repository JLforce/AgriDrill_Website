"use client";

import { FiShield } from "react-icons/fi";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { SENSOR_DEFINITIONS } from "@/constants/dashboard";
import { type MachineTelemetry } from "@/types/dashboard";

interface SensorGridProps {
  readonly telemetry: MachineTelemetry | null;
  readonly lastUpdatedIso: string | null;
  readonly hasTelemetry: boolean;
}

export function SensorGrid({ telemetry, lastUpdatedIso, hasTelemetry }: SensorGridProps) {
  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      {/* On phones the badge moves under the title instead of squeezing it */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Live Sensor Monitoring</h2>
          <p className="mt-1 text-sm text-slate-500">Real-time sensor data received from the AgriDrill machine.</p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          <FiShield className="h-3.5 w-3.5" aria-hidden="true" />
          IR Status
        </span>
      </div>

      {hasTelemetry && telemetry ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
          {SENSOR_DEFINITIONS.filter(({ telemetryKey }) => telemetryKey === "ir1" || telemetryKey === "ir4").map((definition) => (
            <SensorCard
              key={definition.telemetryKey}
              sensor={{ ...definition, value: telemetry[definition.telemetryKey] }}
              lastUpdatedIso={lastUpdatedIso}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
          No telemetry received yet.
          <br />
          Waiting for ESP32...
        </div>
      )}
    </div>
  );
}
