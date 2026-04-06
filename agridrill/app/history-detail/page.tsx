"use client";
import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

// Dummy data for demonstration
const session = {
  id: "S001",
  date: "2026-03-28T10:00:00Z",
  bedId: "B12",
  holesDrilled: 120,
  duration: "00:45:00",
  faults: 2,
  status: "Completed",
};

const xteData = Array.from({ length: 30 }, (_, i) => ({
  hole: i + 1,
  xte: Math.random() * 10 - 5,
}));

const depthData = Array.from({ length: 30 }, (_, i) => ({
  hole: i + 1,
  actual: 45 + Math.random() * 10,
  target: 50,
}));

const spacingData = Array.from({ length: 30 }, (_, i) => ({
  hole: i + 1,
  actual: 10 + Math.random() * 2,
  target: 12,
}));

const stats = [
  { metric: "Depth", min: 45.1, max: 54.8, mean: 49.9, stddev: 2.1 },
  { metric: "Spacing", min: 10.2, max: 13.1, mean: 11.8, stddev: 0.7 },
  { metric: "XTE", min: -4.9, max: 4.7, mean: 0.2, stddev: 2.3 },
];

const faults = [
  { time: "00:12:10", code: "F01", desc: "Drill jam detected" },
  { time: "00:33:45", code: "F02", desc: "Depth sensor error" },
];

export default function HistoryDetailPage() {
  // Export session as JSON
  const handleExport = () => {
    const data = {
      session,
      xteData,
      depthData,
      spacingData,
      stats,
      faults,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (

    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-[15px] text-gray-900">
      <h1 className="text-3xl font-extrabold text-green-700 mb-8 tracking-tight">Session Detail</h1>
      {/* Session Summary Header */}
      <section className="w-full max-w-6xl mx-auto mb-10">
        <div className="flex flex-wrap items-center gap-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-gray-200 font-sans text-base text-gray-900">
          <div className="flex flex-col items-start min-w-[120px]">
            <span className="text-xs text-gray-500 font-medium mb-1">Session Date</span>
            <span className="font-bold text-[20px] text-gray-800">{new Date(session.date).toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-start min-w-[80px]">
            <span className="text-xs text-gray-500 font-medium mb-1">Bed ID</span>
            <span className="font-semibold text-[17px] text-gray-700">{session.bedId}</span>
          </div>
          <div className="flex flex-col items-start min-w-[100px]">
            <span className="text-xs text-gray-500 font-medium mb-1">Total Holes</span>
            <span className="font-semibold text-[17px] text-gray-700">{session.holesDrilled}</span>
          </div>
          <div className="flex flex-col items-start min-w-[100px]">
            <span className="text-xs text-gray-500 font-medium mb-1">Duration</span>
            <span className="font-semibold text-[17px] text-gray-700">{session.duration}</span>
          </div>
          <div className="flex flex-col items-start min-w-[80px]">
            <span className="text-xs text-gray-500 font-medium mb-1">Faults</span>
            <span className={`font-semibold text-[17px] flex items-center gap-1 ${session.faults > 0 ? "text-red-600" : "text-gray-700"}`}>
              {session.faults}
              {session.faults > 0 && (
                <svg className="inline-block w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </span>
          </div>
          <div className="flex flex-col items-start min-w-[90px]">
            <span className="text-xs text-gray-500 font-medium mb-1">Status</span>
            <span className={`inline-block rounded px-3 py-1 text-sm font-bold border ${session.status === "Completed" ? "bg-green-100 text-green-800 border-green-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"}`}>
              {session.status}
            </span>
          </div>
          <div className="ml-auto flex-1 flex justify-end">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition flex items-center gap-2 text-base"
              onClick={handleExport}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
              Export Session
            </button>
          </div>
        </div>
      </section>


      {/* Charts */}
      <section className="w-full max-w-6xl mx-auto mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 font-sans">Session Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            <div className="font-semibold mb-2 flex items-center gap-2 text-base">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3v18" /></svg>
              Cross-Track Error (XTE) Over Time
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={xteData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hole" label={{ value: "Hole #", position: "insideBottomRight", offset: -5 }} />
                <YAxis label={{ value: "XTE (cm)", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="xte" stroke="#10b981" strokeWidth={2} dot={false} name="XTE" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            <div className="font-semibold mb-2 flex items-center gap-2 text-base">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Hole Depth Accuracy
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={depthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hole" label={{ value: "Hole #", position: "insideBottomRight", offset: -5 }} />
                <YAxis label={{ value: "Depth (mm)", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual Depth" />
                <Bar dataKey="target" fill="#a7f3d0" name="Target Depth" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 lg:col-span-2 text-gray-900">
            <div className="font-semibold mb-2 flex items-center gap-2 text-base">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Spacing Accuracy
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={spacingData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hole" label={{ value: "Hole #", position: "insideBottomRight", offset: -5 }} />
                <YAxis label={{ value: "Spacing (cm)", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="actual" fill="#f59e42" name="Actual Spacing" />
                <Bar dataKey="target" fill="#a7f3d0" name="Target Spacing" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>


      {/* Statistics Table & Field Map Replay */}
      <section className="w-full max-w-6xl mx-auto mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 lg:col-span-2">
            <div className="font-semibold mb-2 flex items-center gap-2 text-base">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Statistics
            </div>
            <table className="min-w-full text-sm text-gray-900">
              <thead>
                  <tr className="bg-gray-100 text-gray-900">
                  <th className="px-3 py-2 text-left">Metric</th>
                  <th className="px-3 py-2 text-right">Min</th>
                  <th className="px-3 py-2 text-right">Max</th>
                  <th className="px-3 py-2 text-right">Mean</th>
                  <th className="px-3 py-2 text-right">StdDev</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((row) => (
                  <tr key={row.metric}>
                    <td className="px-3 py-2 font-semibold text-gray-900">{row.metric}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{row.min}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{row.max}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{row.mean}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{row.stddev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 flex flex-col items-center justify-center text-gray-900">
            <div className="font-semibold mb-2 flex items-center gap-2 text-base">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /></svg>
              Field Map Replay
            </div>
            {/* Placeholder for static field map image */}
            <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400 border-2 border-dashed border-green-200">
              Field Map Image
            </div>
          </div>
        </div>
      </section>

      {/* Fault Log Table */}
      <section className="w-full max-w-6xl mx-auto mb-10">
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-gray-900">
          <div className="font-semibold mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" /></svg>
            Fault Log
          </div>
          <table className="min-w-full text-sm text-gray-900">
            <thead>
              <tr className="bg-gray-100 text-gray-900">
                <th className="px-3 py-2 text-left">Timestamp</th>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {faults.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-gray-900">{row.time}</td>
                  <td className="px-3 py-2 font-semibold text-red-600">{row.code}</td>
                  <td className="px-3 py-2 text-gray-900">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
