"use client";

import { FiCheckCircle, FiLayers, FiTarget, FiTrendingUp } from "react-icons/fi";
import {
  FieldAnalyticsMetricCard,
  type DeltaInfo,
  type MetricAccent,
} from "@/components/field-analytics/FieldAnalyticsMetricCard";
import { type DailyBucket } from "@/utils/bucketTelemetryByDay";
import { type FieldAnalyticsSummary } from "@/types/fieldAnalytics";

interface FieldAnalyticsMetricsProps {
  readonly summary: FieldAnalyticsSummary;
  readonly previousSummary: FieldAnalyticsSummary | null;
  readonly dailyBuckets: readonly DailyBucket[];
  readonly isLoading: boolean;
}

const SKELETON_KEYS = ["holes", "seeds", "completion", "drive"];

function computeRelativeDelta(current: number, previous: number, goodDirection: "up" | "down"): DeltaInfo | null {
  if (previous === 0) return null;

  const changePercent = ((current - previous) / previous) * 100;

  if (Math.abs(changePercent) < 0.05) {
    return { direction: "flat", label: "No change vs prior period", tone: "neutral" };
  }

  const direction = changePercent > 0 ? "up" : "down";
  const tone: DeltaInfo["tone"] = direction === goodDirection ? "good" : "bad";
  const label = `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}% vs prior period`;

  return { direction, label, tone };
}

/** Same as computeRelativeDelta, but colored neutral regardless of direction — for metrics with no inherent "good" direction. */
function computeNeutralDelta(current: number, previous: number): DeltaInfo | null {
  const relative = computeRelativeDelta(current, previous, "up");
  return relative ? { ...relative, tone: "neutral" } : null;
}

function computePointsDelta(current: number, previous: number): DeltaInfo {
  const diff = current - previous;

  if (Math.abs(diff) < 0.05) {
    return { direction: "flat", label: "No change vs prior period", tone: "neutral" };
  }

  const direction = diff > 0 ? "up" : "down";
  const label = `${diff > 0 ? "+" : ""}${diff.toFixed(1)} pts vs prior period`;

  return { direction, label, tone: direction === "up" ? "good" : "bad" };
}

interface CardConfig {
  readonly key: string;
  readonly title: string;
  readonly icon: typeof FiTarget;
  readonly accent: MetricAccent;
  readonly numericValue: number;
  readonly suffix?: string;
  readonly decimals?: number;
  readonly note: string;
  readonly sparkline: readonly number[];
  readonly delta: DeltaInfo | null;
}

export function FieldAnalyticsMetrics({
  summary,
  previousSummary,
  dailyBuckets,
  isLoading,
}: FieldAnalyticsMetricsProps) {
  if (isLoading) {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SKELETON_KEYS.map((key) => (
          <FieldAnalyticsMetricCard
            key={key}
            title=""
            icon={FiTarget}
            accent="sky"
            numericValue={0}
            note=""
            sparkline={[]}
            delta={null}
            isLoading
          />
        ))}
      </section>
    );
  }

  const cards: CardConfig[] = [
    {
      key: "holes",
      title: "Total Holes",
      icon: FiTarget,
      accent: "sky",
      numericValue: summary.totalHoles,
      note: "Holes drilled in range",
      sparkline: dailyBuckets.map((bucket) => bucket.holeCount),
      delta: previousSummary ? computeRelativeDelta(summary.totalHoles, previousSummary.totalHoles, "up") : null,
    },
    {
      key: "seeds",
      title: "Seeds Planted",
      icon: FiLayers,
      accent: "emerald",
      numericValue: summary.totalSeeds,
      note: "Seeds planted in range",
      sparkline: dailyBuckets.map((bucket) => bucket.seedCount),
      delta: previousSummary ? computeRelativeDelta(summary.totalSeeds, previousSummary.totalSeeds, "up") : null,
    },
    {
      key: "completion",
      title: "Planting Completion Rate",
      icon: FiCheckCircle,
      accent: "violet",
      numericValue: summary.completionRate,
      suffix: "%",
      decimals: 1,
      note: "Seeds planted per hole drilled",
      sparkline: dailyBuckets.map((bucket) => bucket.completionRate),
      delta: previousSummary ? computePointsDelta(summary.completionRate, previousSummary.completionRate) : null,
    },
    {
      key: "drive",
      title: "Average Drive Value",
      icon: FiTrendingUp,
      accent: "amber",
      numericValue: summary.averageDriveValue,
      decimals: 0,
      note: "Mean raw drive value in range",
      sparkline: dailyBuckets.map((bucket) => bucket.averageDriveValue),
      delta: previousSummary ? computeNeutralDelta(summary.averageDriveValue, previousSummary.averageDriveValue) : null,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <FieldAnalyticsMetricCard
          key={card.key}
          title={card.title}
          icon={card.icon}
          accent={card.accent}
          numericValue={card.numericValue}
          suffix={card.suffix}
          decimals={card.decimals}
          note={card.note}
          sparkline={card.sparkline}
          delta={card.delta}
        />
      ))}
    </section>
  );
}