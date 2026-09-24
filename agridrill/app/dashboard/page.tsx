"use client";

import MachineStatus from "@/components/machine-status/MachineStatus";
import { useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { OperationStatistics } from "@/components/dashboard/OperationStatistics";
import { RecentActivityTable } from "@/components/dashboard/RecentActivityTable";
import { RobotControl } from "@/components/dashboard/RobotControl";
import { SensorGrid } from "@/components/dashboard/SensorGrid";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useRobotCommands } from "@/hooks/useRobotCommands";
import { useTelemetry } from "@/hooks/useTelemetry";
import { getConnectionStatus } from "@/utils/connectionStatus";

function DashboardContent() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const {
    telemetry,
    lastSeenIso,
    activity,
    isLoading,
    hasTelemetry,
  } = useTelemetry(supabase);

  const {
    loadingCommand,
    activeCommand,
    sendCommand,
  } = useRobotCommands();

  const connectionState = getConnectionStatus(lastSeenIso).state;

  return (
    <div className="space-y-6">
      <DashboardHeader lastSeenIso={lastSeenIso} />

      {/* =====================================================
          REAL-TIME MACHINE STATUS
          Displays the current machine state from Supabase.
          ===================================================== */}
      <MachineStatus />

      <MetricsGrid
        telemetry={telemetry}
        connectionState={connectionState}
        isLoading={isLoading}
      />

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <RobotControl
            loadingCommand={loadingCommand}
            activeCommand={activeCommand}
            onSendCommand={sendCommand}
          />
        </div>

        <aside className="space-y-4">
          <OperationStatistics
            telemetry={telemetry}
            isLoading={isLoading}
          />

          <SensorGrid
            telemetry={telemetry}
            lastUpdatedIso={lastSeenIso}
            hasTelemetry={hasTelemetry}
          />
        </aside>
      </section>

      <RecentActivityTable
        activity={activity}
        isLoading={isLoading}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardContent />
    </DashboardShell>
  );
}