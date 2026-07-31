"use client";

interface FooterProps {
  readonly pageReady: boolean;
}

export function Footer({ pageReady }: FooterProps) {
  return (
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
          <span className="rounded-full border border-[#cbd5e1] bg-[#e5e7eb] px-2.5 py-1 text-[11px] font-semibold text-[#334155]">LINK STABLE</span>
          <span>Build v2.1</span>
          <span className="text-[#c5ddd6]">|</span>
          <span>Last sync: 14:31:09</span>
        </div>
      </div>
    </footer>
  );
}
