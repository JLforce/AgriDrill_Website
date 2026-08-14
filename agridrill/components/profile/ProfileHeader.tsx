import { User } from "lucide-react";

export default function ProfileHeader() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Profile
          </h1>

          <p className="text-slate-400">
            Manage your AgriDrill operator account information,
            account security, and system details.
          </p>
        </div>

        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 animate-ping rounded-2xl bg-emerald-500/20" />

          {/* Icon badge */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <User className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>
    </section>
  );
}