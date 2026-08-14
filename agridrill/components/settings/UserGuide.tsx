import { BookOpen, Keyboard } from "lucide-react";

const guideTopics = [
  {
    title: "Getting Started",
    description:
      "Log in with your email/password or Google account, then you'll land on the Dashboard, where you can monitor telemetry and send commands to the AgriDrill unit.",
  },
  {
    title: "Using the Dashboard",
    description:
      "The Dashboard shows live sensor readings, operation statistics, and recent activity. Use the Robot Control panel to send drilling and movement commands.",
  },
  {
    title: "Emergency Stop",
    description:
      "The E-STOP button in the top navigation immediately halts all robot operations. Use it any time the unit needs to stop for safety.",
  },
  {
    title: "Managing Your Profile",
    description:
      "Visit the Profile page to update your name, phone, location, and avatar, or change your password if you signed up with email and password.",
  },
];

const shortcuts = [
  { keys: "Ctrl/Cmd + K", action: "Open search (where available)" },
  { keys: "Esc", action: "Close open modals/dialogs" },
];

export default function UserGuide() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">User Guide</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Quick reference for using the AgriDrill platform.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {guideTopics.map((topic) => (
          <div
            key={topic.title}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
          >
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {topic.title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {topic.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
        <div className="mb-3 flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Keyboard Shortcuts
          </h3>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800/40"
            >
              <span className="text-sm text-slate-600 dark:text-slate-400">{s.action}</span>
              <kbd className="rounded bg-slate-200 px-2 py-1 font-mono text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}