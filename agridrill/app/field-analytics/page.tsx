"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { format, subDays } from "date-fns";
import { FiActivity } from "react-icons/fi";
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
import { type DateRangeValue, type QuickRangeKey } from "@/types/fieldAnalytics";

// Fallback start date for the "All time" quick range — there is no stored
// "earliest telemetry" value to query for, so this is a generously early
// fixed floor rather than an invented data field.
const ALL_TIME_START = "2020-01-01";

function buildQuickRange(key: QuickRangeKey): DateRangeValue {
  const today = format(new Date(), "yyyy-MM-dd");

  switch (key) {
    case "7d":
      return { startDate: format(subDays(new Date(), 6), "yyyy-MM-dd"), endDate: today };
    case "30d":
      return { startDate: format(subDays(new Date(), 29), "yyyy-MM-dd"), endDate: today };
    case "90d":
      return { startDate: format(subDays(new Date(), 89), "yyyy-MM-dd"), endDate: today };
    case "all":
    default:
      return { startDate: ALL_TIME_START, endDate: today };
  }
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{children}</p>;
}

export default function FieldAnalyticsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => buildQuickRange(DEFAULT_QUICK_RANGE));
  const [activeQuickRange, setActiveQuickRange] = useState<QuickRangeKey | null>(DEFAULT_QUICK_RANGE);

  const { rows, summary, previousSummary, dailyBuckets, isLoading, error, truncated } = useFieldAnalytics(
    supabase,
    dateRange
  );

  const handleQuickRangeSelect = useCallback((key: QuickRangeKey) => {
    setActiveQuickRange(key);
    setDateRange(buildQuickRange(key));
  }, []);

  const handleCustomChange = useCallback((next: DateRangeValue) => {
    setActiveQuickRange(null);
    setDateRange(next);
  }, []);

  return (
    <main className="min-h-screen bg-[#e5e7eb] p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-emerald-600 shadow-sm">
            <FiActivity className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Field Analytics</h1>
            <p className="mt-1.5 text-sm text-slate-500">Historical planting and machine performance for AgriDrill.</p>
          </div>
        </header>

        <section className="space-y-3">
          <SectionLabel>Filters</SectionLabel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <DateRangeFilter
                value={dateRange}
                activeQuickRange={activeQuickRange}
                onQuickRangeSelect={handleQuickRangeSelect}
                onCustomChange={handleCustomChange}
              />
            </div>
            <ExportCsvButton rows={rows} disabled={isLoading} />
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <section className="space-y-3">
          <SectionLabel>Overview</SectionLabel>
          <FieldAnalyticsMetrics
            summary={summary}
            previousSummary={previousSummary}
            dailyBuckets={dailyBuckets}
            isLoading={isLoading}
          />
        </section>

        <section className="space-y-3">
          <SectionLabel>Trends</SectionLabel>
          <div className="space-y-6">
            <HolesSeedsChart rows={rows} />
            <DriveSpeedChart rows={rows} />
          </div>
        </section>

        <section className="space-y-3">
          <SectionLabel>Sensors</SectionLabel>
          <SensorActivityChart
            rows={rows}
            ir1ActivePercent={summary.ir1ActivePercent}
            ir4ActivePercent={summary.ir4ActivePercent}
          />
        </section>

        <section className="space-y-3">
          <SectionLabel>Records</SectionLabel>
          <FieldRecordsTable rows={rows} isLoading={isLoading} truncated={truncated} />
        </section>
      </div>
    </main>
  );
}