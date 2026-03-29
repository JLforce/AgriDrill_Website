"use client";

import { useCallback, useEffect, useRef, useState, MutableRefObject } from "react";
import { Roboto } from "next/font/google";

const SPEED_PRESETS: number[] = [0.1, 0.3, 0.5];

type PlantingActionKey = "drill" | "seed" | "tray";
interface PlantingAction {
  key: PlantingActionKey;
  label: string;
}
const PLANTING_ACTIONS: PlantingAction[] = [
  { key: "drill", label: "Drill Hole" },
  { key: "seed", label: "Release Seedling" },
  { key: "tray", label: "Advance Tray" },
];

const PLANTING_ICONS: Record<PlantingActionKey, string> = { drill: "⬡", seed: "◈", tray: "▤" };

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

function nowTimeStamp(): string {
  return new Date().toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type AckType = "OK" | "TIMEOUT" | "ERROR" | string;
type ActionState = "idle" | "active" | "success" | "error";
interface CommandLogEntry {
  id: string;
  time: string;
  command: string;
  ack: AckType;
}
type ModeType = "AUTONOMOUS" | "MANUAL";

function ackStyle(ack: AckType): string {
  if (ack === "OK") return "border-[#86efac] bg-[#f0fdf4] text-[#166534] animate-pulse-fast";
  if (ack === "TIMEOUT") return "border-[#fcd34d] bg-[#fffbeb] text-[#92400e] animate-pulse-slow";
  return "border-[#fca5a5] bg-[#fef2f2] text-[#991b1b] animate-shake";
}
function actionStyle(state: ActionState): string {
  if (state === "active") return "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] animate-pulse-fast";
  if (state === "success") return "border-[#86efac] bg-[#f0fdf4] text-[#166534] animate-bounce-in";
  if (state === "error") return "border-[#fca5a5] bg-[#fef2f2] text-[#991b1b] animate-shake";
  return "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]";
}

export default function ControlPage() {
  const [mode, setMode] = useState<ModeType>("AUTONOMOUS");
  const [speedIndex, setSpeedIndex] = useState<number>(1);
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([]);
  const [activeMove, setActiveMove] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<PlantingActionKey, ActionState>>({ drill: "idle", seed: "idle", tray: "idle" });
  const [pageReady, setPageReady] = useState<boolean>(false);
  const [clickedControl, setClickedControl] = useState<string>("");

  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speedDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const latestSpeedIndexRef = useRef<number>(1);
  const actionTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const clickFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isManual = mode === "MANUAL";
  const currentSpeed = SPEED_PRESETS[speedIndex];

  const pushLog = useCallback((command: string, ack: AckType) => {
    setCommandLog((prev) => [{ id: `${Date.now()}-${Math.random()}`, time: nowTimeStamp(), command, ack }, ...prev].slice(0, 10));
  }, []);

  const issueCommand = useCallback(
    (command: string, allowInAuto: boolean = false): AckType => {
      if (!allowInAuto && !isManual) {
        return "TIMEOUT";
      }
      const roll = Math.random();
      const ack: AckType = roll < 0.8 ? "OK" : roll < 0.92 ? "TIMEOUT" : "ERROR";
      pushLog(command, ack);
      return ack;
    },
    [isManual, pushLog],
  );

  const stopHold = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setActiveMove(null);
  }, []);

  const startHold = useCallback(
    (command: string) => {
      if (!isManual) {
        return;
      }
      stopHold();
      setActiveMove(command);
      issueCommand(command);
      holdIntervalRef.current = setInterval(() => {
        issueCommand(command);
      }, 100);
    },
    [isManual, issueCommand, stopHold],
  );

  const sendSpeedDebounced = useCallback(
    (nextIndex: number) => {
      if (speedDebounceRef.current) {
        clearTimeout(speedDebounceRef.current);
      }
      speedDebounceRef.current = setTimeout(() => {
        issueCommand(`Set Speed ${SPEED_PRESETS[nextIndex].toFixed(1)} m/s`);
      }, 200);
    },
    [issueCommand],
  );

  const runPlantingAction = useCallback(
    (key: PlantingActionKey, label: string) => {
      if (!isManual) {
        return;
      }
      setActionStates((prev) => ({ ...prev, [key]: "active" }));
      const triggerTimeout = setTimeout(() => {
        const ack = issueCommand(label);
        setActionStates((prev) => ({ ...prev, [key]: ack === "OK" ? "success" : "error" }));
        const resetTimeout = setTimeout(() => {
          setActionStates((prev) => ({ ...prev, [key]: "idle" }));
        }, 1200);
        actionTimeoutsRef.current.push(resetTimeout);
      }, 450);
      actionTimeoutsRef.current.push(triggerTimeout);
    },
    [isManual, issueCommand],
  );

  const triggerClickFeedback = useCallback((key: string) => {
    setClickedControl(key);
    if (clickFeedbackTimeoutRef.current) {
      clearTimeout(clickFeedbackTimeoutRef.current);
    }
    clickFeedbackTimeoutRef.current = setTimeout(() => {
      setClickedControl("");
    }, 190);
  }, []);

  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setPageReady(true);
    }, 20);

    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        return;
      }
      const key = event.key.toLowerCase();
      const normalizedKey = event.code === "Space" ? " " : key;
      const map: Record<string, string> = {
        w: "Move Forward",
        s: "Move Backward",
        a: "Turn Left",
        d: "Turn Right",
        " ": "Stop",
      };
      const command = map[normalizedKey];
      if (!command) {
        return;
      }
      event.preventDefault();
      if (activeMove !== command) {
        startHold(command);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const normalizedKey = event.code === "Space" ? " " : key;
      if (["w", "a", "s", "d", " "].includes(normalizedKey)) {
        stopHold();
      }
    };
    const forceStop = () => stopHold();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mouseup", forceStop);
    window.addEventListener("touchend", forceStop);
    window.addEventListener("blur", forceStop);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mouseup", forceStop);
      window.removeEventListener("touchend", forceStop);
      window.removeEventListener("blur", forceStop);
      forceStop();
      if (speedDebounceRef.current) {
        clearTimeout(speedDebounceRef.current);
      }
      if (clickFeedbackTimeoutRef.current) {
        clearTimeout(clickFeedbackTimeoutRef.current);
      }
      actionTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      actionTimeoutsRef.current = [];
    };
  }, [activeMove, startHold, stopHold]);

  return (
    <main className={`${roboto.className} min-h-screen bg-linear-to-br from-[#e0f7fa] via-[#f1f5f9] to-[#e0e7ff] text-[#0f172a] antialiased transition-colors duration-700`}>
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-20 border-b border-[#1d4ed8] bg-blue-600/95 backdrop-blur-md shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition-all duration-700 animate-fade-in-down ${
          pageReady ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#bfdbfe]">AgriDrill · Operator Console</p>
              <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.01em] text-white">Robot Control</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-[11px] font-semibold text-[#16a34a]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#16a34a]" />
              CONNECTED
            </span>
            <button
              type="button"
              className={`rounded-xl border-2 border-[#b91c1c] bg-[#dc2626] px-5 py-2 text-sm font-extrabold uppercase tracking-widest text-white shadow-[0_2px_12px_rgba(220,38,38,0.3)] transition hover:bg-[#b91c1c] active:scale-95 ${
                clickedControl === "estop" ? "scale-[0.97] shadow-[0_0_0_4px_rgba(220,38,38,0.24)]" : ""
              }`}
              onClick={() => {
                triggerClickFeedback("estop");
                issueCommand("E-STOP", true);
                stopHold();
              }}
            >
              ⬡ E-STOP
            </button>
          </div>
        </div>
      </header>

      {/* ── MODE BANNER ──────────────────────────────────────────────── */}
      <div
        className={`border-b px-5 py-2.5 transition-all duration-700 delay-100 animate-fade-in-down ${
          pageReady ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        } ${isManual ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#fecaca] bg-[#fef2f2]"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 rounded-full ${isManual ? "animate-pulse bg-[#16a34a] shadow-[0_0_8px_rgba(22,163,74,0.5)]" : "bg-[#dc2626] shadow-[0_0_8px_rgba(220,38,38,0.4)]"}`} />
            <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${isManual ? "text-[#15803d]" : "text-[#dc2626]"}`}>
              {isManual ? "Manual Mode Active — Operator Controls Enabled" : "Autonomous Mode — Operator Controls Locked"}
            </span>
          </div>
          <button
            type="button"
            className={`rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#475569] transition hover:border-[#cbd5e1] hover:text-[#334155] ${
              clickedControl === "mode-toggle" ? "scale-[0.97] shadow-[0_0_0_4px_rgba(148,163,184,0.2)]" : ""
            }`}
            onClick={() => {
              triggerClickFeedback("mode-toggle");
              const nextMode = isManual ? "AUTONOMOUS" : "MANUAL";
              const msg = isManual
                ? "Return robot to AUTONOMOUS mode? Operator controls will be locked."
                : "Switch robot to MANUAL mode? This unlocks operator controls.";
              if (window.confirm(msg)) {
                setMode(nextMode);
                pushLog(`Switch to ${nextMode} mode`, "OK");
              }
            }}
          >
            {isManual ? "Return to Autonomous →" : "Switch to Manual →"}
          </button>
        </div>
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────────────── */}
      <div
        className={`mx-auto grid max-w-7xl gap-6 p-5 lg:grid-cols-[1fr_1fr] transition-all duration-700 delay-200 animate-fade-in-up ${
          pageReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {/* D-PAD */}
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3b82f6]">Movement Control</p>
              <p className="mt-0.5 text-xs font-medium text-[#64748b]">Hold button or key · W A S D · Space = Stop</p>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${isManual ? "border-[#bbf7d0] text-[#15803d]" : "border-[#e2e8f0] text-[#94a3b8]"}`}>
              {isManual ? "● active" : "○ locked"}
            </span>
          </div>
          <div className={`mx-auto w-full max-w-72 transition-opacity duration-200 animate-fade-in-up ${isManual ? "opacity-100" : "opacity-25 pointer-events-none"}`}>
            <div className="grid grid-cols-3 gap-3">
              <div />
              <button
                type="button"
                disabled={!isManual}
                onMouseDown={() => {
                  triggerClickFeedback("move-forward");
                  startHold("Move Forward");
                }}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={() => startHold("Move Forward")}
                onTouchEnd={stopHold}
                className={`flex flex-col items-center justify-center rounded-2xl border py-5 transition active:scale-95 ${activeMove === "Move Forward" ? "border-[#3b82f6] bg-[#eff6ff] text-[#2563eb] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]" : "border-[#e2e8f0] bg-[#f8fafc] text-[#475569] hover:border-[#cbd5e1] hover:text-[#334155]"} ${clickedControl === "move-forward" ? "scale-[0.96]" : ""}`}
              >
                <span className="text-2xl leading-none">▲</span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-widest">FWD</span>
              </button>
              <div />
              <button
                type="button"
                disabled={!isManual}
                onMouseDown={() => {
                  triggerClickFeedback("turn-left");
                  startHold("Turn Left");
                }}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={() => startHold("Turn Left")}
                onTouchEnd={stopHold}
                className={`flex flex-col items-center justify-center rounded-2xl border py-5 transition active:scale-95 ${activeMove === "Turn Left" ? "border-[#3b82f6] bg-[#eff6ff] text-[#2563eb] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]" : "border-[#e2e8f0] bg-[#f8fafc] text-[#475569] hover:border-[#cbd5e1] hover:text-[#334155]"} ${clickedControl === "turn-left" ? "scale-[0.96]" : ""}`}
              >
                <span className="text-2xl leading-none">◄</span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-widest">LEFT</span>
              </button>
              <button
                type="button"
                disabled={!isManual}
                onMouseDown={() => {
                  triggerClickFeedback("stop");
                  startHold("Stop");
                }}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={() => startHold("Stop")}
                onTouchEnd={stopHold}
                className={`flex flex-col items-center justify-center rounded-2xl border py-5 transition active:scale-95 ${activeMove === "Stop" ? "border-[#dc2626] bg-[#fef2f2] text-[#b91c1c] shadow-[0_0_0_3px_rgba(220,38,38,0.15)]" : "border-[#fca5a5] bg-[#fff5f5] text-[#dc2626] hover:bg-[#fef2f2] hover:border-[#f87171]"} ${clickedControl === "stop" ? "scale-[0.96]" : ""}`}
              >
                <span className="text-2xl font-extrabold leading-none">■</span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-widest">STOP</span>
              </button>
              <button
                type="button"
                disabled={!isManual}
                onMouseDown={() => {
                  triggerClickFeedback("turn-right");
                  startHold("Turn Right");
                }}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={() => startHold("Turn Right")}
                onTouchEnd={stopHold}
                className={`flex flex-col items-center justify-center rounded-2xl border py-5 transition active:scale-95 ${activeMove === "Turn Right" ? "border-[#3b82f6] bg-[#eff6ff] text-[#2563eb] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]" : "border-[#e2e8f0] bg-[#f8fafc] text-[#475569] hover:border-[#cbd5e1] hover:text-[#334155]"} ${clickedControl === "turn-right" ? "scale-[0.96]" : ""}`}
              >
                <span className="text-2xl leading-none">►</span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-widest">RIGHT</span>
              </button>
              <div />
              <button
                type="button"
                disabled={!isManual}
                onMouseDown={() => {
                  triggerClickFeedback("move-backward");
                  startHold("Move Backward");
                }}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={() => startHold("Move Backward")}
                onTouchEnd={stopHold}
                className={`flex flex-col items-center justify-center rounded-2xl border py-5 transition active:scale-95 ${activeMove === "Move Backward" ? "border-[#3b82f6] bg-[#eff6ff] text-[#2563eb] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]" : "border-[#e2e8f0] bg-[#f8fafc] text-[#475569] hover:border-[#cbd5e1] hover:text-[#334155]"} ${clickedControl === "move-backward" ? "scale-[0.96]" : ""}`}
              >
                <span className="text-2xl leading-none">▼</span>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-widest">BACK</span>
              </button>
              <div />
            </div>
          </div>
        </section>

        {/* RIGHT: Speed + Planting */}
        <div className="flex flex-col gap-6 animate-fade-in-up">
          {/* Speed Control - posted directly */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d97706]">Speed Control</p>
            <span className={`rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 font-extrabold tabular-nums leading-none ${isManual ? "text-[#b45309]" : "text-[#94a3b8]"}`}>
              {currentSpeed.toFixed(1)} <span className="text-[11px] font-medium text-[#94a3b8]">m/s</span>
            </span>
          </div>
          <div className={`flex gap-2 transition-opacity animate-fade-in-up ${isManual ? "" : "opacity-25 pointer-events-none"}`}>
            {SPEED_PRESETS.map((preset, i) => (
              <button
                key={preset}
                type="button"
                disabled={!isManual}
                onClick={() => {
                  triggerClickFeedback(`speed-${i}`);
                  latestSpeedIndexRef.current = i;
                  setSpeedIndex(i);
                  issueCommand(`Set Speed ${preset.toFixed(1)} m/s`);
                }}
                className={`flex flex-1 flex-col items-center rounded-xl border py-4 transition active:scale-95 ${speedIndex === i ? "border-[#f59e0b] bg-[#fffbeb] text-[#b45309] shadow-[0_0_0_3px_rgba(245,158,11,0.12)]" : "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b] hover:border-[#cbd5e1] hover:text-[#334155]"} ${clickedControl === `speed-${i}` ? "scale-[0.96]" : ""}`}
              >
                <span className="text-lg font-extrabold tabular-nums">{preset.toFixed(1)}</span>
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-widest opacity-70">{["Slow", "Med", "Fast"][i]}</span>
              </button>
            ))}
          </div>
          {/* Planting Actions - posted directly */}
          <p className="mb-4 mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#16a34a]">Planting Actions</p>
          <div className={`grid gap-3 sm:grid-cols-3 transition-opacity animate-fade-in-up ${isManual ? "" : "opacity-25 pointer-events-none"}`}>
            {PLANTING_ACTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={!isManual || actionStates[item.key] === "active"}
                onClick={() => {
                  triggerClickFeedback(`plant-${item.key}`);
                  runPlantingAction(item.key, item.label);
                }}
                className={`flex flex-col items-center rounded-xl border py-5 text-sm font-bold transition active:scale-95 ${
                  actionStates[item.key] === "active"
                    ? "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]"
                    : actionStates[item.key] === "success"
                    ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
                    : actionStates[item.key] === "error"
                    ? "border-[#fca5a5] bg-[#fef2f2] text-[#dc2626]"
                    : "border-[#e2e8f0] bg-[#f8fafc] text-[#475569] hover:border-[#bbf7d0] hover:text-[#16a34a]"
                } ${clickedControl === `plant-${item.key}` ? "scale-[0.96]" : ""}`}
              >
                <span className="text-3xl leading-none">{PLANTING_ICONS[item.key]}</span>
                <span className="mt-2 text-xs font-semibold">{item.label}</span>
                <span className={`mt-2 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${actionStyle(actionStates[item.key])}`}>
                  {actionStates[item.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMMAND LOG ──────────────────────────────────────────────── */}
      <section
        className={`mx-auto max-w-7xl px-5 pb-8 transition-all duration-700 delay-300 animate-fade-in-up ${
          pageReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Command Log</p>
              <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[10px] text-[#94a3b8]">last 10</span>
            </div>
            {commandLog.length > 0 && (
              <button
                type="button"
                onClick={() => setCommandLog([])}
                className="text-[11px] text-[#94a3b8] transition hover:text-[#64748b]"
              >
                Clear
              </button>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc] font-mono animate-fade-in-up shadow-lg">
            <div className="grid grid-cols-[80px_1fr_90px] border-b border-[#e2e8f0] bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] animate-fade-in-up">
              <span>Time</span>
              <span>Command</span>
              <span>ACK</span>
            </div>
            {commandLog.length === 0 ? (
              <p className="px-4 py-6 text-xs text-[#cbd5e1]">▌ awaiting commands...</p>
            ) : (
              <div className="max-h-56 overflow-y-auto animate-fade-in-up">
                {commandLog.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[80px_1fr_90px] items-center border-b border-[#f1f5f9] px-4 py-2.5 text-xs last:border-0 ${idx === 0 ? "bg-white" : ""}`}
                  >
                    <span className="tabular-nums text-[#94a3b8]">{entry.time}</span>
                    <span className="text-[#334155]">{entry.command}</span>
                    <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${ackStyle(entry.ack)}`}>
                      <span className="h-1 w-1 rounded-full bg-current" />
                      {entry.ack}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

    </main>
  );
}