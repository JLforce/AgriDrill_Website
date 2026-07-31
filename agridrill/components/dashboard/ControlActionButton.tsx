"use client";

import { memo } from "react";
import { FiClock } from "react-icons/fi";
import { type IconType } from "react-icons";
import { type Command } from "@/types/dashboard";

interface ControlActionButtonProps {
  readonly label: string;
  readonly command: Command;
  readonly icon: IconType;
  readonly loading: boolean;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly onPress: (command: Command) => void;
}

function ControlActionButtonBase({ label, command, icon: Icon, loading, active, disabled, onPress }: ControlActionButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onPress(command)}
      disabled={disabled}
      title={`${label} (${command})`}
      aria-label={`${label} command ${command}`}
      aria-pressed={active}
      className={`inline-flex flex-1 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] ${
        active ? "ring-2 ring-emerald-200" : ""
      }`}
    >
      {loading ? <FiClock className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
      {label}
    </button>
  );
}

export const ControlActionButton = memo(ControlActionButtonBase);
