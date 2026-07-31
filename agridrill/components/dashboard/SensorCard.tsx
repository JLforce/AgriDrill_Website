"use client";

import { memo } from "react";
import { FiPause, FiPlay } from "react-icons/fi";
import { type SensorStatus } from "@/types/dashboard";
import { formatFullTimestamp } from "@/utils/formatTime";

interface SensorCardProps {
  readonly sensor: SensorStatus;
  readonly lastUpdatedIso: string | null;
}

function SensorCardBase({ sensor, lastUpdatedIso }: SensorCardProps) {
  const detected = sensor.value;

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {sensor.label}
            <span className="ml-1.5 text-xs font-normal text-slate-400">#{sensor.index}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">Telemetry key: {sensor.telemetryKey}</p>
        </div>
        <span
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full ${
            detected ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
          }`}
        >
          {detected ? (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" aria-hidden="true" />
          ) : null}
          {detected ? <FiPlay className="relative h-4 w-4" aria-hidden="true" /> : <FiPause className="relative h-4 w-4" aria-hidden="true" />}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className={`text-lg font-extrabold tracking-wide ${detected ? "text-emerald-700" : "text-slate-600"}`}>
          {detected ? "DETECTED" : "CLEAR"}
        </p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            detected ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
          }`}
        >
          {String(detected)}
        </span>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Last updated: {lastUpdatedIso ? formatFullTimestamp(lastUpdatedIso) : "--"}
      </p>
    </article>
  );
}

export const SensorCard = memo(SensorCardBase);
