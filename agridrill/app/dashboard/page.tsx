"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { primaryNav } from "@/constants/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmergencyStop } from "@/components/dashboard/EmergencyStop";
import { Footer } from "@/components/dashboard/Footer";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { OperationStatistics } from "@/components/dashboard/OperationStatistics";
import { RecentActivityTable } from "@/components/dashboard/RecentActivityTable";
import { RobotControl } from "@/components/dashboard/RobotControl";
import { SensorGrid } from "@/components/dashboard/SensorGrid";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { useRobotCommands } from "@/hooks/useRobotCommands";
import { useTelemetry } from "@/hooks/useTelemetry";
import { getConnectionStatus } from "@/utils/connectionStatus";

function DashboardContent() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { telemetry, lastSeenIso, activity, isLoading, hasTelemetry } = useTelemetry(supabase);
  const { loadingCommand, activeCommand, sendCommand } = useRobotCommands();

  const connectionState = getConnectionStatus(lastSeenIso).state;

  return (
    <div className="space-y-6">
      <DashboardHeader lastSeenIso={lastSeenIso} />

      <MetricsGrid telemetry={telemetry} connectionState={connectionState} isLoading={isLoading} />

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <RobotControl loadingCommand={loadingCommand} activeCommand={activeCommand} onSendCommand={sendCommand} />
          <SensorGrid telemetry={telemetry} lastUpdatedIso={lastSeenIso} hasTelemetry={hasTelemetry} />
        </div>

        <aside className="space-y-4">
          <EmergencyStop isSending={loadingCommand !== null} onSendCommand={sendCommand} />
          <OperationStatistics telemetry={telemetry} isLoading={isLoading} />
        </aside>
      </section>

      <RecentActivityTable activity={activity} isLoading={isLoading} />
    </div>
  );
}

export default function DashboardPage() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setPageReady(true);
    }, 20);

    return () => clearTimeout(readyTimer);
  }, []);

  const activeRoute = useMemo(() => {
    const selected = primaryNav.find((item) => item.label === activePage);
    return selected?.route ?? null;
  }, [activePage]);

  return (
    <main className="min-h-screen bg-[#e5e7eb] text-[#1f2937]">
      <TopNavbar pageReady={pageReady} />

      <div className="mx-auto grid w-full max-w-375 gap-4 p-4 lg:grid-cols-[250px_1fr]">
        <Sidebar activePage={activePage} onSelectPage={setActivePage} pageReady={pageReady} />

        <section
          className={`rounded-2xl border border-[#d1d5db] bg-[#f3f4f6] p-4 transition-all duration-700 delay-200 lg:p-6 ${
            pageReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div className="translate-y-0 opacity-100 transition-all duration-200">
            {activeRoute ? (
              <div className="h-[80vh] overflow-hidden rounded-xl border border-[#cbd5e1] bg-white">
                <iframe title={`${activePage} page`} src={activeRoute} className="h-full w-full" />
              </div>
            ) : (
              <DashboardContent />
            )}
          </div>
        </section>
      </div>

      <Footer pageReady={pageReady} />
    </main>
  );
}
