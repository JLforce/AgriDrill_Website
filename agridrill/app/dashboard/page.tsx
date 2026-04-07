"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const primaryNav = [
  { label: "Operations Dashboard", route: "/dashOperations" },
  { label: "Robot Control", route: "/control" },
  { label: "Field Configuration", route: "/configuration" },
  { label: "Seedling Magazine", route: "/magazine" },
  { label: "Session History", route: "/history" },
  { label: "Session Detail", route: "/history-detail" },
  { label: "Alerts & Fault Logs", route: "/alerts" },

];

const secondaryNav = [
  { label: "Settings", route: "/settings" },
  { label: "Profile", route: "/profile" },
];

const topNavLinks = ["Dashboard", "Camera", "Sensor", "Calibration", "Data Export"];

const topNavRoutes = {
  Dashboard: "/dashboard",
  Camera: "/camera",
  Sensor: "/sensor-debug",
  Calibration: "/calibration",
  "Data Export": "/export",
};

const stats = [
  { label: "Holes Drilled", value: "1,240", hint: "+12% from session start" },
  { label: "Battery Level", value: "85%", hint: "Stable output" },
  { label: "Operating Mode", value: "AUTO", hint: "Satellite Guidance Active" },
  { label: "System Status", value: "ACTIVE", hint: "Continuous operation: 02h 45m" },
];

type NavItemProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function NavItem({ label, active = false, onClick }: NavItemProps) {
  const className = `block w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition duration-150 cursor-pointer ${
    active
      ? "bg-[#2f3742] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(243,244,246,0.12)]"
      : "text-[#a5b1c2] hover:bg-[#1f2937] hover:text-[#d1d5db]"
  }`;

  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}

