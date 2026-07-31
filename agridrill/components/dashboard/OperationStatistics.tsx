"use client";

import { FiBattery, FiGrid, FiLayers, FiTarget, FiZap } from "react-icons/fi";
import { MAX_DRIVE_SPEED } from "@/constants/dashboard";
import { type MachineTelemetry, type OperationStat } from "@/types/dashboard";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { getProgressColor, toneForPercent } from "@/utils/progressColor";

interface OperationStatisticsProps {
  readonly telemetry: MachineTelemetry | null;
  readonly isLoading: boolean;
}

function buildStats(telemetry: MachineTelemetry): OperationStat[] {
  return [
    { label: "Battery Percentage", value: `${telemetry.battery_percent}%`, numericValue: telemetry.battery_percent, suffix: "%", progress: telemetry.battery_percent, icon: FiBattery },
    { label: "Seed Count", value: telemetry.seed_count.toString(), numericValue: telemetry.seed_count, icon: FiLayers },
    { label: "Hole Count", value: telemetry.hole_count.toString(), numericValue: telemetry.hole_count, icon: FiTarget },
    {
      label: "Drive Speed",
      value: telemetry.drive_speed.toString(),
      numericValue: telemetry.drive_speed,
      progress: Math.min(100, Math.max(0, Math.round((telemetry.drive_speed / MAX_DRIVE_SPEED) * 100))),
      icon: FiZap,
    },
  ];
}

function StatCard({ stat }: { stat: OperationStat }) {
  const Icon = stat.icon;
  const animated = useAnimatedNumber(stat.numericValue ?? 0);
  const displayValue = stat.numericValue !== undefined ? `${Math.round(animated)}${stat.suffix ?? ""}` : stat.value;
  const tone = stat.progress !== undefined ? toneForPercent(stat.progress) : "neutral";

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 tabular-nums">{displayValue}</p>
        </div>
        <div className="rounded-2xl bg-white p-2 text-slate-700 shadow-sm">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      {stat.progress !== undefined ? (
        <div className="mt-4 space-y-2">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(tone)}`}
              style={{ width: `${stat.progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">{stat.progress}% of expected range</p>
        </div>
      ) : null}
    </article>
  );
}

function StatCardSkeleton() {
  return (
    <article className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="h-3 w-24 rounded bg-slate-200" />
      <div className="mt-3 h-7 w-14 rounded bg-slate-200" />
      <div className="mt-4 h-2.5 w-full rounded-full bg-slate-200" />
    </article>
  );
}

const SKELETON_KEYS = ["battery", "seeds", "holes", "speed"];

export function OperationStatistics({ telemetry, isLoading }: OperationStatisticsProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Operation Statistics</h2>
          <p className="mt-1 text-sm text-slate-500">Core telemetry fields used by the machine UI.</p>
        </div>
        <FiGrid className="mt-1 h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {isLoading || !telemetry
          ? SKELETON_KEYS.map((key) => <StatCardSkeleton key={key} />)
          : buildStats(telemetry).map((stat) => <StatCard key={stat.label} stat={stat} />)}
      </div>
    </div>
  );
}
