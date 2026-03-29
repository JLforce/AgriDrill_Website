"use client";

import { useState } from "react";
// import Link from "next/link";
import { FaSeedling, FaBatteryHalf, FaChartBar, FaDotCircle, FaPlay, FaPause, FaStop, FaRobot, FaTint, FaThermometerHalf, FaCloudSun, FaSun, FaFlask, FaWater, FaLock } from "react-icons/fa";

// Dummy data for demonstration
const kpi = {
  holesDrilled: { current: 8, target: 15 },
  seedlings: { remaining: 12, capacity: 24 },
  battery: { percent: 67, runtime: "1h 20m" },
  session: { percent: 53, minutes: 22 },
};

const robotStatus = {
  connection: "Connected", // Connected | Disconnected | Reconnecting
  mode: "AUTONOMOUS", // AUTONOMOUS | MANUAL | STANDBY
  esp32: true,
  rpi5: true,
  position: { row: 3, col: 7, heading: 92 },
};

const sensors = [
  { name: "Soil", value: "Wet", status: "green" },
  { name: "Temp", value: "23°C", status: "green" },
  { name: "Humidity", value: "54%", status: "amber" },
  { name: "Light", value: "OK", status: "green" },
  { name: "pH", value: "6.8", status: "green" },
  { name: "EC", value: "1.2", status: "green" },
  { name: "Water", value: "Low", status: "red" },
  { name: "Tray", value: "Locked", status: "green" },
];

const fieldMap = {
  rows: 4,
  cols: 8,
  planted: [
    [1, 1, 1, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0],
  ],
  robot: { row: 2, col: 3, heading: 92 },
  lastUpdate: "2026-03-27 14:32:10",
};

