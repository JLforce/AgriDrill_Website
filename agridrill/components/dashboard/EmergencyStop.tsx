"use client";

import { FiAlertTriangle, FiClock, FiPower } from "react-icons/fi";
import { type Command } from "@/types/dashboard";

interface EmergencyStopProps {
  readonly isSending: boolean;
  readonly onSendCommand: (command: Command) => void;
}

export function EmergencyStop({ isSending, onSendCommand }: EmergencyStopProps) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
          <FiAlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Emergency Stop</h2>
          <p className="mt-1 text-sm text-slate-500">Immediately stop all robot movement.</p>
        </div>
      </div>

      {/* Intentionally one-click — no confirmation dialog. */}
      <button
        type="button"
        onClick={() => onSendCommand("S")}
        disabled={isSending}
        title="Emergency Stop (S)"
        className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-2xl border-4 border-rose-300/60 bg-rose-600 px-5 py-5 text-base font-black uppercase tracking-[0.24em] text-white shadow-lg shadow-rose-200 transition duration-150 hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] animate-[pulse_2.5s_ease-in-out_infinite]"
        aria-label="Send emergency stop command"
      >
        {isSending ? <FiClock className="h-5 w-5 animate-spin" aria-hidden="true" /> : <FiPower className="h-5 w-5" aria-hidden="true" />}
        Emergency Stop
      </button>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        This button sends the S command and is visually separated from the normal stop control.
      </p>
    </div>
  );
}
