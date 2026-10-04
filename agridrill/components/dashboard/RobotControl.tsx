"use client";

import { useEffect } from "react";
import { FiArrowDown, FiArrowLeft, FiArrowRight, FiArrowUp, FiNavigation, FiPause, FiSlash, FiTool } from "react-icons/fi";
import { CommandPadButton } from "@/components/dashboard/CommandPadButton";
import { ControlActionButton } from "@/components/dashboard/ControlActionButton";
import { type Command } from "@/types/dashboard";

interface RobotControlProps {
  readonly loadingCommand: Command | null;
  readonly activeCommand: Command | null;
  readonly onSendCommand: (command: Command) => void;
}

const KEY_TO_COMMAND: Record<string, Command> = {
  ArrowUp: "F",
  w: "F",
  W: "F",
  ArrowDown: "B",
  s: "B",
  S: "B",
  ArrowLeft: "L",
  a: "L",
  A: "L",
  ArrowRight: "R",
  d: "R",
  D: "R",
  " ": "S",
};

export function RobotControl({ loadingCommand, activeCommand, onSendCommand }: RobotControlProps) {
  const isBusy = loadingCommand !== null;

  // Keyboard accessibility: arrow keys / WASD move the robot, space stops it.
  // Ignored while typing into a text field, while a command is in flight,
  // and for keyboard shortcuts (Ctrl+A, Ctrl+S, Ctrl+D, Ctrl+W...) so that
  // using the browser never moves the physical machine by accident.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;

      const target = event.target as HTMLElement | null;
      const isTypingField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable === true;
      if (isTypingField || isBusy) return;

      const command = KEY_TO_COMMAND[event.key];
      if (!command) return;

      event.preventDefault();
      onSendCommand(command);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBusy, onSendCommand]);

  return (
    <div className="dashboard-card rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      {/* On phones the badge moves under the title instead of squeezing it */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Robot Control</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use the controls below
            <span className="hidden md:inline">, or arrow keys / WASD,</span> to operate AgriDrill.
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          <FiNavigation className="h-3.5 w-3.5" aria-hidden="true" />
          Command Center
        </span>
      </div>

      <div className="mx-auto max-w-xl">
        <div className="grid grid-cols-3 gap-3 text-center sm:gap-4">
          <div className="col-start-2 flex flex-col items-center gap-2">
            <CommandPadButton
              label="Forward"
              command="F"
              icon={FiArrowUp}
              loading={loadingCommand === "F"}
              active={activeCommand === "F"}
              disabled={isBusy}
              onPress={onSendCommand}
              tone="movement"
            />
            <span className="text-xs font-semibold tracking-[0.2em] text-slate-500">FORWARD</span>
          </div>

          <div className="col-start-1 row-start-2 flex flex-col items-center gap-2">
            <CommandPadButton
              label="Left"
              command="L"
              icon={FiArrowLeft}
              loading={loadingCommand === "L"}
              active={activeCommand === "L"}
              disabled={isBusy}
              onPress={onSendCommand}
              tone="movement"
            />
            <span className="text-xs font-semibold tracking-[0.2em] text-slate-500">LEFT</span>
          </div>

          <div className="col-start-2 row-start-2 flex flex-col items-center gap-2">
            <CommandPadButton
              label="Stop"
              command="S"
              icon={FiSlash}
              loading={loadingCommand === "S"}
              active={activeCommand === "S"}
              disabled={isBusy}
              onPress={onSendCommand}
              tone="stop"
            />
            <span className="text-xs font-semibold tracking-[0.2em] text-rose-500">STOP</span>
          </div>

          <div className="col-start-3 row-start-2 flex flex-col items-center gap-2">
            <CommandPadButton
              label="Right"
              command="R"
              icon={FiArrowRight}
              loading={loadingCommand === "R"}
              active={activeCommand === "R"}
              disabled={isBusy}
              onPress={onSendCommand}
              tone="movement"
            />
            <span className="text-xs font-semibold tracking-[0.2em] text-slate-500">RIGHT</span>
          </div>

          <div className="col-start-2 row-start-3 flex flex-col items-center gap-2">
            <CommandPadButton
              label="Backward"
              command="B"
              icon={FiArrowDown}
              loading={loadingCommand === "B"}
              active={activeCommand === "B"}
              disabled={isBusy}
              onPress={onSendCommand}
              tone="movement"
            />
            <span className="text-xs font-semibold tracking-[0.2em] text-slate-500">BACKWARD</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <ControlActionButton
              label="Start"
              command="D"
              icon={FiTool}
              loading={loadingCommand === "D"}
              active={activeCommand === "D"}
              disabled={isBusy}
              onPress={onSendCommand}
            />
            <ControlActionButton
              label="Stop"
              command="S"
              icon={FiPause}
              loading={loadingCommand === "S"}
              active={activeCommand === "S"}
              disabled={isBusy}
              onPress={onSendCommand}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">Movement commands map to F, B, L, R, and S. START mirrors the original AgriDrill local controller.</p>
        </div>
      </div>
    </div>
  );
}
