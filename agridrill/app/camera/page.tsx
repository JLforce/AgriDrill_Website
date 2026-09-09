"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DashboardTopNav from "../../components/DashboardTopNav";

type CapturedPhoto = {
  id: string;
  url: string;
  timestamp: string;
};

export default function CameraPage() {
  const videoRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [fps, setFps] = useState(29.8);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);

  // Static camera info — swap for live values from the ESP32/Pi endpoint when available.
  const cameraInfo = {
    name: "Area Ahead",
    model: "Raspberry Pi Camera Module 3",
    shortModel: "Pi Camera v3",
    resolution: "1280 x 720",
    streamUrl: "http://192.168.8.140:5000/video_feed",
  };

  const formatTimestamp = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    ", " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const handleSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const img = videoRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth || 1280;
    canvas.height = img.naturalHeight || 720;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const now = new Date();

      setCapturedPhotos((prev) => [
        {
          id: `${now.getTime()}`,
          url,
          timestamp: formatTimestamp(now),
        },
        ...prev,
      ]);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setCapturedPhotos((prev) => {
      prev.forEach((photo) => URL.revokeObjectURL(photo.url));
      return [];
    });
  }, []);

  const handleQuit = useCallback(() => {
    // Placeholder for wiring up to whatever "quit" should mean in this app
    // (e.g. router.back(), closing the stream connection, etc.)
    console.log("Quit requested");
  }, []);

  // Keyboard shortcuts: C = capture, Q / Esc = quit
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (e.key.toLowerCase() === "c") {
        handleSnapshot();
      } else if (e.key.toLowerCase() === "q" || e.key === "Escape") {
        handleQuit();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSnapshot, handleQuit]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      capturedPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <DashboardTopNav />
      <main className="min-h-screen bg-[#030712] px-4 pb-10 pt-6 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* ── TOP GRID: LIVE FEED + CAMERA PANEL ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Live feed card */}
            <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#111827] text-lg">
                    📷
                  </span>
                  <div>
                    <h2 className="text-base font-bold uppercase tracking-wide text-white">
                      {cameraInfo.name}
                    </h2>
                    <p className="text-xs text-[#94a3b8]">{cameraInfo.model}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#4ade80]">
                    <span className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
                    Live
                  </span>
                  <span className="text-xs text-[#94a3b8]">FPS: {fps.toFixed(1)}</span>
                </div>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#1f2937] bg-black">
                <img
                  ref={videoRef}
                  src={cameraInfo.streamUrl}
                  alt="Live camera feed"
                  className="h-full w-full object-cover"
                  onError={() => console.warn("Camera feed unavailable")}
                />
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Right column: camera card + controls */}
            <div className="flex flex-col gap-4">
              {/* Camera 1 card */}
              <div className="rounded-2xl border border-[#166534] bg-[#052e16]/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#166534] bg-[#052e16] text-lg">
                      📷
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Camera 1</p>
                      <p className="text-xs text-[#86efac]/80">
                        {cameraInfo.name} ({cameraInfo.shortModel})
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#4ade80]">
                    <span className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.7)]" />
                    Live
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <StatBox label="Resolution" value={cameraInfo.resolution} icon="📐" />
                  <StatBox label="FPS" value={fps.toFixed(1)} icon="⏱️" />
                  <StatBox label="Camera" value={cameraInfo.shortModel} icon="🔧" />
                </div>

                <button
                  type="button"
                  onClick={handleSnapshot}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-4 py-3 text-sm font-bold text-[#052e16] transition hover:bg-[#4ade80] active:scale-[0.98]"
                >
                  <span>📷</span>
                  Capture Photo
                </button>
              </div>

              {/* Controls card */}
              <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
                <p className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
                  Controls
                </p>
                <div className="flex flex-wrap gap-4">
                  <KeyHint keyLabel="C" description="Capture Photo" />
                  <KeyHint keyLabel="Q" description="Quit" />
                  <KeyHint keyLabel="ESC" description="Quit" />
                </div>
              </div>
            </div>
          </div>

          {/* ── CAPTURED PHOTOS ── */}
          <div className="mt-4 rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🖼️</span>
                <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                  Captured Photos
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={capturedPhotos.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] transition hover:border-[#f87171] hover:text-[#f87171] disabled:cursor-not-allowed disabled:opacity-40"
              >
                🗑️ Clear All
              </button>
            </div>

            {capturedPhotos.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#64748b]">
                No photos captured yet. Press{" "}
                <span className="font-semibold text-[#cbd5e1]">C</span> or the
                Capture Photo button.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {capturedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-xl border border-[#1f2937] bg-black"
                  >
                    <img
                      src={photo.url}
                      alt={`Captured ${photo.timestamp}`}
                      className="aspect-video w-full object-cover"
                    />
                    <div className="flex items-center gap-1.5 bg-[#0b1220] px-2 py-1.5">
                      <span className="text-xs">📷</span>
                      <span className="text-[11px] text-[#94a3b8]">
                        {photo.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-[#166534]/60 bg-[#031f0d] px-2 py-2">
      <p className="text-sm">{icon}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-[#86efac]/70">
        {label}
      </p>
      <p className="text-xs font-semibold text-white">{value}</p>
    </div>
  );
}

function KeyHint({
  keyLabel,
  description,
}: {
  keyLabel: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 min-w-7 items-center justify-center rounded-md border border-[#334155] bg-[#111827] px-2 text-xs font-bold text-[#cbd5e1]">
        {keyLabel}
      </span>
      <span className="text-xs text-[#94a3b8]">{description}</span>
    </div>
  );
}
