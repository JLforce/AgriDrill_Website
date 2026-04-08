"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import DashboardTopNav from "../../components/DashboardTopNav";


// Type definitions
type Sensor = {
  key: string;
  name: string;
  unit: string;
  min: number;
  max: number;
};

type SensorHistory = {
  [key: string]: number[];
};

type CurrentValues = {
  [key: string]: number;
};

const sensors: Sensor[] = [
  { key: "ultrasonic", name: "Ultrasonic (Back)", unit: "cm", min: 0, max: 200 },
  { key: "imu_heading", name: "IMU Heading", unit: "°", min: 0, max: 360 },
  { key: "encoder", name: "Encoder", unit: "counts", min: 0, max: 10000 },
  { key: "hopper", name: "Hopper Level", unit: "%", min: 0, max: 100 },
  { key: "battery", name: "Battery Voltage", unit: "V", min: 10, max: 16 },
  { key: "mcu_temp", name: "MCU Temperature", unit: "°C", min: -20, max: 85 },
];

const makeInitialHistory = (min: number, max: number): number[] => Array.from({ length: 60 }, () => min + Math.random() * (max - min));

const getInitialSensorData = (): SensorHistory => {
  const acc: SensorHistory = {};
  sensors.forEach(s => {
    acc[s.key] = makeInitialHistory(s.min, s.max);
  });
  return acc;
};

const getInitialCurrentValues = (): CurrentValues => {
  const acc: CurrentValues = {};
  sensors.forEach(s => {
    acc[s.key] = s.min + Math.random() * (s.max - s.min);
  });
  return acc;
};

export default function SensorDebugPage() {
  const router = useRouter();
  const [sensorHistory, setSensorHistory] = useState<SensorHistory>(() => getInitialSensorData());
  const [currentValues, setCurrentValues] = useState<CurrentValues>(() => getInitialCurrentValues());
  const [taskStats, setTaskStats] = useState<{ cpu: number; heap: number; tasks: number }>({ cpu: 12, heap: 20480, tasks: 7 });

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorHistory(prev => {
        const updated: SensorHistory = { ...prev };
        sensors.forEach((s: Sensor) => {
          const prevArr = prev[s.key];
          const next = Math.max(s.min, Math.min(s.max, prevArr[prevArr.length - 1] + (Math.random() - 0.5) * (s.max - s.min) * 0.02));
          updated[s.key] = [...prevArr.slice(1), next];
        });
        return updated;
      });
      setCurrentValues(prev => {
        const updated: CurrentValues = { ...prev };
        sensors.forEach((s: Sensor) => {
          updated[s.key] = sensorHistory[s.key][sensorHistory[s.key].length - 1];
        });
        return updated;
      });
      setTaskStats({
        cpu: 10 + Math.random() * 20,
        heap: 20000 + Math.random() * 5000,
        tasks: 6 + Math.floor(Math.random() * 3),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sensorHistory]);

  // Status badge logic
  const getStatus = (val: number, min: number, max: number) => {
    if (val < min || val > max) return { label: "FAULT", color: "bg-red-100 text-red-700 border-red-300" };
    if ((val - min) / (max - min) < 0.1 || (max - val) / (max - min) < 0.1) return { label: "WARN", color: "bg-yellow-100 text-yellow-700 border-yellow-300" };
    return { label: "OK", color: "bg-green-100 text-green-700 border-green-300" };
  };

  // Button handlers (dummy)
  const triggerTestPulse = () => alert("Test pulse triggered!");
  const resetEncoder = () => alert("Encoder counts reset!");

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 font-inter text-[16px] text-gray-900 flex flex-col">
      {/* Dashboard Top Navigation Bar */}
      <DashboardTopNav />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-10 animate-fadeInUp">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-14">
          {sensors.map((s: Sensor) => {
            const val = currentValues[s.key];
            const status = getStatus(val, s.min, s.max);
            return (
              <div key={s.key} className="bg-white/90 rounded-3xl shadow-2xl p-8 border border-gray-100 flex flex-col gap-3 hover:shadow-blue-200 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-extrabold text-xl text-gray-800 tracking-tight">{s.name}</span>
                  <span className={`ml-auto px-4 py-1 rounded-full border text-sm font-bold ${status.color}`}>{status.label}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-mono font-black text-blue-700 drop-shadow">{val.toFixed(2)}</span>
                  <span className="text-lg text-gray-500 font-semibold">{s.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <span>Min: {s.min}{s.unit}</span>
                  <span className="mx-1">|</span>
                  <span>Max: {s.max}{s.unit}</span>
                </div>
                {/* Range bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full my-2">
                  <div
                    className="h-3 rounded-full bg-blue-400 transition-all"
                    style={{ width: `${((val - s.min) / (s.max - s.min)) * 100}%` }}
                  />
                </div>
                {/* Sparkline */}
                <div className="w-full h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensorHistory[s.key].map((v: number, i: number) => ({ t: i, v }))} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <Line type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Special buttons */}
                {s.key === "ultrasonic" && (
                  <button className="mt-3 px-5 py-2 rounded-lg bg-blue-600 text-white font-bold shadow hover:bg-blue-700 transition text-base" onClick={triggerTestPulse}>
                    Trigger Test Pulse
                  </button>
                )}
                {s.key === "encoder" && (
                  <button className="mt-3 px-5 py-2 rounded-lg bg-gray-700 text-white font-bold shadow hover:bg-gray-800 transition text-base" onClick={resetEncoder}>
                    Reset Encoder Counts
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {/* ESP32 FreeRTOS Task Stats */}
        <section className="bg-white/95 rounded-3xl shadow-xl p-8 border border-gray-100 max-w-2xl mx-auto">
          <div className="font-extrabold text-2xl mb-6 text-gray-800 flex items-center gap-3 tracking-tight">
            <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            <span>ESP32 FreeRTOS Task Stats</span>
          </div>
          <div className="flex flex-col gap-3 text-lg">
            <div className="flex items-center gap-2"><span className="font-semibold w-44">CPU Usage:</span> <span className="font-mono text-blue-700 font-bold">{taskStats.cpu.toFixed(1)}%</span></div>
            <div className="flex items-center gap-2"><span className="font-semibold w-44">Heap Free:</span> <span className="font-mono text-green-700 font-bold">{taskStats.heap.toFixed(0)} bytes</span></div>
            <div className="flex items-center gap-2"><span className="font-semibold w-44">Task Count:</span> <span className="font-mono text-gray-800 font-bold">{taskStats.tasks}</span></div>
          </div>
        </section>
      </main>
    </div>
  );
}

