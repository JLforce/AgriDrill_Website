"use client";

import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { useNotifications } from "@/hooks/useNotifications";
import { formatFullTimestamp } from "@/utils/formatTime";

export default function NotificationPage() {
  const { notifications, isLoading, error } = useNotifications();

  return (
    <main className="min-h-screen bg-[#e5e7eb] text-[#1f2937]">
      <TopNavbar pageReady={true} />
      <section className="mx-auto w-full max-w-375 p-4 lg:p-6">
        <div className="rounded-2xl border border-[#d1d5db] bg-[#f3f4f6] p-5 shadow-sm lg:p-6">
          <div>
            <h1 className="text-2xl font-bold text-[#334155]">Notifications</h1>
            <p className="mt-2 text-sm text-[#64748b]">AgriDrill system notifications</p>
          </div>

          {isLoading ? (
            <p className="mt-6 rounded-xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#64748b]">
              Loading notifications...
            </p>
          ) : error ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error}
            </p>
          ) : notifications.length === 0 ? (
            <p className="mt-6 rounded-xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#64748b]">
              No notifications yet.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm ${
                    notification.is_read
                      ? "border-[#e5e7eb]"
                      : "border-red-200 bg-red-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden="true">🚨</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-[#334155]">{notification.message}</h2>
                        {!notification.is_read ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-[#64748b]">
                        An obstacle has been detected by the AgriDrill system.
                      </p>
                      <time
                        dateTime={notification.created_at}
                        className="mt-3 block text-xs text-[#64748b]"
                      >
                        {formatFullTimestamp(notification.created_at)}
                      </time>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}