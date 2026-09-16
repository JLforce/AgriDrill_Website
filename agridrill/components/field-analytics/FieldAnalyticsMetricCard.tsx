"use client";

import { memo } from "react";
import { type IconType } from "react-icons";
import { FiArrowDownRight, FiArrowUpRight, FiMinus } from "react-icons/fi";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

export type MetricAccent = "sky" | "emerald" | "violet" | "amber";

export interface DeltaInfo {
  readonly direction: "up" | "down" | "flat";
  readonly label: string;
  readonly tone: "good" | "bad" | "neutral";
}

const ACCENT_CLASSES: Record<MetricAccent, { badge: string; icon: string; stroke: string }> = {
  sky: { badge: "bg-sky-50", icon: "text-sky-600", stroke: "#0ea5e9" },
  emerald: { badge: "bg-emerald-50", icon: "text-emerald-600", stroke: "#10b981" },
  violet: { badge: "bg-violet-50", icon: "text-violet-600", stroke: "#8b5cf6" },
  amber: { badge: "bg-amber-50", icon: "text-amber-600", stroke: "#f59e0b" },
};

const DELTA_TONE_CLASSES: Record<DeltaInfo["tone"], string> = {
  good: "bg-emerald-100 text-emerald-700",
  bad: "bg-rose-100 text-rose-700",
  neutral: "bg-slate-100 text-slate-500",
};

interface FieldAnalyticsMetricCardProps {
  readonly title: string;
  readonly icon: IconType;
  readonly accent: MetricAccent;
  readonly numericValue: number;
  readonly suffix?: string;
  readonly decimals?: number;
  readonly note: string;
  readonly sparkline: readonly number[];
  readonly delta: DeltaInfo | null;
  readonly isLoading?: boolean;
}

function FieldAnalyticsMetricCardSkeleton() {
  return (
    <article className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-24 rounded bg-slate-100" />
        </div>
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100" />
      </div>
      <div className="mt-5 h-12 w-full rounded-xl bg-slate-100" />
    </article>
  );
}

function DeltaBadge({ delta }: { delta: DeltaInfo }) {
  const Icon = delta.direction === "up" ? FiArrowUpRight : delta.direction === "down" ? FiArrowDownRight : FiMinus;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${DELTA_TONE_CLASSES[delta.tone]}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {delta.label}
    </span>
  );
}

function FieldAnalyticsMetricCardBase({
  title,
  icon: Icon,
  accent,
  numericValue,
  suffix,
  decimals = 0,
  note,
  sparkline,
  delta,
  isLoading,
}: FieldAnalyticsMetricCardProps) {
  const animatedValue = useAnimatedNumber(numericValue);
  const accentClasses = ACCENT_CLASSES[accent];

  if (isLoading) {
    return <FieldAnalyticsMetricCardSkeleton />;
  }

  const displayValue = `${decimals > 0 ? animatedValue.toFixed(decimals) : Math.round(animatedValue)}${suffix ?? ""}`;
  const chartData = sparkline.length > 1 ? sparkline.map((value, index) => ({ index, value })) : [];
  const gradientId = `field-analytics-spark-${accent}`;

  return (
    <article className="dashboard-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 tabular-nums">{displayValue}</p>
        </div>
        <div className={`rounded-2xl ${accentClasses.badge} p-3 ${accentClasses.icon}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {delta ? <DeltaBadge delta={delta} /> : null}
        <p className="text-sm text-slate-500">{note}</p>
      </div>

      <div className="mt-4 h-12 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentClasses.stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accentClasses.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={accentClasses.stroke}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-300">
            Not enough data for a trend
          </div>
        )}
      </div>
    </article>
  );
}

export const FieldAnalyticsMetricCard = memo(FieldAnalyticsMetricCardBase);