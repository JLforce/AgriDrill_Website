interface EmptyChartStateProps {
  readonly message?: string;
}

export function EmptyChartState({ message = "No telemetry recorded for this date range." }: EmptyChartStateProps) {
  return (
    <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}