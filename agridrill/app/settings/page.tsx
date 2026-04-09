"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DashboardTopNav from "../../components/DashboardTopNav";

// Dummy/fake data for UI prototyping
const dummyConnection = {
  ssid: "AgriDrillNet",
  ip: "http://192.168.254.107:5000",
  signal: -54,
  supabaseUrl: "https://bmtldbrkkexsxotuipdm.supabase.co",
  realtime: true,
};
const dummyFirmware = {
  rpi: { version: "v2.1.0", updated: "2026-04-01 14:22" },
  esp32: { version: "v1.8.3", updated: "2026-03-28 09:10" },
};
const dummyResources = {
  cpu: 23,
  ram: 41,
  disk: 68,
};

const dummyPrefs = {
  seedlingAlert: 10,
  refreshRate: 5,
  pinAuth: true,
};

const topNavLinks = ["Dashboard", "Camera", "Sensor", "Calibration", "Data Export", "Settings"];
const topNavRoutes = {
  Dashboard: "/dashboard",
  Camera: "/camera",
  Sensor: "/sensor-debug",
  Calibration: "/calibration",
  "Data Export": "/export",
  Settings: "/settings",
};

export default function SettingsPage() {
  const router = useRouter();
  const [connection] = useState(dummyConnection);
  const [firmware] = useState(dummyFirmware);
  const [resources, setResources] = useState(dummyResources);
  const [prefs, setPrefs] = useState(dummyPrefs);
  const [showRestart, setShowRestart] = useState(false);
  const [showReboot, setShowReboot] = useState(false);

  // Simulate fetching system resources
  useEffect(() => {
    // Replace with fetch('/api/status') in real app
    const interval = setInterval(() => {
      setResources({
        cpu: Math.floor(Math.random() * 60) + 20,
        ram: Math.floor(Math.random() * 60) + 20,
        disk: Math.floor(Math.random() * 40) + 60,
      });
    }, prefs.refreshRate * 1000);
    return () => clearInterval(interval);
  }, [prefs.refreshRate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 font-sans text-gray-900 flex flex-col text-[18px]">
      <DashboardTopNav />
      <main className="flex-1 w-full max-w-5xl mx-auto p-2 sm:p-12 animate-fadeInUp space-y-16">
        {/* Connection Info */}
        <section className="bg-white rounded-3xl shadow-2xl border border-blue-200 p-12 transition-transform duration-200 hover:scale-[1.015]">
          <h2 className="font-bold text-3xl mb-10 text-blue-800 font-sans flex items-center gap-4">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
            Connection Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xl">
            <div className="flex items-center gap-2"><span className="font-semibold">SSID:</span> <span className="font-mono">{connection.ssid}</span></div>
            <div className="flex items-center gap-2"><span className="font-semibold">IP Address:</span> <span className="font-mono">{connection.ip}</span></div>
            <div className="flex items-center gap-2"><span className="font-semibold">Signal Strength:</span> <span className="font-mono">{connection.signal} dBm</span></div>
            <div className="flex items-center gap-2"><span className="font-semibold">Supabase URL:</span> <span className="text-blue-700 underline break-all">{connection.supabaseUrl}</span></div>
            <div className="flex items-center gap-2"><span className="font-semibold">Realtime Status:</span> <span className={connection.realtime ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{connection.realtime ? "Online" : "Offline"}</span></div>
          </div>
        </section>
        <div className="h-2" />

        {/* Firmware Versions */}
        <section className="bg-white rounded-3xl shadow-2xl border border-blue-200 p-12 transition-transform duration-200 hover:scale-[1.015]">
          <h2 className="font-bold text-3xl mb-10 text-blue-800 font-sans flex items-center gap-4">
            <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 16h8M8 8h8" /></svg>
            Firmware Versions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xl">
            <div className="flex flex-col gap-1"><span className="font-semibold">Raspberry Pi 5:</span> <span className="font-mono text-blue-700">{firmware.rpi.version}</span> <span className="text-gray-500 text-sm">(updated {firmware.rpi.updated})</span></div>
            <div className="flex flex-col gap-1"><span className="font-semibold">ESP32:</span> <span className="font-mono text-green-700">{firmware.esp32.version}</span> <span className="text-gray-500 text-sm">(updated {firmware.esp32.updated})</span></div>
          </div>
        </section>
        <div className="h-2" />

        {/* Server Controls */}
        <section className="bg-white rounded-3xl shadow-2xl border border-yellow-200 p-12 transition-transform duration-200 hover:scale-[1.015]">
          <h2 className="font-bold text-3xl mb-10 text-blue-800 font-sans flex items-center gap-4">
            <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6v6H9z" /></svg>
            Server Controls
          </h2>
          <div className="flex flex-col sm:flex-row gap-8">
            <button
              className="flex-1 px-8 py-4 rounded-xl bg-yellow-500 text-white font-bold text-lg shadow hover:bg-yellow-600 transition flex items-center gap-3 justify-center"
              onClick={() => setShowRestart(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4.93 4.93a10 10 0 1 1 0 14.14" /><path d="M8 17v5H3" /></svg>
              Restart Next.js Server
            </button>
            <button
              className="flex-1 px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg shadow hover:bg-red-700 transition flex items-center gap-3 justify-center"
              onClick={() => setShowReboot(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 19.07a10 10 0 1 1 14.14 0" /></svg>
              Reboot Raspberry Pi 5
            </button>
          </div>
          {/* Confirmation Dialogs */}
          {showRestart && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
              <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center">
                <p className="mb-6 text-lg font-semibold text-gray-800">Are you sure you want to restart the Next.js server?</p>
                <div className="flex gap-6">
                  <button className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold" onClick={() => setShowRestart(false)}>Cancel</button>
                  <button className="px-6 py-2 rounded-lg bg-yellow-500 text-white font-bold" onClick={() => { setShowRestart(false); alert('Server restart triggered! (Demo)'); }}>Restart</button>
                </div>
              </div>
            </div>
          )}
          {showReboot && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
              <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center">
                <p className="mb-6 text-lg font-semibold text-gray-800">Are you sure you want to reboot the Raspberry Pi 5?</p>
                <div className="flex gap-6">
                  <button className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold" onClick={() => setShowReboot(false)}>Cancel</button>
                  <button className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold" onClick={() => { setShowReboot(false); alert('Raspberry Pi reboot triggered! (Demo)'); }}>Reboot</button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* System Resources */}
        <section className="bg-white rounded-3xl shadow-2xl border border-blue-200 p-12 transition-transform duration-200 hover:scale-[1.015]">
          <h2 className="font-bold text-3xl mb-10 text-blue-800 font-sans flex items-center gap-4">
            <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" /></svg>
            System Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-xl">
            <div className="flex flex-col gap-2">
              <span className="font-semibold flex items-center gap-2"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6" /><circle cx="12" cy="12" r="10" /></svg>CPU Usage:</span>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                <div className="bg-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: `${resources.cpu}%` }} />
              </div>
              <span className="text-blue-700 font-bold">{resources.cpu}%</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold flex items-center gap-2"><svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6" /><circle cx="12" cy="12" r="10" /></svg>RAM Usage:</span>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                <div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${resources.ram}%` }} />
              </div>
              <span className="text-green-700 font-bold">{resources.ram}%</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-semibold flex items-center gap-2"><svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6" /><circle cx="12" cy="12" r="10" /></svg>Disk Usage:</span>
              <div className="w-full bg-gray-200 rounded-full h-4 mt-1">
                <div className="bg-yellow-500 h-4 rounded-full transition-all duration-500" style={{ width: `${resources.disk}%` }} />
              </div>
              <span className="text-yellow-700 font-bold">{resources.disk}%</span>
            </div>
          </div>
        </section>
        <div className="h-2" />

        {/* Preferences */}
        <section className="bg-white rounded-3xl shadow-2xl border border-purple-200 p-12 transition-transform duration-200 hover:scale-[1.015]">
          <h2 className="font-bold text-3xl mb-10 text-blue-800 font-sans flex items-center gap-4">
            <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M12 9v6" /></svg>
            Preferences
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xl">
            <div className="flex flex-col gap-3">
              <label className="font-semibold">Seedling Low-Alert Threshold</label>
              <input
                type="number"
                min={1}
                className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-lg font-sans mt-2"
                value={prefs.seedlingAlert}
                onChange={e => setPrefs(p => ({ ...p, seedlingAlert: Number(e.target.value) }))}
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="font-semibold">Dashboard Refresh Rate (sec)</label>
              <input
                type="number"
                min={1}
                className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 text-lg font-sans mt-2"
                value={prefs.refreshRate}
                onChange={e => setPrefs(p => ({ ...p, refreshRate: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-4 mt-4 sm:col-span-2">
              <input
                type="checkbox"
                checked={prefs.pinAuth}
                onChange={e => setPrefs(p => ({ ...p, pinAuth: e.target.checked }))}
                className="w-6 h-6 accent-blue-600"
              />
              <label className="font-semibold">Enable PIN Authentication</label>
            </div>
          </div>
        </section>
        <div className="h-2" />

        {/* About */}
        <section className="bg-white rounded-3xl shadow-2xl border border-blue-200 p-12 transition-transform duration-200 hover:scale-[1.015]">
          <h2 className="font-bold text-3xl mb-10 text-blue-800 font-sans flex items-center gap-4">
            <svg className="w-7 h-7 text-blue-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" /></svg>
            About
          </h2>
          <div className="text-xl space-y-3">
            <div><span className="font-semibold">Project:</span> AgriDrill Mission Suite</div>
            <div><span className="font-semibold">Team:</span> Team TRI-SQUAD</div>
            <div><span className="font-semibold">Adviser:</span> Engr. Lindl Michael Enario</div>
            <div><span className="font-semibold">Branding:</span> <span className="text-blue-700">CIT University</span></div>
          </div>
        </section>
      </main>
    </div>
  );
}
