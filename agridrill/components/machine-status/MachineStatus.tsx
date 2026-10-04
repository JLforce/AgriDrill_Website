"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface MachineStatusData {
  line1: string;
  line2: string;
}

interface MachineStatusRow extends MachineStatusData {
  active_session_id: number | null;
}

// Shown when nobody is operating the machine.
const IDLE_STATUS: MachineStatusData = {
  line1: "SYSTEM",
  line2: "IDLE",
};

// Shown when someone ELSE is operating the machine.
const BUSY_STATUS: MachineStatusData = {
  line1: "MACHINE IN USE",
  line2: "BY ANOTHER USER",
};

export default function MachineStatus() {
  const [status, setStatus] = useState<MachineStatusData>({
    line1: "SYSTEM",
    line2: "READY",
  });

  // Used to ignore answers that arrive late (out of order).
  const requestCounterRef = useRef(0);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    /**
     * Decides what THIS user is allowed to see:
     *  - no active session   -> idle
     *  - active session is mine -> the live machine display
     *  - active session is someone else's -> "in use by another user"
     *
     * Because of Row Level Security, the query below only returns the
     * session when it belongs to the signed-in user.
     */
    const resolveStatus = async (row: MachineStatusRow) => {
      const requestId = ++requestCounterRef.current;

      if (!row.active_session_id) {
        setStatus(IDLE_STATUS);
        return;
      }

      const { data: ownSession, error } = await supabase
        .from("operation_sessions")
        .select("id")
        .eq("id", row.active_session_id)
        .maybeSingle();

      // A newer update arrived while we were waiting. Ignore this one.
      if (requestId !== requestCounterRef.current) return;

      if (error) {
        console.error("Failed to verify machine ownership:", error);
        return;
      }

      if (ownSession) {
        setStatus({ line1: row.line1, line2: row.line2 });
      } else {
        setStatus(BUSY_STATUS);
      }
    };

    const loadMachineStatus = async () => {
      const { data, error } = await supabase
        .from("machine_status")
        .select("line1, line2, active_session_id")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Failed to load machine status:", error);
        return;
      }

      if (data) {
        await resolveStatus(data as MachineStatusRow);
      }
    };

    loadMachineStatus();

    const channel = supabase
      .channel("machine-status-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "machine_status",
          filter: "id=eq.1",
        },
        (payload) => {
          void resolveStatus(payload.new as MachineStatusRow);
        }
      )
      .subscribe((subscriptionStatus) => {
        console.log("Machine status realtime:", subscriptionStatus);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">
        Machine Status
      </h2>

      <div className="rounded-xl bg-black p-5 font-mono text-xl text-white">
        <div>{status.line1}</div>
        <div>{status.line2}</div>
      </div>
    </div>
  );
}
