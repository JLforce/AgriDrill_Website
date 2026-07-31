"use client";

import { FiBattery, FiCpu, FiLayers, FiTarget } from "react-icons/fi";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { type ConnectionState, type MachineTelemetry, type MetricCardData } from "@/types/dashboard";

interface MetricsGridProps {
  readonly telemetry: MachineTelemetry | null;
  readonly connectionState: ConnectionState;
  readonly isLoading: boolean;
}

function buildMetricCards(telemetry: MachineTelemetry, connectionState: ConnectionState): MetricCardData[] {
  const isOnline = connectionState !== "offline";

  return [
    {
      title: "Machine Status",
      value: isOnline ? "ONLINE" : "OFFLINE",
      note: isOnline ? "Connected to MQTT" : "Machine connection lost",
      icon: FiCpu,
      tone: isOnline ? "success" : "danger",
    },
    {
      title: "Battery",
      value: `${telemetry.battery_percent}%`,
      numericValue: telemetry.battery_percent,
      suffix: "%",
      note: telemetry.battery_percent >= 80 ? "Good" : telemetry.battery_percent >= 50 ? "Moderate" : "Low",
      icon: FiBattery,
      tone: telemetry.battery_percent >= 50 ? "success" : "warning",
      progress: telemetry.battery_percent,
    },
    {
      title: "Seeds Planted",
      value: telemetry.seed_count.toString(),
      numericValue: telemetry.seed_count,
      note: "Current Session",
      icon: FiLayers,
      tone: "neutral",
    },
    {
      title: "Holes Completed",
      value: telemetry.hole_count.toString(),
      numericValue: telemetry.hole_count,
      note: "Current Session",
      icon: FiTarget,
      tone: "neutral",
    },
  ];
}

const SKELETON_KEYS = ["status", "battery", "seeds", "holes"];

export function MetricsGrid({ telemetry, connectionState, isLoading }: MetricsGridProps) {
  if (isLoading || !telemetry) {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SKELETON_KEYS.map((key) => (
          <MetricCard
            key={key}
            isLoading
            card={{ title: "", value: "", note: "", icon: FiCpu, tone: "neutral" }}
          />
        ))}
      </section>
    );
  }

  const cards = buildMetricCards(telemetry, connectionState);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <MetricCard key={card.title} card={card} />
      ))}
    </section>
  );
}
