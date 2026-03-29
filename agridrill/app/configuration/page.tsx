"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiInfo, FiLoader, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { Roboto } from "next/font/google";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const defaults = {
  bedLengthM: 10,
  bedWidthM: 1.2,
  holeSpacingCm: 30,
  drillingDepthCm: 10,
  numberOfRows: 4,
  rowSpacingCm: 30,
  cropProfile: "",
  notes: "",
};

const schema = z.object({
  bedLengthM: z.coerce.number().min(1, "Bed length must be at least 1 m").max(50, "Bed length must be at most 50 m"),
  bedWidthM: z.coerce.number().min(0.5, "Bed width must be at least 0.5 m").max(10, "Bed width must be at most 10 m"),
  holeSpacingCm: z.coerce.number().min(20, "Hole spacing must be between 20 and 40 cm").max(40, "Hole spacing must be between 20 and 40 cm"),
  drillingDepthCm: z.coerce.number().min(5, "Drilling depth must be between 5 and 15 cm").max(15, "Drilling depth must be between 5 and 15 cm"),
  numberOfRows: z.coerce.number().int("Number of rows must be an integer").min(1, "Number of rows must be between 1 and 20").max(20, "Number of rows must be between 1 and 20"),
  rowSpacingCm: z.coerce.number().min(20, "Row spacing must be between 20 and 60 cm").max(60, "Row spacing must be between 20 and 60 cm"),
  cropProfile: z.string().min(1, "Please select a crop profile"),
  notes: z.string().max(500, "Notes must be at most 500 characters").optional(),
});

