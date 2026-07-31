"use client";

import { memo } from "react";
import { FiClock } from "react-icons/fi";
import { type IconType } from "react-icons";
import { type Command } from "@/types/dashboard";

interface CommandPadButtonProps {
  readonly label: string;
  readonly command: Command;
  readonly icon: IconType;
  readonly loading: boolean;
  readonly active: boolean;
  readonly tone: "movement" | "stop";
  readonly disabled: boolean;
  readonly onPress: (command: Command) => void;
}

const TONE_CLASSES: Record<CommandPadButtonProps["tone"], string> = {
  stop: "border-rose-200 bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700 focus:ring-rose-300",
  movement:
    "border-emerald-200 bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600 focus:ring-emerald-300",
};

function CommandPadButtonBase({ label, command, icon: Icon, loading, active, tone, disabled, onPress }: CommandPadButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onPress(command)}
      disabled={disabled}
      title={`${label} (${command})`}
      aria-label={`${label} command ${command}`}
      aria-pressed={active}
      className={`inline-flex h-20 w-20 items-center justify-center rounded-3xl border text-center shadow-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 sm:h-24 sm:w-24 ${TONE_CLASSES[tone]} ${
        active ? "ring-2 ring-slate-300 ring-offset-2" : ""
      }`}
    >
      {loading ? <FiClock className="h-7 w-7 animate-spin" aria-hidden="true" /> : <Icon className="h-7 w-7" aria-hidden="true" />}
    </button>
  );
}

export const CommandPadButton = memo(CommandPadButtonBase);
