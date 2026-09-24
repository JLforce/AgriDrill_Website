"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Command } from "@/types/dashboard";

const COMMAND_HISTORY_CHANNEL = "machine-command-logs-realtime";
const COMMAND_HISTORY_LIMIT = 100;

export type CommandLogStatus = "sent" | "failed";

export interface MachineCommandLog {
  readonly id: number;
  readonly created_at: string;
  readonly user_id: string | null;
  readonly operator_name: string | null;
  readonly operator_email: string | null;
  readonly operation_session_id: number | null;
  readonly command: Command;
  readonly command_label: string;
  readonly status: CommandLogStatus;
}

export function useCommandHistory() {
  const [logs, setLogs] = useState<MachineCommandLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadCommandLogs = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("machine_command_logs")
        .select(
          "id, created_at, user_id, operator_name, operator_email, operation_session_id, command, command_label, status"
        )
        .order("created_at", { ascending: false })
        .limit(COMMAND_HISTORY_LIMIT);

      if (fetchError) {
        console.error(
          "Failed to load machine command logs:",
          fetchError
        );

        if (mounted) {
          setError("Failed to load command history.");
          setIsLoading(false);
        }

        return;
      }

      if (mounted) {
        setLogs((data ?? []) as MachineCommandLog[]);
        setIsLoading(false);
      }
    };

    const setupRealtime = async () => {
      const existingChannel = supabase
        .getChannels()
        .find(
          (currentChannel) =>
            currentChannel.topic ===
            `realtime:${COMMAND_HISTORY_CHANNEL}`
        );

      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      if (!mounted) {
        return;
      }

      channel = supabase
        .channel(COMMAND_HISTORY_CHANNEL)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "machine_command_logs",
          },
          (payload) => {
            if (!mounted) {
              return;
            }

            const log = payload.new as MachineCommandLog;

            setLogs((current) => {
              if (
                current.some(
                  (existingLog) =>
                    existingLog.id === log.id
                )
              ) {
                return current;
              }

              return [log, ...current].slice(
                0,
                COMMAND_HISTORY_LIMIT
              );
            });
          }
        )
        .subscribe((status, realtimeError) => {
          console.log(
            "Command History Realtime status:",
            status
          );

          if (realtimeError) {
            console.error(
              "Command History Realtime error:",
              realtimeError
            );
          }
        });
    };

    void loadCommandLogs();
    void setupRealtime();

    return () => {
      mounted = false;

      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, []);

  return {
    logs,
    isLoading,
    error,
  };
}