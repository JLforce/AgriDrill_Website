"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { primaryNav, secondaryNav } from "@/constants/navigation";

interface NavItemProps {
  readonly label: string;
  readonly active?: boolean;
  readonly onClick?: () => void;
}

function NavItem({ label, active = false, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`block w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#111827] ${
        active
          ? "bg-[#2f3742] text-white font-semibold shadow-[inset_0_0_0_1px_rgba(243,244,246,0.12)]"
          : "text-[#a5b1c2] hover:bg-[#1f2937] hover:text-[#d1d5db]"
      }`}
    >
      {label}
    </button>
  );
}

interface SidebarProps {
  readonly activePage: string;
  readonly onSelectPage: (label: string) => void;
  readonly pageReady: boolean;
}

export function Sidebar({ activePage, onSelectPage, pageReady }: SidebarProps) {
  const router = useRouter();

  return (
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
          <NavItem key={item.label} label={item.label} active={activePage === item.label} onClick={() => onSelectPage(item.label)} />
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
                onSelectPage(item.label);
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
  );
}
