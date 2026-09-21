"use client";

type SeedlingEmptyModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function SeedlingEmptyModal({
  open,
  onClose,
}: SeedlingEmptyModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="seedling-empty-title"
        aria-describedby="seedling-empty-description"
      >
        <div className="flex items-center gap-4 border-b border-amber-200 bg-amber-50 px-6 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-7 w-7 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 17h.01"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.3 3.7 2.6 17a2 2 0 0 0 1.73 3h15.34a2 2 0 0 0 1.73-3L13.7 3.7a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>

          <div>
            <h2
              id="seedling-empty-title"
              className="text-xl font-bold text-amber-800"
            >
              No Seedling Detected
            </h2>

            <p className="mt-1 text-sm font-medium text-amber-700">
              Conveyor supply alert
            </p>
          </div>
        </div>

        <div className="px-6 py-7">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p
              id="seedling-empty-description"
              className="text-sm leading-6 text-slate-700"
            >
              No seedling is currently detected on the conveyor.
              Please refill the seedling supply before continuing
              the planting operation.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3">
            <span className="text-sm font-medium text-slate-500">
              Machine Status
            </span>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              PROCESS COMPLETE
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}