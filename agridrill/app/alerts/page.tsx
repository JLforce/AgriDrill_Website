"use client";
import React, { useState } from "react";


type Severity = "CRITICAL" | "WARNING" | "INFO";

interface Alert {
  id: number;
  timestamp: string;
  fault_code: string;
  message: string;
  severity: Severity;
  session_id: string;
  acknowledged: boolean;
}

const alerts: Alert[] = [
  { id: 1, timestamp: "2026-04-06 14:32:10", fault_code: "F01", message: "Drill jam detected", severity: "CRITICAL", session_id: "S001", acknowledged: false },
  { id: 2, timestamp: "2026-04-06 14:30:05", fault_code: "F02", message: "Depth sensor error", severity: "WARNING", session_id: "S001", acknowledged: false },
  { id: 3, timestamp: "2026-04-06 14:25:00", fault_code: "F03", message: "Low battery", severity: "INFO", session_id: "S001", acknowledged: true },
  { id: 4, timestamp: "2026-04-06 14:20:00", fault_code: "F04", message: "GPS signal lost", severity: "CRITICAL", session_id: "S002", acknowledged: true },
];

const severityColors: Record<Severity, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-300",
  WARNING: "bg-yellow-100 text-yellow-700 border-yellow-300",
  INFO: "bg-blue-100 text-blue-700 border-blue-300",
};

const severityTabs: ("All" | Severity)[] = ["All", "CRITICAL", "WARNING", "INFO"];

export default function AlertsPage() {

  const [filter, setFilter] = useState<"All" | Severity>("All");
  const [alertList, setAlertList] = useState<Alert[]>(alerts);

  // Filtered alerts for event log
  const filteredAlerts = alertList.filter(a => filter === "All" || a.severity === filter);
  // Active (unacknowledged) alerts for panel
  const activeAlerts = alertList.filter(a => !a.acknowledged && (filter === "All" || a.severity === filter));

  // Acknowledge all
  const handleAcknowledgeAll = () => {
    setAlertList(list => list.map(a => ({ ...a, acknowledged: true })));
  };

  // Dismiss single alert

  const handleDismiss = (id: number) => {
    setAlertList(list => list.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-[15px] text-gray-900">
      <h1 className="text-3xl font-extrabold text-red-700 mb-8 tracking-tight">System Alerts & Fault Logs</h1>

      {/* Severity Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 items-center">
        {severityTabs.map(tab => (
          <button
            key={tab}
            className={`px-5 py-2 rounded-full font-semibold border transition text-base shadow-sm ${filter === tab ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </button>
        ))}
        <button
          className="ml-auto px-6 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition text-base"
          onClick={handleAcknowledgeAll}
        >
          Acknowledge All
        </button>
      </div>

      {/* Active Alerts Panel */}
      {activeAlerts.length > 0 && (
        <div className="mb-10 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="font-bold text-xl mb-4 text-red-700 flex items-center gap-2">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Active Alerts
          </div>
          <div className="flex flex-col gap-3">
            {activeAlerts.map(alert => (
              <div key={alert.id} className={`flex flex-wrap items-center gap-4 p-4 rounded-xl border ${severityColors[alert.severity]} font-semibold text-base`}> 
                <span className={`px-4 py-1 rounded-full border font-bold text-sm ${severityColors[alert.severity]}`}>{alert.severity}</span>
                <span className="text-gray-900">{alert.message}</span>
                <span className="ml-auto text-xs text-gray-500 font-mono">{alert.timestamp}</span>
                <button className="ml-4 px-4 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-semibold" onClick={() => handleDismiss(alert.id)}>Dismiss</button>
                {alert.session_id && (
                  <a href={`/history-detail?id=${alert.session_id}`} className="ml-2 underline text-blue-600 text-sm font-semibold hover:text-blue-800">View Session</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Log Table */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="font-bold text-xl mb-4 text-gray-800 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          Event Log
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-base text-gray-900">
            <thead>
              <tr className="bg-gray-100 text-gray-900">
                <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                <th className="px-4 py-3 text-left font-semibold">Fault Code</th>
                <th className="px-4 py-3 text-left font-semibold">Message</th>
                <th className="px-4 py-3 text-left font-semibold">Severity</th>
                <th className="px-4 py-3 text-left font-semibold">Session</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-lg">No events found.</td></tr>
              ) : (
                filteredAlerts.map(alert => (
                  <tr key={alert.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-gray-900">{alert.timestamp}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{alert.fault_code}</td>
                    <td className="px-4 py-3 text-gray-900">{alert.message}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full border text-sm font-bold ${severityColors[alert.severity]}`}>{alert.severity}</span>
                    </td>
                    <td className="px-4 py-3">
                      {alert.session_id ? (
                        <a href={`/history-detail?id=${alert.session_id}`} className="underline text-blue-600 text-sm font-semibold hover:text-blue-800">{alert.session_id}</a>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button className="px-4 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm font-semibold" onClick={() => handleDismiss(alert.id)}>Dismiss</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
