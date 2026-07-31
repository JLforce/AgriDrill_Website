"use client";

import { useEffect, useState } from "react";
import { FiRadio } from "react-icons/fi";
import { getConnectionStatus } from "@/utils/connectionStatus";
import { formatFullTimestamp } from "@/utils/formatTime";

interface DashboardHeaderProps {
  readonly lastSeenIso: string | null;
}

const STATE_BADGE_CLASSES: Record<"live" | "delayed" | "offline", string> = {
  live: "text-emerald-700",
  delayed: "text-amber-700",
  offline: "text-slate-500",
};

const STATE_DOT_CLASSES: Record<"live" | "delayed" | "offline", string> = {
  live: "bg-emerald-500",
  delayed: "bg-amber-500",
  offline: "bg-rose-500",
};

export function DashboardHeader({ lastSeenIso }: DashboardHeaderProps) {
  // Re-render every second so the LIVE/DELAYED/OFFLINE badge stays accurate
  // even when no new telemetry is arriving.
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const status = getConnectionStatus(lastSeenIso);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
            <FiRadio className="h-3.5 w-3.5" aria-hidden="true" />
            Machine Control Center
          </p>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">AgriDrill Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Real-Time Machine Monitoring &amp; Control</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:items-end">
          <div className={`inline-flex items-center gap-2 text-sm font-semibold ${STATE_BADGE_CLASSES[status.state]}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${STATE_DOT_CLASSES[status.state]} ${status.state === "live" ? "animate-pulse" : ""}`} />
            <span aria-hidden="true">{status.emoji}</span>
            {status.label}
          </div>
          <p className="text-xs text-slate-500">
            Last updated: {lastSeenIso ? formatFullTimestamp(lastSeenIso) : "--"}
          </p>
        </div>
      </div>
    </section>
  );
}
