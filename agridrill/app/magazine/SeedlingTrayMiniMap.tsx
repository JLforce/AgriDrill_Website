import React from "react";

interface StepperPosition {
  row: number;
  col: number;
}

interface SeedlingTrayMiniMapProps {
  position: StepperPosition;
  rows: number;
  columns: number;
}

export default function SeedlingTrayMiniMap({ position, rows, columns }: SeedlingTrayMiniMapProps) {
  return (
    <div className="mb-2">
      <div className="text-xs text-gray-500 mb-1">Stepper Position</div>
      <div className="inline-block rounded border border-gray-300 bg-white p-2">
        <div className="grid" style={{ gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: rows * columns }).map((_, idx) => {
            const row = Math.floor(idx / columns);
            const col = idx % columns;
            const isActive = position.row === row && position.col === col;
            return (
              <div
                key={idx}
                className={`w-4 h-4 flex items-center justify-center border border-gray-200 text-[10px] ${isActive ? "bg-amber-300 border-amber-500" : "bg-gray-100"}`}
              >
                {isActive ? "X" : ""}
              </div>
            );
          })}
        </div>
        <div className="mt-1 text-xs text-gray-400">Row {position.row + 1}, Col {position.col + 1}</div>
      </div>
    </div>
  );
}