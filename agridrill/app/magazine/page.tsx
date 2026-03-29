"use client";
import React, { useState } from "react";
import SeedlingTrayMiniMap from "./SeedlingTrayMiniMap";


interface Tray {
  trayNumber: number;
  seedlings: number;
  capacity: number;
}

interface StepperPosition {
  row: number;
  col: number;
}

const initialTrays: Tray[] = [
  { trayNumber: 1, seedlings: 24, capacity: 24 },
  { trayNumber: 2, seedlings: 12, capacity: 24 },
  { trayNumber: 3, seedlings: 0, capacity: 24 },
  { trayNumber: 4, seedlings: 18, capacity: 24 },
];


export default function MagazinePage() {
  const [trays, setTrays] = useState<Tray[]>(initialTrays);
  const [activeTray, setActiveTray] = useState<number>(0); // index in trays
  const [stepperPos, setStepperPos] = useState<StepperPosition>({ row: 0, col: 0 });
  const rows: number = 4, columns: number = 6; // Example tray grid size

  // Calculate total seedlings
  const totalSeedlings: number = trays.reduce((sum, t) => sum + t.seedlings, 0);

  // Handlers
  const handleAdvanceTray = (): void => {
    // Drop current tray, activate next (wrap around)
    setActiveTray((prev: number) => (prev + 1) % trays.length);
    setStepperPos({ row: 0, col: 0 });
  };
  const handleIndexReset = (): void => setStepperPos({ row: 0, col: 0 });
  const handleReloadTray = (): void => {
    // Simulate refilling tray
    setTrays((prev: Tray[]) =>
      prev.map((t, i) =>
        i === activeTray ? { ...t, seedlings: t.capacity } : t
      )
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 text-[#1e293b] flex flex-col items-center p-6 md:p-10">
      <div className="w-full max-w-6xl">
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-1 text-green-800 drop-shadow-sm">Seedling Magazine</h1>
            <p className="text-lg text-[#334155]">Status of the vertical tray stack and tray management controls.</p>
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span className="inline-block px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold shadow-sm border border-green-200">
              Total seedlings: <span className="font-bold text-green-900">{totalSeedlings}</span>
            </span>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tray Stack */}
          <section className="bg-white/80 rounded-2xl shadow-lg p-6 border border-green-100 flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              Tray Stack
            </h2>
            <div className="flex flex-col-reverse gap-4">
              {trays.map((tray, idx) => (
                <div
                  key={tray.trayNumber}
                  className={`flex items-center p-4 rounded-xl border-2 bg-gradient-to-r from-green-50 to-white shadow-sm transition-all relative ${
                    idx === activeTray ? "border-amber-400 ring-2 ring-amber-200 z-10" : "border-gray-200"
                  }`}
                >
                  <div className="w-24 font-bold text-lg text-green-900">Tray {tray.trayNumber}</div>
                  <div className="flex-1 mx-4">
                    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${tray.seedlings === 0 ? "bg-red-300" : "bg-green-400"}`}
                        style={{ width: `${(tray.seedlings / tray.capacity) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tray.seedlings} / {tray.capacity} seedlings
                    </div>
                  </div>
                  {idx === activeTray && (
                    <span className="ml-2 px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-300 font-semibold shadow">Active</span>
                  )}
                  {tray.seedlings === 0 && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 border border-red-200">Empty</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Tray Controls & Stepper */}
          <section className="bg-white/80 rounded-2xl shadow-lg p-6 border border-blue-100 flex flex-col gap-8">
            <div>
              <h2 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                Active Tray Controls
              </h2>
              <div className="flex gap-4 flex-wrap">
                <button
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-amber-300"
                  onClick={handleAdvanceTray}
                >
                  Advance Tray
                </button>
                <button
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-300"
                  onClick={handleIndexReset}
                >
                  Index Reset
                </button>
                <button
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow transition-all focus:outline-none focus:ring-2 focus:ring-green-300"
                  onClick={handleReloadTray}
                >
                  Reload Tray Count
                </button>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                Stepper Position
              </h2>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <SeedlingTrayMiniMap position={stepperPos} rows={rows} columns={columns} />
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-lg font-bold shadow"
                    onClick={() => setStepperPos((pos) => ({ ...pos, row: Math.max(0, pos.row - 1) }))}
                    disabled={stepperPos.row === 0}
                  >▲</button>
                  <button
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-lg font-bold shadow"
                    onClick={() => setStepperPos((pos) => ({ ...pos, row: Math.min(rows - 1, pos.row + 1) }))}
                    disabled={stepperPos.row === rows - 1}
                  >▼</button>
                  <button
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-lg font-bold shadow"
                    onClick={() => setStepperPos((pos) => ({ ...pos, col: Math.max(0, pos.col - 1) }))}
                    disabled={stepperPos.col === 0}
                  >◀</button>
                  <button
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-lg font-bold shadow"
                    onClick={() => setStepperPos((pos) => ({ ...pos, col: Math.min(columns - 1, pos.col + 1) }))}
                    disabled={stepperPos.col === columns - 1}
                  >▶</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