function DashboardContent() {
  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Mission Control</h1>
          <span className="rounded-full border border-[#cbd5e1] bg-[#e5e7eb] px-3 py-1 text-xs font-semibold text-[#334155]">
            LIVE CONNECTED
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
            Alerts
          </button>
          <button type="button" className="rounded-full border border-[#cbd5e1] bg-[#e5e7eb] px-3 py-2 text-xs text-[#334155]">
            JR
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* Minimal summary cards only, no detailed/duplicated info */}
        <article className="rounded-xl border border-[#d1d5db] bg-[#f8fafc] p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#78978d]">HOLES DRILLED</p>
          <p className="mt-4 text-4xl font-bold leading-none tabular-nums text-[#123d32]">1,240</p>
          <p className="mt-3 text-xs leading-relaxed text-[#78978d]">+12% from session start</p>
        </article>
        <article className="rounded-xl border border-[#d1d5db] bg-[#f8fafc] p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#78978d]">BATTERY LEVEL</p>
          <p className="mt-4 text-4xl font-bold leading-none tabular-nums text-[#123d32]">85%</p>
          <p className="mt-3 text-xs leading-relaxed text-[#78978d]">Stable output</p>
          <div className="mt-3 h-2 w-full rounded-full bg-[#d9e6f1]">
            <div className="h-full w-[72%] rounded-full bg-[#23d7a3]" />
          </div>
        </article>
        <article className="rounded-xl border border-[#d1d5db] bg-[#f8fafc] p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#78978d]">OPERATING MODE</p>
          <p className="mt-4 text-4xl font-bold leading-none tabular-nums text-[#10946d]">AUTO</p>
          <p className="mt-3 text-xs leading-relaxed text-[#78978d]">Satellite Guidance Active</p>
        </article>
        <article className="rounded-xl border border-[#d1d5db] bg-[#f8fafc] p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#78978d]">SYSTEM STATUS</p>
          <p className="mt-4 text-4xl font-bold leading-none tabular-nums text-[#123d32]">ACTIVE</p>
          <p className="mt-3 text-xs leading-relaxed text-[#78978d]">Continuous operation: 02h 45m</p>
          <span className="mt-3 inline-block rounded-md bg-[#dcf8ee] px-2 py-1 text-xs font-semibold text-[#108d69]">
            ACTIVE
          </span>
        </article>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          className="rounded-xl border border-[#1eb68d] bg-[#19c393] px-6 py-8 text-sm font-extrabold tracking-widest text-[#02241e] shadow-[0_0_24px_rgba(25,195,147,0.25)] transition hover:brightness-110"
        >
          START
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-6 py-8 text-sm font-extrabold tracking-widest text-[#334155] transition hover:bg-[#e2e8f0]"
        >
          STOP
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-6 py-8 text-sm font-extrabold tracking-widest text-[#334155] transition hover:bg-[#e2e8f0]"
        >
          RESUME
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#ae2d35] bg-[#e6252f] px-6 py-8 text-sm font-extrabold tracking-widest text-white shadow-[0_0_28px_rgba(230,37,47,0.35)] transition hover:brightness-110"
        >
          E-STOP
        </button>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activePage, setActivePage] = useState("Dashboard");
  const [renderPage, setRenderPage] = useState("Dashboard");
  const [pageReady, setPageReady] = useState(false);
  const [panelVisible, setPanelVisible] = useState(true);

  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setPageReady(true);
    }, 20);

    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (activePage === renderPage) {
      return;
    }


    const panelTimer = setTimeout(() => {
      setPanelVisible(false);
      setRenderPage(activePage);
      setPanelVisible(true);
    }, 0);

    return () => clearTimeout(panelTimer);
  }, [activePage, renderPage]);

  const activeRoute = useMemo(() => {
    const selected = primaryNav.find((item) => item.label === renderPage);
    return selected?.route ?? null;
  }, [renderPage]);

  return (
    <main className="min-h-screen bg-[#e5e7eb] text-[#1f2937]">
      <nav
        className={`sticky top-0 z-40 border-b border-[#e5e7eb] bg-[#f3f4f6] shadow-sm backdrop-blur transition-all duration-700 ${
          pageReady ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="mx-auto flex w-full max-w-375 items-center justify-between gap-4 px-4 py-3">
          {/* Logo and Title */}
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
              <span className="text-[12px] text-[#64748b] leading-none">Mission Suite</span>
            </div>
          </div>

          {/* Top Navigation Links */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-2 py-1 shadow-sm">
              {topNavLinks.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => router.push(topNavRoutes[item as keyof typeof topNavRoutes])}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition cursor-pointer ${
                    index === 0
                      ? "bg-[#334155] text-white shadow"
                      : "text-[#334155] hover:bg-[#f3f4f6] hover:text-[#1e293b]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Status, E-STOP, Notifications, User */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <span className="flex items-center gap-1.5 rounded-full border border-[#d1fae5] bg-[#f0fdf4] px-3 py-1 text-[12px] font-semibold text-[#166534] min-w-0 mb-2 sm:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              className="rounded-lg border border-[#b91c1c] bg-[#e6252f] px-4 py-2 text-xs font-extrabold tracking-wide text-white shadow-sm transition hover:bg-[#991b1b] min-w-[90px] mb-2 sm:mb-0"
            >
              E-STOP
            </button>
            <button
              type="button"
              onClick={() => router.push('/notifications')}
              className="relative rounded-full border border-[#e5e7eb] bg-white text-[#64748b] shadow-md transition hover:bg-[#f3f4f6] hover:text-[#334155] flex items-center justify-center min-w-[40px] min-h-[40px]"
              style={{ width: 44, height: 44, minWidth: 40, minHeight: 40 }}
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#e6252f] border-2 border-white shadow-md" />
            </button>
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="rounded-full border border-[#e5e7eb] bg-white text-base font-semibold text-[#334155] shadow flex items-center justify-center transition hover:bg-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ width: 44, height: 44, minWidth: 44, minHeight: 44 }}
              aria-label="Profile"
            >
              JR
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto grid w-full max-w-375 gap-4 p-4 lg:grid-cols-[250px_1fr]">
        <aside
          className={`hidden rounded-2xl border border-[#1f2937] bg-[#111827] p-3 lg:flex lg:min-h-[92vh] lg:flex-col transition-all duration-700 delay-100 ${
            pageReady ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
          }`}
        >
          <div className="mb-6 rounded-xl bg-[#0f172a] p-4">
            <div className="flex items-center gap-2">
              <Image
                src="/agridrill-logo.png"
                alt="AgriDrill logo"
                width={28}
                height={28}
                className="rounded-md border border-[#334155] bg-[#111827] object-contain p-1"
              />
              <p className="text-xl font-extrabold tracking-tight text-white">AgriDrill</p>
            </div>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-[#94a3b8]">Operator Panel</p>
          </div>

          <div className="space-y-1">
            {primaryNav.map((item) => (
              <NavItem
                key={item.label}
                label={item.label}
                active={activePage === item.label}
                onClick={() => setActivePage(item.label)}
              />
            ))}
          </div>

          <div className="my-5 h-px bg-[#1f2937]" />

          <div className="space-y-1">
            {secondaryNav.map((item) => (
              <NavItem
                key={item.label}
                label={item.label}
                active={activePage === item.label}
                onClick={() => {
                  if (item.label === "Settings") {
                    router.push("/settings");
                  } else if (item.label === "Profile") {
                    router.push("/profile");
                  } else {
                    setActivePage(item.label);
                  }
                }}
              />
            ))}
          </div>

          <div className="mt-auto rounded-xl border border-[#1f2937] bg-[#0f172a] p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">System Link</p>
            <p className="mt-2 text-xs text-[#cbd5e1]">LAT: 45.523062</p>
            <p className="text-xs text-[#cbd5e1]">LON: -122.676482</p>
          </div>
        </aside>

        <section
          className={`rounded-2xl border border-[#d1d5db] bg-[#f3f4f6] p-4 lg:p-6 transition-all duration-700 delay-200 ${
            pageReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div
            className={`transition-all duration-200 ${
              panelVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            {activeRoute ? (
              <div className="h-[80vh] overflow-hidden rounded-xl border border-[#cbd5e1] bg-white">
                <iframe
                  title={`${renderPage} page`}
                  src={activeRoute}
                  className="h-full w-full"
                />
              </div>
            ) : (
              <DashboardContent />
            )}
          </div>
        </section>
      </div>

      <footer
        className={`border-t border-[#d1d5db] bg-[#f3f4f6] transition-all duration-700 delay-300 ${
          pageReady ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="mx-auto flex w-full max-w-375 flex-wrap items-center justify-between gap-3 px-6 py-3 text-xs text-[#75958b]">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold tracking-widest text-[#1f4f42]">AGRIDRILL DASHBOARD</span>
            <span className="text-[#c5ddd6]">|</span>
            <span>Mission Control UI Layer</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#cbd5e1] bg-[#e5e7eb] px-2.5 py-1 text-[11px] font-semibold text-[#334155]">
              LINK STABLE
            </span>
            <span>Build v2.1</span>
            <span className="text-[#c5ddd6]">|</span>
            <span>Last sync: 14:31:09</span>
          </div>
        </div>
      </footer>
    </main>
  );
}