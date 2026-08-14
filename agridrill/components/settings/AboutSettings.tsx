import { Info } from "lucide-react";

export default function AboutSettings() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center gap-3">
        <Info className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">About AgriDrill</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Project and system information.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
            Project
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
            AgriDrill Mission Suite
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
            Team
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
            TRI-SQUAD
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
            Adviser
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
            Engr. Lindl Michael Enario
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-500">
            Institution
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
            Cebu Institute of Technology - University
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-500">
          AgriDrill Mission Suite · Semi - Autonomous agricultural drilling/planting and
          monitoring system
        </p>
      </div>
    </section>
  );
}