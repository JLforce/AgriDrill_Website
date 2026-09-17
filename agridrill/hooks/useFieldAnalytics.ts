"use client";

import { useEffect, useMemo, useState } from "react";
import { type SupabaseClient } from "@supabase/supabase-js";
import { differenceInCalendarDays, endOfDay, parseISO, startOfDay, subDays } from "date-fns";
import { TELEMETRY_TABLE } from "@/constants/dashboard";
import { FIELD_ANALYTICS_ROW_LIMIT } from "@/constants/fieldAnalytics";
import { type TelemetryRow } from "@/types/dashboard";
import { type DateRangeValue, type FieldAnalyticsSummary } from "@/types/fieldAnalytics";
import { bucketTelemetryByDay, type DailyBucket } from "@/utils/bucketTelemetryByDay";

export interface UseFieldAnalyticsResult {
  readonly rows: TelemetryRow[];
  readonly summary: FieldAnalyticsSummary;
  /** Summary for the equal-length period immediately preceding the selected range, or null if unavailable. */
  readonly previousSummary: FieldAnalyticsSummary | null;
  /** Per-day derived stats for the selected range, used to draw KPI card sparklines. */
  readonly dailyBuckets: DailyBucket[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly truncated: boolean;
}

const EMPTY_SUMMARY: FieldAnalyticsSummary = {
  totalHoles: 0,
  totalSeeds: 0,
  completionRate: 0,
  averageDriveValue: 0,
  ir1ActivePercent: 0,
  ir4ActivePercent: 0,
  recordCount: 0,
};

function buildSummary(rows: TelemetryRow[]): FieldAnalyticsSummary {
  if (rows.length === 0) return EMPTY_SUMMARY;

  // hole_count / seed_count are cumulative counters reported by the machine,
  // so the period total is the highest value observed within the range
  // (rows are sorted ascending by created_at).
  const totalHoles = rows.reduce((max, row) => Math.max(max, row.hole_count), 0);
  const totalSeeds = rows.reduce((max, row) => Math.max(max, row.seed_count), 0);
  const completionRate = totalHoles > 0 ? (totalSeeds / totalHoles) * 100 : 0;

  const driveSum = rows.reduce((sum, row) => sum + row.drive_speed, 0);
  const averageDriveValue = driveSum / rows.length;

  const ir1ActiveCount = rows.filter((row) => row.ir1).length;
  const ir4ActiveCount = rows.filter((row) => row.ir4).length;

  return {
    totalHoles,
    totalSeeds,
    completionRate,
    averageDriveValue,
    ir1ActivePercent: (ir1ActiveCount / rows.length) * 100,
    ir4ActivePercent: (ir4ActiveCount / rows.length) * 100,
    recordCount: rows.length,
  };
}

async function fetchRange(
  supabase: SupabaseClient,
  fromIso: string,
  toIso: string
): Promise<{ rows: TelemetryRow[]; count: number | null; error: boolean }> {
  const { data, error, count } = await supabase
    .from(TELEMETRY_TABLE)
    .select("*", { count: "exact" })
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: true })
    .limit(FIELD_ANALYTICS_ROW_LIMIT);

  if (error) {
    return { rows: [], count: null, error: true };
  }

  return { rows: (data ?? []) as TelemetryRow[], count: count ?? null, error: false };
}

export function useFieldAnalytics(
  supabase: SupabaseClient,
  dateRange: DateRangeValue
): UseFieldAnalyticsResult {
  const [rows, setRows] = useState<TelemetryRow[]>([]);
  const [previousSummary, setPreviousSummary] = useState<FieldAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRange() {
      setIsLoading(true);
      setError(null);

      const startDate = startOfDay(parseISO(dateRange.startDate));
      const endDate = endOfDay(parseISO(dateRange.endDate));
      const spanDays = differenceInCalendarDays(endDate, startDate) + 1;

      // Comparable prior period of equal length, immediately preceding the
      // selected range, used only to compute the KPI trend indicators.
      const previousEnd = endOfDay(subDays(startDate, 1));
      const previousStart = startOfDay(subDays(previousEnd, spanDays - 1));

      const [currentResult, previousResult] = await Promise.all([
        fetchRange(supabase, startDate.toISOString(), endDate.toISOString()),
        fetchRange(supabase, previousStart.toISOString(), previousEnd.toISOString()),
      ]);

      if (cancelled) return;

      if (currentResult.error) {
        setError("Failed to load telemetry history from Supabase.");
        setRows([]);
        setPreviousSummary(null);
        setIsLoading(false);
        return;
      }

      setRows(currentResult.rows);
      setTruncated(typeof currentResult.count === "number" && currentResult.count > currentResult.rows.length);
      setPreviousSummary(
        previousResult.error || previousResult.rows.length === 0 ? null : buildSummary(previousResult.rows)
      );
      setIsLoading(false);
    }

    loadRange();

    return () => {
      cancelled = true;
    };
  }, [supabase, dateRange.startDate, dateRange.endDate]);

  const summary = useMemo(() => buildSummary(rows), [rows]);
  const dailyBuckets = useMemo(() => bucketTelemetryByDay(rows), [rows]);

  return { rows, summary, previousSummary, dailyBuckets, isLoading, error, truncated };
}