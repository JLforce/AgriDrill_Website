"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface MachineStatusData {
  line1: string;
  line2: string;
}

export default function MachineStatus() {
  const [status, setStatus] = useState<MachineStatusData>({
    line1: "SYSTEM",
    line2: "READY",
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const loadMachineStatus = async () => {
      const { data, error } = await supabase
        .from("machine_status")
        .select("line1, line2")
        .eq("id", 1)
        .single();

      if (error) {
        console.error(
          "Failed to load machine status:",
          error
        );
        return;
      }

      if (data) {
        setStatus({
          line1: data.line1,
          line2: data.line2,
        });
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
          const updatedStatus =
            payload.new as MachineStatusData;

          setStatus({
            line1: updatedStatus.line1,
            line2: updatedStatus.line2,
          });
        }
      )
      .subscribe((status) => {
        console.log(
          "Machine status realtime:",
          status
        );
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