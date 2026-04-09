"use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardTopNav from "../../components/DashboardTopNav";

// Top navigation links and routes (from Dashboard)
const topNavLinks = ["Dashboard", "Camera", "Sensor", "Calibration", "Data Export"];

const topNavRoutes = {
    Dashboard: "/dashboard",
    Camera: "/camera",
    Sensor: "/sensor-debug",
    Calibration: "/calibration",
    "Data Export": "/export",
};

import { format } from "date-fns";

// Dummy session data for UI demo
const dummySessions = [
	{ id: "sess1", date: new Date(2026, 3, 6), holes: 1200, size: 2.1 },
	{ id: "sess2", date: new Date(2026, 2, 28), holes: 950, size: 1.7 },
	{ id: "sess3", date: new Date(2026, 2, 15), holes: 1430, size: 2.5 },
];

const dataTypes = [
	{ key: "runlogs", label: "Run Logs (CSV)" },
	{ key: "telemetry", label: "Sensor Telemetry (CSV)" },
	{ key: "coords", label: "Planting Coordinates (JSON)" },
	{ key: "faults", label: "Fault Logs (CSV)" },
	{ key: "bundle", label: "Full Session Bundle (ZIP)" },
];

export default function ExportPage() {
		const router = useRouter();
	const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
	const [selectedTypes, setSelectedTypes] = useState<string[]>([dataTypes[0].key]);
	const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" });
	const [downloading, setDownloading] = useState(false);
	const [fileSize, setFileSize] = useState<string | null>(null);

	// Dummy file size estimate logic
	React.useEffect(() => {
		if (selectedSessions.length === 0 || selectedTypes.length === 0) {
			setFileSize(null);
			return;
		}
		// Fake estimate: 0.5MB per session per type
		const size = (selectedSessions.length * selectedTypes.length * 0.5).toFixed(1);
		setFileSize(`${size} MB`);
	}, [selectedSessions, selectedTypes]);

	// Real download handler (demo: generates CSV/JSON based on selected types)
	const handleDownload = () => {
		setDownloading(true);

		// Simulate data generation
		setTimeout(() => {
			let fileContent = '';
			let fileType = 'text/plain';
			let fileName = 'exported-data';

			if (selectedTypes.includes('bundle')) {
				fileContent = 'This is a demo ZIP bundle. (Replace with real ZIP logic)';
				fileType = 'application/zip';
				fileName += '.zip';
			} else if (selectedTypes.includes('coords')) {
				// Demo JSON
				const coords = selectedSessions.map(id => ({ session: id, coords: [[123.45, 67.89], [98.76, 54.32]] }));
				fileContent = JSON.stringify(coords, null, 2);
				fileType = 'application/json';
				fileName += '.json';
			} else {
				// Demo CSV
				const headers = ['Session', 'Type', 'Value'];
				const rows: string[][] = [];
				selectedSessions.forEach(sessId => {
					selectedTypes.forEach(type => {
						if (type !== 'coords' && type !== 'bundle') {
							rows.push([sessId, type, Math.random().toFixed(4)]);
						}
					});
				});
				fileContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
				fileType = 'text/csv';
				fileName += '.csv';
			}

			const blob = new Blob([fileContent], { type: fileType });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			setDownloading(false);
		}, 1200);
	};

	// Session filter by date range (demo only)
	const filteredSessions = dummySessions.filter(sess => {
		if (dateRange.from && new Date(sess.date) < new Date(dateRange.from)) return false;
		if (dateRange.to && new Date(sess.date) > new Date(dateRange.to)) return false;
		return true;
	});

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50 font-sans text-gray-900 flex flex-col text-base">
			{/* Top Navigation Bar */}
			<DashboardTopNav />
			<main className="flex-1 w-full max-w-2xl mx-auto p-4 sm:p-10 animate-fadeInUp">
				{/* Session Selector */}
				<section className="mb-12">
					<div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8 mb-8">
						<h2 className="font-bold text-2xl sm:text-3xl mb-6 text-blue-800 font-sans">Select Sessions</h2>
						<div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-6">
							<div className="flex flex-col gap-2 flex-1">
								<label className="font-semibold text-gray-700 mb-1 text-lg">Date Range</label>
								<div className="flex gap-2">
									<input type="date" className="border border-blue-200 rounded-lg px-3 py-2 text-base font-sans focus:ring-2 focus:ring-blue-300" value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} />
									<span className="px-2 text-gray-500 text-base">to</span>
									<input type="date" className="border border-blue-200 rounded-lg px-3 py-2 text-base font-sans focus:ring-2 focus:ring-blue-300" value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} />
								</div>
							</div>
						</div>
						<ul className="divide-y divide-blue-100 rounded-2xl border border-blue-100 bg-blue-50/60 shadow overflow-hidden">
							{filteredSessions.length === 0 && (
								<li className="p-8 text-gray-400 text-center text-lg">No sessions found for selected date range.</li>
							)}
							{filteredSessions.map(sess => (
								<li key={sess.id} className="flex items-center gap-6 px-6 py-5 hover:bg-blue-100/60 transition text-base">
									<input
										type="checkbox"
										checked={selectedSessions.includes(sess.id)}
										onChange={e => setSelectedSessions(sel => e.target.checked ? [...sel, sess.id] : sel.filter(id => id !== sess.id))}
										className="w-5 h-5 accent-blue-600 rounded border border-blue-300"
									/>
									<span className="flex-1 font-semibold text-lg font-sans">{format(sess.date, "yyyy-MM-dd")}</span>
									<span className="text-gray-500 text-base font-mono">{sess.holes} holes</span>
									<span className="text-gray-400 text-base font-mono">{sess.size} MB</span>
								</li>
							))}
						</ul>
					</div>
				</section>

				{/* Data Type Selector */}
				<section className="mb-12">
					<div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8 mb-8">
						<h2 className="font-bold text-2xl sm:text-3xl mb-6 text-blue-800 font-sans">Select Data Types</h2>
						<div className="flex flex-wrap gap-4">
							{dataTypes.map(dt => (
								<label key={dt.key} className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 cursor-pointer font-semibold text-lg transition font-sans ${selectedTypes.includes(dt.key) ? "bg-blue-100 border-blue-500 text-blue-800 shadow" : "bg-white border-gray-200 text-gray-600"}`}>
									<input
										type="checkbox"
										checked={selectedTypes.includes(dt.key)}
										onChange={e => setSelectedTypes(sel => e.target.checked ? [...sel, dt.key] : sel.filter(k => k !== dt.key))}
										className="w-5 h-5 accent-blue-600 rounded border border-blue-300"
									/>
									{dt.label}
								</label>
							))}
						</div>
					</div>
				</section>

				{/* Download Button & File Size */}
				<div className="flex flex-col sm:flex-row items-center gap-8 mt-10">
					<button
						className="px-12 py-4 rounded-xl bg-blue-700 text-white font-extrabold text-xl shadow-lg hover:bg-blue-800 transition disabled:opacity-60 font-sans focus:outline-none focus:ring-2 focus:ring-blue-400"
						onClick={handleDownload}
						disabled={selectedSessions.length === 0 || selectedTypes.length === 0 || downloading}
					>
						{downloading ? "Preparing..." : "Download Selected"}
					</button>
					<div className="text-lg text-gray-600 font-semibold font-sans">
						{fileSize ? `Estimated file size: ${fileSize}` : ""}
					</div>
				</div>
			</main>
		</div>
	);
}


