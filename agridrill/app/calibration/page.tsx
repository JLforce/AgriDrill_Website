"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CalibrationStatus = "Uncalibrated" | "Calibrated" | "Needs Recalibration";

type ChecklistItem = {
	key: string;
	label: string;
	status: CalibrationStatus;
};

const initialChecklist: ChecklistItem[] = [
	{ key: "ultrasonic", label: "Ultrasonic Zero", status: "Uncalibrated" },
	{ key: "depth", label: "Drilling Depth", status: "Uncalibrated" },
	{ key: "imu", label: "IMU Heading Reset", status: "Uncalibrated" },
	{ key: "encoder", label: "Encoder Reset", status: "Uncalibrated" },
];

const sectionDefs = [
	{
		key: "ultrasonic",
		label: "Ultrasonic Zero",
		desc: "Place robot at known reference distance, then click 'Zero' to record offset.",
		action: "Zero",
		valueLabel: "Current Distance (cm)",
	},
	{
		key: "depth",
		label: "Drilling Depth",
		desc: "Trigger plunger to known depth, then click 'Set Depth Reference' to record limit switch offset.",
		action: "Set Depth Reference",
		valueLabel: "Current Depth (mm)",
	},
	{
		key: "imu",
		label: "IMU Heading Reset",
		desc: "Align robot to grid row, then click 'Set North' to set heading to 0°.",
		action: "Set North",
		valueLabel: "Current Heading (°)",
	},
	{
		key: "encoder",
		label: "Encoder Reset",
		desc: "Click 'Zero Encoders' to reset pulse counters to 0.",
		action: "Zero Encoders",
		valueLabel: "Current Encoder Count",
	},
];

	export default function CalibrationPage() {
		const router = useRouter();
		const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
		const [expanded, setExpanded] = useState<string | null>(sectionDefs[0].key);
		// Simulated live values for demo; replace with real sensor values
		const [liveValues, setLiveValues] = useState({
			ultrasonic: 123.4,
			depth: 45.6,
			imu: 12.3,
			encoder: 0,
		});
		const [saving, setSaving] = useState(false);
		const [saveMsg, setSaveMsg] = useState<string | null>(null);

		// Simulate live value updates
		useEffect(() => {
			const interval = setInterval(() => {
				setLiveValues(prev => ({
					ultrasonic: +(120 + Math.random() * 10).toFixed(2),
					depth: +(40 + Math.random() * 10).toFixed(2),
					imu: +(Math.random() * 360).toFixed(2),
					encoder: Math.floor(Math.random() * 1000),
				}));
			}, 1000);
			return () => clearInterval(interval);
		}, []);

		// Handle calibration action for each section
		const handleCalibrate = (key: string) => {
			setChecklist(list =>
				list.map(item =>
					item.key === key ? { ...item, status: "Calibrated" } : item
				)
			);
		};

		// Save calibration to Supabase and send to ESP32 (placeholder logic)
		const handleSave = async () => {
			setSaving(true);
			setSaveMsg(null);
			try {
				const supabase = getSupabaseBrowserClient();
				await supabase.from("configurations").upsert([
					{ key: "ultrasonic_offset", value: liveValues.ultrasonic },
					{ key: "depth_offset", value: liveValues.depth },
					{ key: "imu_north", value: liveValues.imu },
					{ key: "encoder_zero", value: liveValues.encoder },
				]);
				setSaveMsg("Calibration saved and sent to robot!");
			} catch (e) {
				setSaveMsg("Error saving calibration. Please try again.");
			}
			setSaving(false);
		};

		// Progress calculation
		const completed = checklist.filter(i => i.status === "Calibrated").length;
		const total = checklist.length;
		const progress = Math.round((completed / total) * 100);

		return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 font-sans text-gray-900 flex flex-col text-[18px]">
			<header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-green-200 flex items-center justify-between px-6 sm:px-14 py-6 shadow-md">
				<div className="flex items-center gap-4">
					<button
						className="flex items-center justify-center w-11 h-11 rounded-full border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 transition shadow-sm mr-2"
						onClick={() => router.back()}
						aria-label="Back"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
					</button>
					<h1 className="text-4xl font-extrabold text-green-700 tracking-tight drop-shadow font-sans">Calibration Wizard</h1>
				</div>
				<button
					className="px-8 py-3 rounded-2xl bg-green-700 text-white font-extrabold text-lg shadow hover:bg-green-800 transition disabled:opacity-60 border-2 border-green-700 font-sans"
					onClick={handleSave}
					disabled={saving}
				>
					{saving ? "Saving..." : "Save Calibration"}
				</button>
			</header>
			{/* Save message toast */}
			{saveMsg && (
				<div className="fixed top-24 right-8 z-50 bg-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg animate-fadeInUp text-lg font-sans">
					{saveMsg}
				</div>
			)}
			<main className="flex-1 w-full max-w-3xl mx-auto p-6 sm:p-14 animate-fadeInUp">
				{/* Progress Bar */}
				<section className="mb-10">
					<div className="flex items-center justify-between mb-3">
						<h2 className="font-bold text-2xl text-green-800 font-sans">Progress</h2>
						<span className="text-lg font-semibold text-green-700 font-mono">{completed} / {total} Complete</span>
					</div>
					<div className="w-full h-4 bg-green-100 rounded-full overflow-hidden">
						<div className="h-4 bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
					</div>
				</section>

				{/* Checklist */}
				<section className="mb-14">
					<h2 className="font-bold text-2xl mb-6 text-green-800 font-sans">Calibration Checklist</h2>
					<ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						{checklist.map(item => (
							<li key={item.key} className="flex items-center gap-4 p-5 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-green-200 transition-all min-h-[80px]">
								<span className={`w-7 h-7 flex items-center justify-center rounded-full border-2 ${item.status === "Calibrated" ? "border-green-500 bg-green-100" : item.status === "Needs Recalibration" ? "border-yellow-400 bg-yellow-50" : "border-gray-300 bg-gray-50"}`}>
									{item.status === "Calibrated" ? (
										<svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
									) : item.status === "Needs Recalibration" ? (
										<svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
									) : (
										<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
									)}
								</span>
								<span className="font-semibold text-gray-900 flex-1 truncate text-lg font-sans">{item.label}</span>
								<span className={`text-sm font-bold px-3 py-1 rounded-xl ${item.status === "Calibrated" ? "bg-green-100 text-green-700" : item.status === "Needs Recalibration" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>{item.status}</span>
							</li>
						))}
					</ul>
				</section>

				{/* Calibration Steps Accordion */}
				<section className="mb-40">
					<h2 className="font-bold text-2xl mb-6 text-green-800 font-sans">Step-by-Step Calibration</h2>
					<div className="space-y-7">
						{sectionDefs.map(section => (
							<div key={section.key} className="bg-white border border-green-100 rounded-3xl shadow-lg overflow-hidden">
								<button
									className="w-full flex items-center justify-between px-8 py-6 text-xl font-bold text-green-700 hover:bg-green-50 rounded-3xl focus:outline-none transition-all font-sans"
									onClick={() => setExpanded(expanded === section.key ? null : section.key)}
									aria-expanded={expanded === section.key}
								>
									<span className="flex items-center gap-3">
										<svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
										{section.label}
									</span>
									<svg className={`w-6 h-6 ml-2 transition-transform ${expanded === section.key ? "rotate-90" : "rotate-0"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
								</button>
								{expanded === section.key && (
									<div className="px-8 pb-8 pt-3 flex flex-col gap-6 animate-fadeInUp bg-green-50/60">
										<div className="text-gray-700 mb-2 text-lg font-sans">{section.desc}</div>
										<div className="flex items-center gap-6">
											<span className="font-mono text-4xl text-green-700 font-extrabold drop-shadow">{liveValues[section.key as keyof typeof liveValues]}</span>
											<span className="text-gray-500 font-semibold text-xl font-sans">{section.valueLabel}</span>
										</div>
										<button
											className="mt-2 px-8 py-3 rounded-xl bg-green-600 text-white font-extrabold shadow hover:bg-green-700 transition text-lg w-fit font-sans"
											onClick={() => handleCalibrate(section.key)}
										>
											{section.action}
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}

