import { Settings } from "lucide-react";

export default function SettingsHeader() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your appearance, sessions, data, and application preferences.
          </p>
        </div>

        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 animate-ping rounded-2xl bg-emerald-400/20 dark:bg-emerald-500/20" />

          {/* Icon badge */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <Settings className="h-7 w-7 animate-[spin_6s_linear_infinite] text-white" />
          </div>
        </div>
      </div>
    </section>
  );
}