"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { format, subDays } from "date-fns";
import { FiActivity } from "react-icons/fi";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { DateRangeFilter } from "@/components/field-analytics/DateRangeFilter";
import { ExportCsvButton } from "@/components/field-analytics/ExportCsvButton";
import { FieldAnalyticsMetrics } from "@/components/field-analytics/FieldAnalyticsMetrics";
import { HolesSeedsChart } from "@/components/field-analytics/HolesSeedsChart";
import { DriveSpeedChart } from "@/components/field-analytics/DriveSpeedChart";
import { SensorActivityChart } from "@/components/field-analytics/SensorActivityChart";
import { FieldRecordsTable } from "@/components/field-analytics/FieldRecordsTable";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useFieldAnalytics } from "@/hooks/useFieldAnalytics";
import { DEFAULT_QUICK_RANGE } from "@/constants/fieldAnalytics";
import {
  type DateRangeValue,
  type QuickRangeKey,
} from "@/types/fieldAnalytics";

// Fallback start date for the "All time" quick range — there is no stored
// "earliest telemetry" value to query for, so this is a generously early
// fixed floor rather than an invented data field.
const ALL_TIME_START = "2020-01-01";

function buildQuickRange(key: QuickRangeKey): DateRangeValue {
  const today = format(new Date(), "yyyy-MM-dd");

  switch (key) {
    case "7d":
      return {
        startDate: format(
          subDays(new Date(), 6),
          "yyyy-MM-dd"
        ),
        endDate: today,
      };

    case "30d":
      return {
        startDate: format(
          subDays(new Date(), 29),
          "yyyy-MM-dd"
        ),
        endDate: today,
      };

    case "90d":
      return {
        startDate: format(
          subDays(new Date(), 89),
          "yyyy-MM-dd"
        ),
        endDate: today,
      };

    case "all":
    default:
      return {
        startDate: ALL_TIME_START,
        endDate: today,
      };
  }
}

function SectionLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-xs sm:tracking-[0.25em]">
      {children}
    </p>
  );
}

export default function FieldAnalyticsPage() {
  const supabase = useMemo(
    () => getSupabaseBrowserClient(),
    []
  );

  const [dateRange, setDateRange] =
    useState<DateRangeValue>(() =>
      buildQuickRange(DEFAULT_QUICK_RANGE)
    );

  const [activeQuickRange, setActiveQuickRange] =
    useState<QuickRangeKey | null>(
      DEFAULT_QUICK_RANGE
    );

  const {
    rows,
    summary,
    previousSummary,
    dailyBuckets,
    isLoading,
    error,
    truncated,
  } = useFieldAnalytics(
    supabase,
    dateRange
  );

  const handleQuickRangeSelect = useCallback(
    (key: QuickRangeKey) => {
      setActiveQuickRange(key);
      setDateRange(buildQuickRange(key));
    },
    []
  );

  const handleCustomChange = useCallback(
    (next: DateRangeValue) => {
      setActiveQuickRange(null);
      setDateRange(next);
    },
    []
  );

  return (
    <DashboardShell>
      <div className="min-w-0 space-y-6 sm:space-y-8">
        <header className="flex items-center gap-3 sm:gap-4">
          <div className="shrink-0 rounded-2xl border border-slate-200 bg-white p-2.5 text-emerald-600 shadow-sm sm:p-3">
            <FiActivity
              className="h-5 w-5 sm:h-6 sm:w-6"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Field Analytics
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:mt-1.5 sm:text-sm">
              Historical planting and machine performance
              for AgriDrill.
            </p>
          </div>
        </header>

        <section className="space-y-3">
          <SectionLabel>Filters</SectionLabel>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <DateRangeFilter
                value={dateRange}
                activeQuickRange={activeQuickRange}
                onQuickRangeSelect={
                  handleQuickRangeSelect
                }
                onCustomChange={handleCustomChange}
              />
            </div>

            {/* Full-width export button on phones, natural width from sm up */}
            <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
              <ExportCsvButton
                rows={rows}
                disabled={isLoading}
              />
            </div>
          </div>
        </section>

        {error ? (
          <div className="break-words rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="min-w-0 space-y-3">
          <SectionLabel>Overview</SectionLabel>

          <FieldAnalyticsMetrics
            summary={summary}
            previousSummary={previousSummary}
            dailyBuckets={dailyBuckets}
            isLoading={isLoading}
          />
        </section>

        <section className="min-w-0 space-y-3">
          <SectionLabel>Trends</SectionLabel>

          <div className="min-w-0 space-y-4 sm:space-y-6">
            <div className="min-w-0">
              <HolesSeedsChart rows={rows} />
            </div>
            <div className="min-w-0">
              <DriveSpeedChart rows={rows} />
            </div>
          </div>
        </section>

        <section className="min-w-0 space-y-3">
          <SectionLabel>Sensors</SectionLabel>

          <div className="min-w-0">
            <SensorActivityChart
              rows={rows}
              ir1ActivePercent={summary.ir1ActivePercent}
              ir4ActivePercent={summary.ir4ActivePercent}
            />
          </div>
        </section>

        <section className="min-w-0 space-y-3">
          <SectionLabel>Records</SectionLabel>

          {/* Keeps a wide table from stretching the whole page sideways */}
          <div className="min-w-0 max-w-full overflow-x-auto">
            <FieldRecordsTable
              rows={rows}
              isLoading={isLoading}
              truncated={truncated}
            />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
