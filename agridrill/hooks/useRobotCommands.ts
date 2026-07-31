"use client";

import { useCallback, useState } from "react";
import { type Command } from "@/types/dashboard";
import { useToast } from "@/hooks/useToast";

export interface UseRobotCommandsResult {
  readonly loadingCommand: Command | null;
  readonly activeCommand: Command | null;
  readonly sendCommand: (command: Command) => Promise<void>;
}

/** Maps a raw error message to a short, operator-friendly toast title. */
function toastTitleForError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("timeout")) return "MQTT Timeout";
  if (lower.includes("offline")) return "Machine Offline";
  if (lower.includes("supabase")) return "Supabase Error";
  return "Command Failed";
}

/**
 * Owns command-sending state for the robot controls.
 * Preserves the original contract exactly: POST /api/command with { command }.
 */
export function useRobotCommands(): UseRobotCommandsResult {
  const [loadingCommand, setLoadingCommand] = useState<Command | null>(null);
  const [activeCommand, setActiveCommand] = useState<Command | null>(null);
  const { showToast } = useToast();

  const sendCommand = useCallback(
    async (command: Command) => {
      setLoadingCommand(command);

      try {
        const response = await fetch("/api/command", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ command }),
        });

        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(result?.error || "Failed to send command");
        }

        setActiveCommand(command);
        showToast("Command Sent", { description: `${command} command delivered.`, variant: "success" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send command";
        showToast(toastTitleForError(message), {
          description: `Failed to send ${command} command. Check the machine connection.`,
          variant: "error",
        });
      } finally {
        setLoadingCommand(null);
      }
    },
    [showToast]
  );

  return { loadingCommand, activeCommand, sendCommand };
}