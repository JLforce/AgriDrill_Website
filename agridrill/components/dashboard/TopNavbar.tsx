"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { topNavLinks, topNavRoutes } from "@/constants/navigation";

interface TopNavbarProps {
  readonly pageReady: boolean;
}

export function TopNavbar({ pageReady }: TopNavbarProps) {
  const router = useRouter();

  return (
    <nav
      className={`sticky top-0 z-40 border-b border-[#e5e7eb] bg-[#f3f4f6] shadow-sm backdrop-blur transition-all duration-700 ${
        pageReady ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      <div className="mx-auto flex w-full max-w-375 items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Image
            src="/agridrill-logo.png"
            alt="AgriDrill logo"
            width={36}
            height={36}
            className="rounded-lg border border-[#e5e7eb] bg-white object-contain p-1 shadow-sm"
          />
          <div className="flex flex-col justify-center">
            <span className="text-base font-bold tracking-wide text-[#334155] leading-tight">AgriDrill</span>
            <span className="text-[12px] leading-none text-[#64748b]">Mission Suite</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-2 py-1 shadow-sm">
            {topNavLinks.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => router.push(topNavRoutes[item])}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                  index === 0 ? "bg-[#334155] text-white shadow" : "text-[#334155] hover:bg-[#f3f4f6] hover:text-[#1e293b]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <span className="mb-2 flex min-w-0 items-center gap-1.5 rounded-full border border-[#d1fae5] bg-[#f0fdf4] px-3 py-1 text-[12px] font-semibold text-[#166634] sm:mb-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 13a10 10 0 0 1 14 0" />
              <path d="M8.5 16.5a5 5 0 0 1 7 0" />
              <path d="M12 20h.01" />
              <path d="M2 8.82a15 15 0 0 1 20 0" />
            </svg>
            Wi-Fi | Supabase Realtime
            <span className="ml-1 h-2 w-2 rounded-full bg-[#16a34a]" />
          </span>
          <button
            type="button"
            className="mb-2 min-w-22.5 rounded-lg border border-[#b91c1c] bg-[#e6252f] px-4 py-2 text-xs font-extrabold tracking-wide text-white shadow-sm transition hover:bg-[#991b1b] sm:mb-0"
          >
            E-STOP
          </button>
          <button
            type="button"
            onClick={() => router.push("/notifications")}
            className="relative flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#64748b] shadow-md transition hover:bg-[#f3f4f6] hover:text-[#334155]"
            style={{ width: 44, height: 44, minWidth: 40, minHeight: 40 }}
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border-2 border-white bg-[#e6252f] shadow-md" />
          </button>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-base font-semibold text-[#334155] shadow transition hover:bg-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ width: 44, height: 44, minWidth: 44, minHeight: 44 }}
            aria-label="Profile"
          >
            JR
          </button>
        </div>
      </div>
    </nav>
  );
}
