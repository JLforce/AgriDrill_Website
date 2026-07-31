"use client";

import { memo } from "react";
import { type MetricCardData } from "@/types/dashboard";
import { getProgressColor } from "@/utils/progressColor";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

const TONE_DOT_CLASSES: Record<MetricCardData["tone"], string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "",
};

interface MetricCardProps {
  readonly card: MetricCardData;
  readonly isLoading?: boolean;
}

function MetricCardSkeleton() {
  return (
    <article className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-20 rounded bg-slate-100" />
        </div>
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-100" />
      </div>
    </article>
  );
}

function MetricCardBase({ card, isLoading }: MetricCardProps) {
  const Icon = card.icon;
  const animatedValue = useAnimatedNumber(card.numericValue ?? 0);

  if (isLoading) {
    return <MetricCardSkeleton />;
  }

  const displayValue =
    card.numericValue !== undefined ? `${Math.round(animatedValue)}${card.suffix ?? ""}` : card.value;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.title}</p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{displayValue}</p>
            {card.tone !== "neutral" ? (
              <span
                className={`mb-1 inline-flex h-2.5 w-2.5 rounded-full ${TONE_DOT_CLASSES[card.tone]}`}
                aria-hidden="true"
              />
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-500">{card.note}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>

      {card.progress !== undefined ? (
        <div className="mt-5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(card.tone)}`}
              style={{ width: `${card.progress}%` }}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export const MetricCard = memo(MetricCardBase);
