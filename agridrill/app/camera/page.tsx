"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [exposurePreset, setExposurePreset] = useState("auto");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour12: false }),
  );

  // Mock CV data - in production, this would come from ESP32 endpoint
  const [cvData] = useState({
    live: true,
    resolution: "1920x1080",
    fps: 30,
    algorithm: "Row Follow",
    rowConfidence: 87,
    lateralOffset: 2.3,
    obstacle: null,
  });

  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setPageReady(true);
    }, 10);

    const clockInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    }, 1000);

    return () => {
      clearTimeout(readyTimer);
      clearInterval(clockInterval);
    };
  }, []);

  const handleSnapshot = useCallback(() => {
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    const video = videoRef.current as HTMLVideoElement | null;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob: Blob | null) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `camera_snapshot_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, []);

  const handleToggleRecord = useCallback(() => {
    setIsRecording((prev) => !prev);
    // In production, this would trigger MJPEG recording on ESP32
  }, []);

  const handleZoom = (direction: "in" | "out") => {
    setZoomLevel((prev) => {
      const next = direction === "in" ? prev + 10 : prev - 10;
      return Math.max(100, Math.min(next, 200));
    });
  };

  const getConfidenceBadgeStyle = (confidence: number) => {
    if (confidence >= 80) {
      return "border-[#14532d] bg-[#052e16]/90 text-[#86efac]";
    }
    if (confidence >= 60) {
      return "border-[#92400e] bg-[#451a03]/90 text-[#fdba74]";
    }
    return "border-[#991b1b] bg-[#450a0a]/90 text-[#fca5a5]";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "STRONG";
    if (confidence >= 60) return "FAIR";
    return "WEAK";
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_20%,#1e3a8a_0%,transparent_35%),radial-gradient(circle_at_85%_12%,#0f766e_0%,transparent_30%),#030712] text-white">
      {/* ── FEATURE CARD: LIVE MACHINE VISION ── */}
      {/* <div className="featureCard max-w-md mx-auto mt-24 mb-8 rounded-xl border-4 border-[#333] bg-[#18181b] p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-white">Live Machine Vision</h3>
        <img
          src="http://192.168.254.107:5000/video_feed"
          alt="Live Machine Vision Feed"
          width="100%"
          style={{ borderRadius: '10px', border: '3px solid #333' }}
        />
        <p className="mt-4 text-lg font-semibold text-white">
          Status: <span style={{ color: 'green' }}>STREAMING LIVE</span>
        </p>
      </div> */}
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header
        className={`absolute left-0 right-0 top-0 z-20 border-b border-[#1f2937] bg-black/55 backdrop-blur-md transition-all duration-700 ${
          pageReady ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-full items-center justify-between px-5 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg border border-[#334155] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-[#dbeafe] transition hover:border-[#60a5fa] hover:text-white"
            >
              ← Back
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#93c5fd]">AgriDrill Vision</p>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white">Live Camera Feed</h1>
            </div>
          </div>
 
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[#1e40af] bg-[#0f172a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#93c5fd] md:inline-block">
              Vision + CV Overlay
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-[#dbeafe] transition hover:border-[#60a5fa] hover:text-white"
            >
              {showSettings ? "Hide Settings" : "Settings"}
            </button>
          </div>
        </div>
      </header>
 
      {/* ── LIVE STREAM CONTAINER ──────────────────────────────── */}
      <div className="relative h-screen w-full overflow-hidden bg-black pt-16">
        <div className="pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[40px_40px]" />
 
        {/* Video stream placeholder */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-[#0f172a] to-black"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "center",
            transition: "transform 0.2s ease-out",
            filter: `brightness(${brightness + 50}%) contrast(${contrast + 50}%)`,
          }}
        >
          <Image
            src="http://192.168.254.112:5000/video_feed"
            alt="Live Machine Vision Feed"
            width={1280}
            height={720}
            style={{ borderRadius: '10px', border: '3px solid #333', width: '100%', height: 'auto' }}
            unoptimized
            priority
          />
        </div>
 
        {/* Canvas for snapshots - hidden */}
        <canvas ref={canvasRef} className="hidden" />
 
        {/* ── CV OVERLAY BADGES ──────────────────────────────────── */}
        <div className="absolute left-4 top-20 z-10 flex flex-col gap-2 md:left-5">
          {/* LIVE Indicator */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#dc2626] bg-[#450a0a]/85 px-3 py-1.5 shadow-[0_0_24px_rgba(220,38,38,0.25)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#fca5a5]">LIVE</span>
          </div>
 
          {/* Resolution & FPS */}
          <div className="rounded-lg border border-[#334155] bg-[#0f172a]/80 px-3 py-2 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#93c5fd]">
              {cvData.resolution} @ {cvData.fps} FPS
            </p>
          </div>
 
          {/* Algorithm Name */}
          <div className="rounded-lg border border-[#1d4ed8] bg-[#1e3a8a]/40 px-3 py-2 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#3b82f6]">
              Algorithm: {cvData.algorithm}
            </p>
          </div>
        </div>
 
        {/* ── CV DATA BADGES - RIGHT SIDE ────────────────────────── */}
        <div className="absolute right-4 top-20 z-10 flex flex-col gap-2 md:right-5">
          {/* Row Confidence */}
          <div className={`rounded-lg border px-3 py-2 backdrop-blur ${getConfidenceBadgeStyle(cvData.rowConfidence)}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em]">
              Row Detection: {cvData.rowConfidence}% ({getConfidenceLabel(cvData.rowConfidence)})
            </p>
          </div>
 
          {/* Lateral Offset */}
          <div className="rounded-lg border border-[#334155] bg-[#0f172a]/80 px-3 py-2 backdrop-blur">
            <p className="text-xs font-bold text-[#cbd5e1]">
              Lateral Offset:{" "}
              <span className={cvData.lateralOffset > 0 ? "text-[#22c55e]" : "text-[#f87171]"}>
                {cvData.lateralOffset > 0 ? "+" : ""}
                {cvData.lateralOffset} cm
              </span>
            </p>
          </div>
 
          {/* Obstacle Detection */}
          <div
            className={`rounded-lg border px-3 py-2 backdrop-blur ${
              cvData.obstacle
                ? "border-[#991b1b] bg-[#450a0a]/85 text-[#fca5a5]"
                : "border-[#166534] bg-[#052e16]/80 text-[#86efac]"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.08em]">
              {cvData.obstacle ? `OBSTACLE: ${cvData.obstacle} cm` : "CLEAR"}
            </p>
          </div>
        </div>
 
        {/* ── CONTROL BAR (Bottom) ────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-[#1f2937] bg-linear-to-t from-black to-black/60 backdrop-blur-md">
          <div className="mx-auto flex max-w-full flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-4">
            {/* Left controls */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                type="button"
                onClick={handleSnapshot}
                className="flex items-center gap-2 rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-xs font-semibold text-[#cbd5e1] transition hover:border-[#60a5fa] hover:text-white active:scale-[0.98]"
              >
                <span className="text-lg">📷</span>
                Snapshot
              </button>
 
              <button
                type="button"
                onClick={handleToggleRecord}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition active:scale-[0.98] ${
                  isRecording
                    ? "border-[#dc2626] bg-[#7f1d1d] text-[#fca5a5]"
                    : "border-[#334155] bg-[#0f172a] text-[#cbd5e1] hover:border-[#60a5fa] hover:text-white"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isRecording ? "bg-[#dc2626] animate-pulse" : "bg-[#6b7280]"}`} />
                {isRecording ? "Recording..." : "Record"}
              </button>
            </div>
 
            {/* Center - Zoom Controls */}
            <div className="flex items-center gap-2 rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2">
              <button
                type="button"
                onClick={() => handleZoom("out")}
                disabled={zoomLevel <= 100}
                className="rounded px-2 py-1 text-sm font-bold text-[#cbd5e1] transition hover:text-white disabled:opacity-50"
              >
                −
              </button>
              <span className="w-12 text-center text-xs font-semibold text-[#cbd5e1]">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => handleZoom("in")}
                disabled={zoomLevel >= 200}
                className="rounded px-2 py-1 text-sm font-bold text-[#cbd5e1] transition hover:text-white disabled:opacity-50"
              >
                +
              </button>
            </div>
 
            {/* Right - Info */}
            <div className="flex items-center gap-2 rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 md:px-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">
                Time: {currentTime}
              </span>
            </div>
          </div>
        </div>
      </div>
 
      {/* ── CAMERA SETTINGS PANEL (Collapsible) ──────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 z-30">
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            aria-label="Close settings"
          />
 
          <div className="absolute right-0 top-0 h-screen w-80 overflow-y-auto border-l border-[#1f2937] bg-[#0b1220] shadow-[0_0_40px_rgba(2,6,23,0.6)]">
            <div className="space-y-6 p-5 pt-20">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Camera Settings</h2>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="rounded-md border border-[#334155] bg-[#111827] px-2 py-1 text-xs font-semibold text-[#cbd5e1] transition hover:border-[#60a5fa] hover:text-white"
                >
                  Close
                </button>
              </div>
 
            {/* Brightness */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#cbd5e1]">
                Brightness: {brightness}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full cursor-pointer accent-[#3b82f6]"
              />
            </div>
 
            {/* Contrast */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#cbd5e1]">
                Contrast: {contrast}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full cursor-pointer accent-[#3b82f6]"
              />
            </div>
 
            {/* Exposure Presets */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-[#cbd5e1]">Exposure Preset</label>
              <div className="space-y-2">
                {["auto", "manual", "indoor", "outdoor", "low-light"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setExposurePreset(preset)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      exposurePreset === preset
                        ? "border-[#3b82f6] bg-[#1f2937] text-white"
                        : "border-[#334155] bg-[#1f2937] text-[#cbd5e1] hover:border-[#475569]"
                    }`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1).replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
 
            {/* Divider */}
            <div className="h-px bg-[#1f2937]" />
 
            {/* Quick Actions */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-[#cbd5e1]">Quick Actions</label>
              <button
                type="button"
                onClick={() => {
                  setBrightness(50);
                  setContrast(50);
                  setExposurePreset("auto");
                  setZoomLevel(100);
                }}
                className="w-full rounded-lg border border-[#334155] bg-[#1f2937] px-4 py-2 text-sm font-semibold text-[#cbd5e1] transition hover:border-[#475569] hover:text-white"
              >
                Reset to Defaults
              </button>
            </div>
 
            {/* Info */}
            <div className="rounded-lg border border-[#334155] bg-[#1a1f2e] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Camera Info</p>
              <p className="mt-2 text-xs text-[#cbd5e1]">Raspberry Pi 5</p>
              <p className="text-xs text-[#cbd5e1]">Model: OV5647</p>
              <p className="text-xs text-[#cbd5e1]">Status: Connected</p>
            </div>
          </div>
          </div>
          </div>
        )}
      </main>
    );
}