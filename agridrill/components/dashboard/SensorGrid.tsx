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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Live Sensor Monitoring</h2>
          <p className="mt-1 text-sm text-slate-500">Real-time sensor data received from the AgriDrill machine.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          <FiShield className="h-3.5 w-3.5" aria-hidden="true" />
          IR Status
        </span>
      </div>

      {hasTelemetry && telemetry ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SENSOR_DEFINITIONS.map((definition) => (
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
