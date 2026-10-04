"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { primaryNav, secondaryNav } from "@/constants/navigation";
import { Footer } from "@/components/dashboard/Footer";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNavbar } from "@/components/dashboard/TopNavbar";

interface DashboardShellProps {
  readonly children: ReactNode;
}

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setPageReady(true);
    }, 20);

    return () => clearTimeout(readyTimer);
  }, []);

  const activePage = useMemo(() => {
    if (pathname === "/dashboard") {
      return "Dashboard";
    }

    const primaryMatch = primaryNav.find(
      (item) =>
        pathname === item.route ||
        pathname.startsWith(`${item.route}/`)
    );

    if (primaryMatch) {
      return primaryMatch.label;
    }

    const secondaryMatch = secondaryNav.find(
      (item) =>
        pathname === item.route ||
        pathname.startsWith(`${item.route}/`)
    );

    if (secondaryMatch) {
      return secondaryMatch.label;
    }

    return "Dashboard";
  }, [pathname]);

  const handleSelectPage = (label: string) => {
    const selectedPrimary = primaryNav.find(
      (item) => item.label === label
    );

    if (selectedPrimary) {
      router.push(selectedPrimary.route);
      return;
    }

    const selectedSecondary = secondaryNav.find(
      (item) => item.label === label
    );

    if (selectedSecondary) {
      router.push(selectedSecondary.route);
    }
  };

  return (
    <main className="min-h-screen bg-[#e5e7eb] text-[#1f2937]">
      <TopNavbar pageReady={pageReady} />

      {/*
        Below 1024px: one column.
        1024px and up: sidebar (250px) + content.

        minmax(0, 1fr) lets the content column shrink, so a wide table or
        card can never push the whole page sideways.
      */}
      <div className="mx-auto grid w-full max-w-375 grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <Sidebar
          activePage={activePage}
          onSelectPage={handleSelectPage}
          pageReady={pageReady}
        />

        <section
          className={`min-w-0 rounded-2xl border border-[#d1d5db] bg-[#f3f4f6] p-3 transition-all duration-700 delay-200 sm:p-4 lg:p-6 ${
            pageReady
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0"
          }`}
        >
          <div className="translate-y-0 opacity-100 transition-all duration-200">
            {children}
          </div>
        </section>
      </div>

      <Footer pageReady={pageReady} />
    </main>
  );
}
