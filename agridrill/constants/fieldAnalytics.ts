import { type QuickRangeKey } from "@/types/fieldAnalytics";

/** Max rows pulled per query for Field Analytics (protects against unbounded historical scans). */
export const FIELD_ANALYTICS_ROW_LIMIT = 5000;

/** Default quick-select date range shown when the page first loads. */
export const DEFAULT_QUICK_RANGE: QuickRangeKey = "7d";

export const QUICK_RANGE_OPTIONS: ReadonlyArray<{ key: QuickRangeKey; label: string }> = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "all", label: "All time" },
];

export const CSV_FILENAME_PREFIX = "agridrill-field-analytics";