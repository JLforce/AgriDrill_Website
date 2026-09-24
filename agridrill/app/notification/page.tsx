"use client";

import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { useNotifications } from "@/hooks/useNotifications";
import { formatFullTimestamp } from "@/utils/formatTime";

function getNotificationStyle(type: string) {
  switch (type) {
    case "obstacle_detected":
      return {
        icon: "🚨",
        title: "Obstacle Detected",
        container: "border-red-200 bg-red-50",
        iconContainer: "bg-red-100 text-red-700",
        titleColor: "text-red-800",
        accent: "bg-red-500",
      };

    case "seedling_empty":
      return {
        icon: "🌱",
        title: "Seedling Unavailable",
        container: "border-amber-200 bg-amber-50",
        iconContainer: "bg-amber-100 text-amber-700",
        titleColor: "text-amber-800",
        accent: "bg-amber-500",
      };

    default:
      return {
        icon: "🔔",
        title: "System Notification",
        container: "border-slate-200 bg-white",
        iconContainer: "bg-slate-100 text-slate-700",
        titleColor: "text-slate-800",
        accent: "bg-slate-400",
      };
  }
}

export default function NotificationPage() {
  const {
    notifications,
    isLoading,
    error,
  } = useNotifications();

  return (
    <main className="min-h-screen bg-[#e5e7eb] text-[#1f2937]">
      <TopNavbar pageReady={true} />

      <section className="mx-auto w-full max-w-375 p-4 lg:p-6">
        <div className="rounded-2xl border border-[#d1d5db] bg-[#f3f4f6] p-5 shadow-sm lg:p-6">

          {/* HEADER */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#334155]">
                Notifications
              </h1>

              <p className="mt-2 text-sm text-[#64748b]">
                AgriDrill system notifications
              </p>
            </div>

            {!isLoading && !error && (
              <div className="rounded-xl border border-[#d1d5db] bg-white px-4 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">
                  Total Notifications
                </p>

                <p className="mt-1 text-xl font-bold text-[#334155]">
                  {notifications.length}
                </p>
              </div>
            )}
          </div>

          {/* LOADING */}
          {isLoading ? (
            <div className="mt-6 rounded-xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#64748b]">
              Loading notifications...
            </div>
          ) : error ? (
            /* ERROR */
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm font-semibold text-red-800">
                Unable to load notifications
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          ) : notifications.length === 0 ? (
            /* EMPTY */
            <div className="mt-6 rounded-xl border border-[#e5e7eb] bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🔔
              </div>

              <h2 className="mt-4 text-base font-semibold text-[#334155]">
                No notifications yet
              </h2>

              <p className="mt-1 text-sm text-[#64748b]">
                AgriDrill system notifications will
                appear here when events are detected.
              </p>
            </div>
          ) : (
            /* NOTIFICATIONS */
            <div className="mt-6 space-y-4">
              {notifications.map((notification) => {
                const style =
                  getNotificationStyle(
                    notification.type
                  );

                return (
                  <article
                    key={notification.id}
                    className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.container}`}
                  >
                    {/* ACCENT BAR */}
                    <div
                      className={`absolute left-0 top-0 h-full w-1.5 ${style.accent}`}
                    />

                    <div className="flex items-start gap-4 pl-2">

                      {/* ICON */}
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${style.iconContainer}`}
                        aria-hidden="true"
                      >
                        {style.icon}
                      </div>

                      {/* CONTENT */}
                      <div className="min-w-0 flex-1">
                        <h2
                          className={`font-semibold ${style.titleColor}`}
                        >
                          {style.title}
                        </h2>

                        {/* ACTUAL DATABASE MESSAGE */}
                        <p className="mt-2 text-sm leading-6 text-[#475569]">
                          {notification.message}
                        </p>

                        {/* TIMESTAMP */}
                        <time
                          dateTime={
                            notification.created_at
                          }
                          className="mt-3 block text-xs text-[#64748b]"
                        >
                          {formatFullTimestamp(
                            notification.created_at
                          )}
                        </time>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}