"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function DataExport() {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const response = await fetch("/api/profile");

      if (!response.ok) {
        throw new Error("Could not retrieve profile data");
      }

      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "agridrill-profile-data.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Data exported successfully", { variant: "success" });
    } catch (err) {
      console.error("EXPORT ERROR:", err);
      showToast("Failed to export data", { variant: "error" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Export My Data</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Download a copy of your profile information stored in AgriDrill.
        </p>
      </div>

      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
      >
        <Download className="h-5 w-5" />
        {exporting ? "Exporting..." : "Download as JSON"}
      </button>
    </section>
  );
}