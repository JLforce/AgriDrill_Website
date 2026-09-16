export interface DateRangeValue {
  readonly startDate: string; // yyyy-MM-dd
  readonly endDate: string; // yyyy-MM-dd
}

export type QuickRangeKey = "7d" | "30d" | "90d" | "all";

export interface FieldAnalyticsSummary {
  readonly totalHoles: number;
  readonly totalSeeds: number;
  readonly completionRate: number;
  readonly averageDriveValue: number;
  readonly ir1ActivePercent: number;
  readonly ir4ActivePercent: number;
  readonly recordCount: number;
}