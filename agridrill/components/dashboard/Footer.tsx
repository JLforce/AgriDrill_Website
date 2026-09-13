"use client";

import { FiActivity, FiShield } from "react-icons/fi";

interface FooterProps {
  readonly pageReady: boolean;
}

export function Footer({ pageReady }: FooterProps) {
  return (
    <footer
      className={`border-t border-[#1e293b] bg-[#0f172a] transition-all duration-700 delay-300 ${
        pageReady ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="mx-auto flex w-full max-w-375 flex-col gap-5 px-6 py-5 text-sm text-[#94a3b8] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#334155] bg-[#1e293b] text-[#6ee7b7] shadow-inner">
            <FiActivity className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">AgriDrill Dashboard</p>
            <p className="mt-1 text-xs text-[#64748b]">Mission control interface</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <span className="inline-flex items-center gap-2 font-semibold text-[#a7f3d0]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34d399]" />
            </span>
            Link stable
          </span>
          <span className="inline-flex items-center gap-2 text-[#94a3b8]">
            <FiShield className="h-3.5 w-3.5 text-[#64748b]" aria-hidden="true" />
            Protected telemetry
          </span>
          <span className="border-l border-[#334155] pl-5 text-[#64748b]">Build v2.1</span>
        </div>
      </div>
    </footer>
  );
}