function toLocalTime(value: string | null | undefined): string {
  if (!value) return "--:--:--";
  return new Date(value).toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface PresetRow {
  id: string;
  crop_profile: string;
  bed_length_cm: number;
  bed_width_cm: number;
  hole_spacing_cm: number;
  drilling_depth_cm: number;
  number_of_rows?: number;
  row_spacing_cm?: number;
  session_notes?: string;
  updated_at?: string;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

interface ConfigurationFormValues {
  bedLengthM: number;
  bedWidthM: number;
  holeSpacingCm: number;
  drillingDepthCm: number;
  numberOfRows: number;
  rowSpacingCm: number;
  cropProfile: string;
  notes?: string;
}

function mapPresetRowToForm(row: PresetRow) {
  return {
    bedLengthM: Number(row.bed_length_cm) / 100,
    bedWidthM: Number(row.bed_width_cm) / 100,
    holeSpacingCm: Number(row.hole_spacing_cm),
    drillingDepthCm: Number(row.drilling_depth_cm),
    numberOfRows: row.number_of_rows ?? defaults.numberOfRows,
    rowSpacingCm: row.row_spacing_cm ?? defaults.rowSpacingCm,
    cropProfile: row.crop_profile,
    notes: row.session_notes ?? "",
  };
}

export default function ConfigurationPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [presets, setPresets] = useState<PresetRow[]>([]);
  const [activeSummary, setActiveSummary] = useState<{
    appliedAt: string | null;
    appliedBy: string;
    configuration: typeof defaults;
  }>({
    appliedAt: null,
    appliedBy: "unknown",
    configuration: defaults,
  });
  const [presetName, setPresetName] = useState<string>("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pageReady, setPageReady] = useState<boolean>(false);
  const [clickedButton, setClickedButton] = useState<string>("");
  const clickFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onChange",
  });

  const currentValues = watch();

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const triggerButtonFeedback = useCallback((key: string) => {
    setClickedButton(key);
    if (clickFeedbackTimeoutRef.current) {
      clearTimeout(clickFeedbackTimeoutRef.current);
    }
    clickFeedbackTimeoutRef.current = setTimeout(() => {
      setClickedButton("");
    }, 180);
  }, []);

  const loadPresets = useCallback(async () => {
    const { data, error } = await supabase
      .from("configurations")
      .select("id,crop_profile,bed_length_cm,bed_width_cm,hole_spacing_cm,drilling_depth_cm,number_of_rows,row_spacing_cm,session_notes,updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      const legacy = await supabase
        .from("configurations")
        .select("id,crop_profile,bed_length_cm,bed_width_cm,hole_spacing_cm,drilling_depth_cm,updated_at")
        .order("updated_at", { ascending: false });

      if (legacy.error) {
        showToast("error", "Failed to load crop profiles from Supabase.");
        return;
      }
      setPresets(legacy.data ?? []);
      return;
    }

    setPresets(data ?? []);
  }, [showToast, supabase]);

  const loadActiveSummary = useCallback(async () => {
    const withSnapshot = await supabase
      .from("sessions")
      .select("created_at,operator_name,configuration_snapshot")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!withSnapshot.error && withSnapshot.data?.configuration_snapshot) {
      setActiveSummary({
        appliedAt: withSnapshot.data.created_at,
        appliedBy: withSnapshot.data.operator_name || "unknown",
        configuration: withSnapshot.data.configuration_snapshot,
      });
      return;
    }

    const fallback = await supabase
      .from("sessions")
      .select("created_at,operator_name,notes")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallback.error || !fallback.data) {
      return;
    }

    const parsed = fallback.data.notes?.startsWith("CFG_SNAPSHOT:")
      ? JSON.parse(fallback.data.notes.replace("CFG_SNAPSHOT:", ""))
      : defaults;

    setActiveSummary({
      appliedAt: fallback.data.created_at,
      appliedBy: fallback.data.operator_name || "unknown",
      configuration: parsed,
    });
  }, [supabase]);

  useEffect(() => {
    loadPresets();
    loadActiveSummary();
  }, [loadPresets, loadActiveSummary]);

  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setPageReady(true);
    }, 20);

    return () => clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    return () => {
      if (clickFeedbackTimeoutRef.current) {
        clearTimeout(clickFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      showToast("error", "Preset name is required.");
      return;
    }

    const values = schema.safeParse(currentValues);
    if (!values.success) {
      showToast("error", "Please fix validation errors before saving a preset.");
      return;
    }

    setLoading(true);
    const payload = {
      crop_profile: presetName.trim(),
      bed_length_cm: values.data.bedLengthM * 100,
      bed_width_cm: values.data.bedWidthM * 100,
      hole_spacing_cm: values.data.holeSpacingCm,
      drilling_depth_cm: values.data.drillingDepthCm,
      number_of_rows: values.data.numberOfRows,
      row_spacing_cm: values.data.rowSpacingCm,
      session_notes: values.data.notes || null,
      is_last_used: false,
    };

    const { error } = await supabase.from("configurations").insert(payload);
    if (error) {
      const legacyPayload = {
        crop_profile: presetName.trim(),
        bed_length_cm: values.data.bedLengthM * 100,
        bed_width_cm: values.data.bedWidthM * 100,
        hole_spacing_cm: values.data.holeSpacingCm,
        drilling_depth_cm: values.data.drillingDepthCm,
        is_last_used: false,
      };
      const legacyInsert = await supabase.from("configurations").insert(legacyPayload);
      if (legacyInsert.error) {
        showToast("error", "Failed to save preset.");
        setLoading(false);
        return;
      }
    }

    setValue("cropProfile", presetName.trim());
    setPresetName("");
    await loadPresets();
    showToast("success", "Preset saved to Supabase.");
    setLoading(false);
  };

  const handleLoadPreset = () => {
    const preset = presets.find((item) => item.id === selectedPresetId);
    if (!preset) {
      showToast("error", "Select a preset to load.");
      return;
    }
    reset(mapPresetRowToForm(preset));
    showToast("success", `Loaded preset: ${preset.crop_profile}`);
  };

  const handleDeletePreset = async () => {
    if (!selectedPresetId) {
      showToast("error", "Select a preset to delete.");
      return;
    }
    const preset = presets.find((item) => item.id === selectedPresetId);
    const confirmed = window.confirm(`Delete preset '${preset?.crop_profile || "selected"}'?`);
    if (!confirmed) return;

    setLoading(true);
    const { error } = await supabase.from("configurations").delete().eq("id", selectedPresetId);
    if (error) {
      showToast("error", "Failed to delete preset.");
      setLoading(false);
      return;
    }

    setSelectedPresetId("");
    await loadPresets();
    showToast("success", "Preset deleted.");
    setLoading(false);
  };

  interface ConfigurationFormValues {
    bedLengthM: number;
    bedWidthM: number;
    holeSpacingCm: number;
    drillingDepthCm: number;
    numberOfRows: number;
    rowSpacingCm: number;
    cropProfile: string;
    notes?: string;
  }

  const onApplyConfiguration = async (values: ConfigurationFormValues) => {
    setLoading(true);

    const actorName = "Operator";
    const snapshot = {
      bedLengthM: values.bedLengthM,
      bedWidthM: values.bedWidthM,
      holeSpacingCm: values.holeSpacingCm,
      drillingDepthCm: values.drillingDepthCm,
      numberOfRows: values.numberOfRows,
      rowSpacingCm: values.rowSpacingCm,
      cropProfile: values.cropProfile,
      notes: values.notes || "",
    };

    const commandResponse = await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "APPLY_CONFIGURATION",
        payload: snapshot,
      }),
    });
    const commandJson = await commandResponse.json();
    if (!commandResponse.ok || !commandJson.ok) {
      showToast("error", "Robot command rejected. Configuration not applied.");
      setLoading(false);
      return;
    }

    const sessionInsert = await supabase.from("sessions").insert({
      operator_name: actorName,
      mode: "AUTO",
      notes: values.notes || null,
      configuration_snapshot: snapshot,
    });

    if (sessionInsert.error) {
      const fallback = await supabase.from("sessions").insert({
        operator_name: actorName,
        mode: "AUTO",
        notes: `CFG_SNAPSHOT:${JSON.stringify(snapshot)}`,
      });
      if (fallback.error) {
        showToast("error", "Configuration command sent, but failed to persist session snapshot.");
        setLoading(false);
        return;
      }
    }

    setActiveSummary({
      appliedAt: new Date().toISOString(),
      appliedBy: actorName,
      configuration: snapshot,
    });

    showToast("success", "Configuration applied and saved.");
    setLoading(false);
  };

  const inputClassName = "w-full rounded-xl border border-[#dbe2ea] bg-[#fbfdff] px-3 py-2.5 text-sm text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-4 focus:ring-[#2563eb]/10";
  const sectionTitleClassName = "text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b7287]";

  return (
    <main className={`${roboto.className} min-h-screen bg-[#f1f5f9] text-[#0f172a] antialiased`}>
      <header
        className={`sticky top-0 z-20 border-b border-[#1d4ed8] bg-[#2563eb]/95 backdrop-blur-md shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition-all duration-700 ${
          pageReady ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#bfdbfe]">AgriDrill Operations</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Field Configuration Console</h1>
            </div>
          </div>
          <span className="hidden rounded-full border border-[#60a5fa] bg-[#1d4ed8] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#dbeafe] md:inline-block">
            Pre-Session Setup
          </span>
        </div>
      </header>

      {toast ? (
        <div className="fixed right-4 top-24 z-50 transition-all duration-300 animate-[fadeIn_0.25s_ease-out]">
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-[0_16px_32px_rgba(15,23,42,0.16)] ${toast.type === "success" ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]" : "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"}`}>
            {toast.type === "success" ? <FiCheckCircle className="text-2xl" /> : <FiAlertCircle className="text-2xl" />}
            <span>{toast.message}</span>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onApplyConfiguration)} className="mx-auto grid w-full max-w-7xl gap-8 p-5 xl:grid-cols-[1.45fr_0.95fr]">
        <div className={`space-y-8 transition-all duration-700 delay-100 ${pageReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
          <section className="rounded-3xl border border-[#d8e0ea] bg-linear-to-br from-white/95 to-[#f1f5f9] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
            <p className={sectionTitleClassName}>Section A - Active Configuration Summary</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#dbe2ea] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-[#617b90]">Bed</p>
                <p className="mt-1 font-bold text-[#10273a]">{activeSummary.configuration.bedLengthM} m x {activeSummary.configuration.bedWidthM} m</p>
              </div>
              <div className="rounded-xl border border-[#dbe2ea] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-[#617b90]">Spacing</p>
                <p className="mt-1 font-bold text-[#10273a]">{activeSummary.configuration.holeSpacingCm} cm hole / {activeSummary.configuration.rowSpacingCm} cm row</p>
              </div>
              <div className="rounded-xl border border-[#dbe2ea] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-[#617b90]">Depth + Rows</p>
                <p className="mt-1 font-bold text-[#10273a]">{activeSummary.configuration.drillingDepthCm} cm / {activeSummary.configuration.numberOfRows} rows</p>
              </div>
              <div className="rounded-xl border border-[#dbe2ea] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3.5">
                <p className="text-[11px] uppercase tracking-wide text-[#617b90]">Profile</p>
                <p className="mt-1 font-bold text-[#10273a]">{activeSummary.configuration.cropProfile || "N/A"}</p>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-[#5f7589]">Last applied at {toLocalTime(activeSummary.appliedAt)} by {activeSummary.appliedBy}</p>
          </section>

          <section className="rounded-3xl border border-[#d8e0ea] bg-linear-to-br from-white/95 to-[#f1f5f9] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
            <p className={sectionTitleClassName}>Section B - Configuration Form</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#334155]">
                  Bed Length (m)
                  <FiInfo className="text-[#2563eb] cursor-pointer" title="Length of the planting bed in meters." />
                </label>
                <input type="number" step="0.1" className={inputClassName + " focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] transition-shadow hover:shadow-md"} {...register("bedLengthM")} />
                {errors.bedLengthM ? <p className="mt-1 text-xs font-medium text-[#dc2626]">{errors.bedLengthM.message}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#334155]">
                  Bed Width (m)
                  <FiInfo className="text-[#2563eb] cursor-pointer" title="Width of the planting bed in meters." />
                </label>
                <input type="number" step="0.1" className={inputClassName + " focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] transition-shadow hover:shadow-md"} {...register("bedWidthM")} />
                {errors.bedWidthM ? <p className="mt-1 text-xs font-medium text-[#dc2626]">{errors.bedWidthM.message}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#334155]">
                  Hole Spacing (cm)
                  <FiInfo className="text-[#2563eb] cursor-pointer" title="Distance between holes in centimeters." />
                </label>
                <input type="number" step="1" className={inputClassName + " focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] transition-shadow hover:shadow-md"} {...register("holeSpacingCm")} />
                {errors.holeSpacingCm ? <p className="mt-1 text-xs font-medium text-[#dc2626]">{errors.holeSpacingCm.message}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#334155]">
                  Drilling Depth (cm)
                  <FiInfo className="text-[#2563eb] cursor-pointer" title="Depth to drill in centimeters." />
                </label>
                <input type="number" step="1" className={inputClassName + " focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] transition-shadow hover:shadow-md"} {...register("drillingDepthCm")} />
                {errors.drillingDepthCm ? <p className="mt-1 text-xs font-medium text-[#dc2626]">{errors.drillingDepthCm.message}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#334155]">
                  Number of Rows
                  <FiInfo className="text-[#2563eb] cursor-pointer" title="Total number of rows in the bed." />
                </label>
                <input type="number" step="1" className={inputClassName + " focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] transition-shadow hover:shadow-md"} {...register("numberOfRows")} />
                {errors.numberOfRows ? <p className="mt-1 text-xs font-medium text-[#dc2626]">{errors.numberOfRows.message}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#334155]">
                  Row Spacing (cm)
                  <FiInfo className="text-[#2563eb] cursor-pointer" title="Distance between rows in centimeters." />
                </label>
                <input type="number" step="1" className={inputClassName + " focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] transition-shadow hover:shadow-md"} {...register("rowSpacingCm")} />
                {errors.rowSpacingCm ? <p className="mt-1 text-xs font-medium text-[#dc2626]">{errors.rowSpacingCm.message}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#334155]">
                  Crop Profile
                  <FiInfo className="text-[#2563eb] cursor-pointer" title="Select the crop profile for this configuration." />
                </label>
                <select className={inputClassName + " focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] transition-shadow hover:shadow-md"} {...register("cropProfile")}> 
                  <option value="">Select crop profile</option>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.crop_profile}>{preset.crop_profile}</option>
                  ))}
                </select>
                {errors.cropProfile ? <p className="mt-1 text-xs font-medium text-[#dc2626]">{errors.cropProfile.message}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#334155]">
                  Notes (optional)
                  <FiInfo className="text-[#2563eb] cursor-pointer" title="Any additional notes for this configuration." />
                </label>
                <textarea rows={4} className={inputClassName + " focus:ring-2 focus:ring-[#2563eb]/40 focus:border-[#2563eb] transition-shadow hover:shadow-md"} {...register("notes")} />
                {errors.notes ? <p className="mt-1 text-xs font-medium text-[#dc2626]">{errors.notes.message}</p> : null}
              </div>
            </div>
          </section>
        </div>

        <div className={`space-y-8 transition-all duration-700 delay-200 ${pageReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
          <section className="rounded-3xl border border-[#d8e0ea] bg-linear-to-br from-white/95 to-[#f1f5f9] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
            <p className={sectionTitleClassName}>Section C - Preset Management</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5f7589]">Preset Name</label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  placeholder="e.g. Lettuce Bed - Dry Soil"
                  className={inputClassName}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerButtonFeedback("save-preset");
                  handleSavePreset();
                }}
                disabled={loading || isSubmitting}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border border-[#2563eb] bg-[#3b82f6] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.22)] transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60 ${
                  clickedButton === "save-preset" ? "scale-[0.98]" : ""
                }`}
              >
                {loading && clickedButton === "save-preset" ? <FiLoader className="animate-spin" /> : null}
                Save as Preset
              </button>

              <div className="h-px bg-[#e2e8f0]" />

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5f7589]">Load Preset</label>
                <select
                  value={selectedPresetId}
                  onChange={(event) => setSelectedPresetId(event.target.value)}
                  className={inputClassName}
                >
                  <option value="">Choose preset</option>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.crop_profile}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerButtonFeedback("load-preset");
                    handleLoadPreset();
                  }}
                  disabled={loading || isSubmitting}
                  className={`flex items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-[#334155] transition hover:bg-[#e2e8f0] disabled:cursor-not-allowed disabled:opacity-60 ${
                    clickedButton === "load-preset" ? "scale-[0.98]" : ""
                  }`}
                >
                  {loading && clickedButton === "load-preset" ? <FiLoader className="animate-spin" /> : null}
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerButtonFeedback("delete-preset");
                    handleDeletePreset();
                  }}
                  disabled={loading || isSubmitting}
                  className={`flex items-center justify-center gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-sm font-semibold text-[#b91c1c] transition hover:bg-[#fee2e2] disabled:cursor-not-allowed disabled:opacity-60 ${
                    clickedButton === "delete-preset" ? "scale-[0.98]" : ""
                  }`}
                >
                  {loading && clickedButton === "delete-preset" ? <FiLoader className="animate-spin" /> : null}
                  Delete
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#d8e0ea] bg-linear-to-br from-white/95 to-[#f1f5f9] p-5 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
            <p className={sectionTitleClassName}>Section D - Apply and Reset</p>
            <div className="mt-4 space-y-2.5">
              <button
                type="submit"
                onClick={() => triggerButtonFeedback("apply")}
                disabled={loading || isSubmitting}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border border-[#16a34a] bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(22,163,74,0.24)] transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60 ${
                  clickedButton === "apply" ? "scale-[0.98]" : ""
                }`}
              >
                {loading && clickedButton === "apply" ? <FiLoader className="animate-spin" /> : null}
                Apply Configuration
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerButtonFeedback("reset");
                  reset(defaults);
                }}
                disabled={loading || isSubmitting}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-5 py-2.5 text-sm font-semibold text-[#334155] transition hover:bg-[#e2e8f0] disabled:cursor-not-allowed disabled:opacity-60 ${
                  clickedButton === "reset" ? "scale-[0.98]" : ""
                }`}
              >
                {loading && clickedButton === "reset" ? <FiLoader className="animate-spin" /> : null}
                Reset to Defaults
              </button>
            </div>
          </section>
        </div>
      </form>
    </main>
  );
}