export default function OperationsPage() {
  const [mode, setMode] = useState(robotStatus.mode);
  const [expandedSensor, setExpandedSensor] = useState<number | null>(null);

  // Helper for battery color
  const batteryColor = (percent: number) => {
    if (percent > 60) return "bg-green-400";
    if (percent > 30) return "bg-amber-400";
    return "bg-red-400";
  };

  // Helper for mode badge
  const modeBadge = (mode: string) => {
    if (mode === "AUTONOMOUS") return "bg-green-100 text-green-700 border-green-400";
    if (mode === "MANUAL") return "bg-blue-100 text-blue-700 border-blue-400";
    return "bg-gray-100 text-gray-700 border-gray-400";
  };

  // Helper for connection badge
  const connectionBadge = (status: string) => {
    if (status === "Connected") return "bg-green-100 text-green-700 border-green-400";
    if (status === "Reconnecting") return "bg-amber-100 text-amber-700 border-amber-400";
    return "bg-red-100 text-red-700 border-red-400";
  };

  // Helper for sensor dot
  const sensorDot = (status: string) => {
    if (status === "green") return "bg-green-400";
    if (status === "amber") return "bg-amber-400";
    return "bg-red-400";
  };

  // Helper for field cell
  const cellColor = (val: number, r: number, c: number) => {
    if (fieldMap.robot.row === r && fieldMap.robot.col === c) return "bg-amber-300 animate-pulse border-2 border-amber-600";
    if (val === 1) return "bg-green-400";
    return "bg-gray-200";
  };

  // Button loading state (simulate for demo)
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const handleButtonClick = (btn: string, cb: () => void) => {
    setLoadingBtn(btn);
    setTimeout(() => {
      cb();
      setLoadingBtn(null);
    }, 600); // Simulate action
  };

  // Sensor icon helper
  const sensorIcon = (name: string) => {
    switch (name) {
      case "Soil": return <FaTint className="text-green-700" title="Soil Moisture" />;
      case "Temp": return <FaThermometerHalf className="text-red-500" title="Temperature" />;
      case "Humidity": return <FaCloudSun className="text-blue-400" title="Humidity" />;
      case "Light": return <FaSun className="text-yellow-400" title="Light" />;
      case "pH": return <FaFlask className="text-purple-500" title="pH Level" />;
      case "EC": return <FaFlask className="text-blue-500" title="EC (Conductivity)" />;
      case "Water": return <FaWater className="text-blue-700" title="Water Level" />;
      case "Tray": return <FaLock className="text-gray-700" title="Tray Lock" />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-2 sm:p-4 flex flex-col gap-10">
      {/* Section A: KPI Metric Cards */}
      <div className="pl-1 mb-2">
        <h2 className="text-xl font-extrabold text-gray-700 tracking-wide mb-1">Robot KPIs</h2>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border p-6 mt-0">
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
          {/* Holes Drilled */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-linear-to-br from-green-200 via-green-50 to-white p-6 shadow-md border border-green-100 hover:shadow-xl transition min-w-40">
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-3 shadow"><FaChartBar size={32} className="text-green-500" /></span>
            <span className="text-sm font-semibold text-gray-500 mb-1">Holes Drilled</span>
            <span className="text-3xl font-extrabold tracking-tight text-gray-800 mb-1">{kpi.holesDrilled.current}<span className="text-gray-400 font-bold">/{kpi.holesDrilled.target}</span></span>
          </div>
          {/* Seedlings Remaining */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-linear-to-br from-amber-200 via-amber-50 to-white p-6 shadow-md border border-amber-100 hover:shadow-xl transition min-w-40">
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-3 shadow"><FaSeedling size={32} className="text-amber-500" /></span>
            <span className="text-sm font-semibold text-gray-500 mb-1">Seedlings Remaining</span>
            <span className="text-3xl font-extrabold tracking-tight text-gray-800 mb-1">{kpi.seedlings.remaining}<span className="text-gray-400 font-bold">/{kpi.seedlings.capacity}</span></span>
          </div>
          {/* Battery */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-linear-to-br from-blue-200 via-blue-50 to-white p-6 shadow-md border border-blue-100 hover:shadow-xl transition min-w-40">
            <span className={`flex items-center justify-center w-14 h-14 rounded-full mb-3 shadow ${batteryColor(kpi.battery.percent)}`}><FaBatteryHalf size={28} className="text-white drop-shadow" /></span>
            <span className="text-sm font-semibold text-gray-500 mb-1">Battery</span>
            <span className={`text-2xl font-bold tracking-tight mb-1 ${batteryColor(kpi.battery.percent)} text-white px-3 py-1 rounded-full`}>{kpi.battery.percent}%</span>
            <span className="text-xs text-gray-400">{kpi.battery.runtime} est.</span>
          </div>
          {/* Session Progress */}
          <div className="flex flex-col items-center justify-center rounded-2xl bg-linear-to-br from-indigo-200 via-indigo-50 to-white p-6 shadow-md border border-indigo-100 hover:shadow-xl transition min-w-40">
            <span className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-3 shadow"><FaChartBar size={28} className="text-indigo-500" /></span>
            <span className="text-sm font-semibold text-gray-500 mb-1">Session Progress</span>
            <div className="w-full h-3 bg-gray-200 rounded-full mt-1 mb-2">
              <div className="h-full rounded-full bg-green-400 transition-all duration-500" style={{ width: `${kpi.session.percent}%` }} />
            </div>
            <span className="text-xs text-gray-400">{kpi.session.percent}% ({kpi.session.minutes} min left)</span>
          </div>
        </section>
      </div>

      {/* Section B & D: Robot Status Panel and Field Progress Map Side by Side */}
      <div className="my-6 border-t border-gray-200" />
      <div className="flex flex-col lg:flex-row gap-10 w-full">
        {/* Robot Status Panel */}
        <div className="w-full lg:max-w-105 shrink-0 mx-auto my-0">
          <div className="pl-1 mb-2">
            <h2 className="text-lg font-bold text-gray-700 tracking-wide mb-1">Robot Status</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-green-200 p-6 flex flex-col gap-4">
            {/* Status Row */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={`flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-sm shadow-sm ${connectionBadge(robotStatus.connection)}`} title="Robot connection status">
                <FaDotCircle className="text-green-400" size={18} /> {robotStatus.connection}
              </span>
              <span className={`flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-sm shadow-sm ${modeBadge(mode)}`} title="Current robot mode">
                <FaRobot className="text-blue-400" size={18} /> {mode}
              </span>
              <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-gray-50 text-xs font-semibold shadow-sm" title="Autonomous mode active">
                <FaRobot className="text-green-500" size={16} /> Autonomous
              </span>
            </div>
            {/* Divider */}
            <div className="border-t border-gray-200 my-2" />
            {/* Hardware Status */}
            <div className="flex gap-4 items-center mb-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-700" title="ESP32 status">
                <span className={`inline-block w-2 h-2 rounded-full ${robotStatus.esp32 ? "bg-green-400" : "bg-red-400"}`} />
                ESP32
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-gray-700" title="RPi5 status">
                <span className={`inline-block w-2 h-2 rounded-full ${robotStatus.rpi5 ? "bg-green-400" : "bg-red-400"}`} />
                RPi5
              </span>
              <span className="text-xs text-gray-500 ml-2">Row {robotStatus.position.row}, Col {robotStatus.position.col}, Heading: {robotStatus.position.heading}&deg;</span>
            </div>
            {/* Divider */}
            <div className="border-t border-gray-200 my-2" />
            {/* Mode Controls */}
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => handleButtonClick('AUTONOMOUS', () => setMode('AUTONOMOUS'))}
                className={`w-full py-2 rounded-lg border text-base font-semibold shadow transition-all duration-300 mb-1 ${mode === 'AUTONOMOUS' ? 'bg-green-100 border-green-400 text-green-700 scale-105' : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50'} ${loadingBtn === 'AUTONOMOUS' ? 'opacity-60' : ''}`}
                disabled={loadingBtn !== null}
                title="Switch to Autonomous mode"
              >
                {loadingBtn === 'AUTONOMOUS' ? <span className="animate-spin mr-1">⏳</span> : null}Autonomous
              </button>
              <button
                onClick={() => handleButtonClick('MANUAL', () => setMode('MANUAL'))}
                className={`w-full py-2 rounded-lg border text-base font-semibold shadow transition-all duration-300 mb-1 ${mode === 'MANUAL' ? 'bg-blue-100 border-blue-400 text-blue-700 scale-105' : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50'} ${loadingBtn === 'MANUAL' ? 'opacity-60' : ''}`}
                disabled={loadingBtn !== null}
                title="Switch to Manual mode"
              >
                {loadingBtn === 'MANUAL' ? <span className="animate-spin mr-1">⏳</span> : null}Manual
              </button>
              <button
                onClick={() => handleButtonClick('STANDBY', () => setMode('STANDBY'))}
                className={`w-full py-2 rounded-lg border text-base font-semibold shadow transition-all duration-300 ${mode === 'STANDBY' ? 'bg-gray-200 border-gray-400 text-gray-700 scale-105' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} ${loadingBtn === 'STANDBY' ? 'opacity-60' : ''}`}
                disabled={loadingBtn !== null}
                title="Switch to Standby mode"
              >
                {loadingBtn === 'STANDBY' ? <span className="animate-spin mr-1">⏳</span> : null}Standby
              </button>
            </div>
            {/* Divider */}
            <div className="border-t border-gray-200 my-2" />
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                className={`w-full py-2 rounded-lg bg-green-500 text-white text-base font-bold flex items-center justify-center gap-2 shadow hover:bg-green-600 transition-all ${loadingBtn === 'START' ? 'opacity-60' : ''}`}
                onClick={() => handleButtonClick('START', () => {})}
                disabled={loadingBtn !== null}
                title="Start robot"
              >
                {loadingBtn === 'START' ? <span className="animate-spin">⏳</span> : <FaPlay size={20} />}Start
              </button>
              <button
                className={`w-full py-2 rounded-lg bg-yellow-400 text-white text-base font-bold flex items-center justify-center gap-2 shadow hover:bg-yellow-500 transition-all ${loadingBtn === 'PAUSE' ? 'opacity-60' : ''}`}
                onClick={() => handleButtonClick('PAUSE', () => {})}
                disabled={loadingBtn !== null}
                title="Pause robot"
              >
                {loadingBtn === 'PAUSE' ? <span className="animate-spin">⏳</span> : <FaPause size={20} />}Pause
              </button>
              <button
                className={`w-full py-2 rounded-lg bg-blue-500 text-white text-base font-bold flex items-center justify-center gap-2 shadow hover:bg-blue-600 transition-all ${loadingBtn === 'RESUME' ? 'opacity-60' : ''}`}
                onClick={() => handleButtonClick('RESUME', () => {})}
                disabled={loadingBtn !== null}
                title="Resume robot"
              >
                {loadingBtn === 'RESUME' ? <span className="animate-spin">⏳</span> : <FaPlay size={20} />}Resume
              </button>
              <button
                className={`w-full py-2 rounded-lg bg-red-500 text-white text-base font-bold flex items-center justify-center gap-2 shadow hover:bg-red-600 transition-all ${loadingBtn === 'STOP' ? 'opacity-60' : ''}`}
                onClick={() => handleButtonClick('STOP', () => {})}
                disabled={loadingBtn !== null}
                title="Stop robot"
              >
                {loadingBtn === 'STOP' ? <span className="animate-spin">⏳</span> : <FaStop size={20} />}Stop
              </button>
            </div>
          </div>
        </div>
        {/* Field Progress Map */}
        <div className="w-full flex-1 min-w-[320px] lg:min-w-85 lg:max-w-175">
          <div className="pl-1 mb-2">
            <h2 className="text-lg font-bold text-gray-700 tracking-wide mb-1">Field Progress Map</h2>
          </div>
          <div className="bg-linear-to-br from-green-50 to-white rounded-2xl shadow-lg border border-green-100 p-6 h-full flex flex-col justify-between">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-green-700">Field Progress Map</span>
                <span className="text-xs text-gray-400">Last update: {fieldMap.lastUpdate}</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="overflow-x-auto">
                  <div className="inline-grid grid-cols-8 gap-1 bg-white rounded-xl p-2 border border-green-100 shadow-sm">
                    {fieldMap.planted.map((row, rIdx) =>
                      row.map((val, cIdx) => (
                        <div key={`${rIdx}-${cIdx}`} className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg border border-gray-200 flex items-center justify-center relative text-xs font-bold ${cellColor(val, rIdx, cIdx)}`}>
                          {fieldMap.robot.row === rIdx && fieldMap.robot.col === cIdx ? (
                            <span className="absolute inset-0 flex items-center justify-center animate-bounce text-amber-700 text-lg">&#8594;</span>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {/* Per-row progress bars */}
                <div className="space-y-1">
                  {fieldMap.planted.map((row, idx) => {
                    const planted = row.filter((v) => v === 1).length;
                    return (
                      <div key={idx} className="w-full h-2 bg-gray-200 rounded-full">
                        <div className="h-full rounded-full bg-green-400 transition-all duration-500" style={{ width: `${(planted / row.length) * 100}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-600 justify-center">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block border border-green-300" /> Planted</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-300 inline-block border border-amber-300" /> Robot</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 border border-gray-300 inline-block" /> Pending</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      
      {/* Section E: Sensor Status Strip */}
      <div className="my-8 border-t border-gray-200" />
      <div className="mt-4">
        <div className="pl-1 mb-2">
          <h2 className="text-lg font-bold text-gray-700 tracking-wide mb-1">Sensor Status</h2>
        </div>
        <div className="bg-linear-to-br from-blue-100 via-white to-blue-50 rounded-2xl shadow-lg border border-blue-200 px-4 py-4">
          <section className="flex flex-row items-center gap-3 overflow-x-auto">
            {sensors.map((sensor, idx) => (
              <div
                key={sensor.name}
                className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer group ${expandedSensor === idx ? 'bg-blue-50 border-blue-300 shadow-lg scale-105' : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-200'} focus-within:ring-2 focus-within:ring-blue-300`}
                onClick={() => setExpandedSensor(idx === expandedSensor ? null : idx)}
                tabIndex={0}
                title={sensor.name + ' sensor'}
                style={{ minWidth: 90 }}
              >
                <span className={`w-3 h-3 rounded-full mb-1 ${sensorDot(sensor.status)} group-hover:scale-125 transition`} />
                <span className="mb-1">{sensorIcon(sensor.name)}</span>
                <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition mb-0.5">{sensor.value}</span>
                <span className="text-[11px] text-gray-400 mb-0.5">{sensor.name}</span>
                {expandedSensor === idx && (
                  <div className="mt-2 p-2 bg-white rounded-lg shadow text-xs min-w-22.5 border border-blue-200 text-gray-700 animate-fadeIn">
                    <span className="font-semibold">{sensor.name}:</span> {sensor.value} status
                  </div>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}