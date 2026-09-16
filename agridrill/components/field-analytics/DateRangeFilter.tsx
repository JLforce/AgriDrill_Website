"use client";

import { format } from "date-fns";
import { QUICK_RANGE_OPTIONS } from "@/constants/fieldAnalytics";
import { type DateRangeValue, type QuickRangeKey } from "@/types/fieldAnalytics";

interface DateRangeFilterProps {
  readonly value: DateRangeValue;
  readonly activeQuickRange: QuickRangeKey | null;
  readonly onQuickRangeSelect: (key: QuickRangeKey) => void;
  readonly onCustomChange: (next: DateRangeValue) => void;
}

export function DateRangeFilter({
  value,
  activeQuickRange,
  onQuickRangeSelect,
  onCustomChange,
}: DateRangeFilterProps) {
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="dashboard-card flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {QUICK_RANGE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onQuickRangeSelect(option.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              activeQuickRange === option.key
                ? "bg-emerald-500 text-white"
                : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <label className="flex items-center gap-2">
          From
          <input
            type="date"
            value={value.startDate}
            max={value.endDate}
            onChange={(event) => onCustomChange({ ...value, startDate: event.target.value })}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2">
          To
          <input
            type="date"
            value={value.endDate}
            min={value.startDate}
            max={today}
            onChange={(event) => onCustomChange({ ...value, endDate: event.target.value })}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none"
          />
        </label>
      </div>
    </div>
  );
}