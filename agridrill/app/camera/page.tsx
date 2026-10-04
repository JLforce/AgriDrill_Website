"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { TopNavbar } from "@/components/dashboard/TopNavbar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SavedPhoto = {
  id: number;
  url: string;
  timestamp: string;
  filename: string;
  storagePath: string;
};

type StreamState = "connecting" | "live" | "offline";

/**
 * Camera stream address.
 *
 * Set NEXT_PUBLIC_CAMERA_STREAM_URL in .env.local (and in your hosting
 * settings) instead of editing the code. For a deployed (https) website
 * the address must also be https, for example through a tunnel, because
 * browsers block an http camera inside an https page.
 */
const STREAM_URL =
  process.env.NEXT_PUBLIC_CAMERA_STREAM_URL ??
  "http://192.168.8.140:5000/video_feed";

// Supabase Storage bucket that holds the captured photos (private).
const CAPTURE_BUCKET = "camera-captures";

// How many of the newest photos are shown on the page.
const CAPTURE_LIMIT = 24;

// How long a photo link stays valid (the bucket is private).
const SIGNED_URL_SECONDS = 60 * 60;

// Static camera info
const CAMERA_INFO = {
  name: "Area Ahead",
  model: "Raspberry Pi Camera Module 3",
  shortModel: "Pi Camera v3",
};

function BackToDashboardButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/dashboard")}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm transition hover:border-emerald-500 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#030712]"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 18l-6-6 6-6"
        />
      </svg>

      Back to Dashboard
    </button>
  );
}

function formatTimestamp(date: Date) {
  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    ", " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

function formatFilename(date: Date) {
  const pad = (value: number, length = 2) =>
    String(value).padStart(length, "0");

  return (
    `agridrill-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}` +
    `-${pad(date.getMilliseconds(), 3)}.jpg`
  );
}

export default function CameraPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => getSupabaseBrowserClient(),
    []
  );

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streamState, setStreamState] =
    useState<StreamState>("connecting");

  // Changing this number reloads the stream (used by "Retry").
  const [streamAttempt, setStreamAttempt] = useState(0);

  const [streamResolution, setStreamResolution] =
    useState<string | null>(null);

  const [savedPhotos, setSavedPhotos] = useState<
    SavedPhoto[]
  >([]);

  const [isLoadingPhotos, setIsLoadingPhotos] =
    useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [captureError, setCaptureError] = useState<
    string | null
  >(null);

  const streamSrc =
    streamAttempt === 0
      ? STREAM_URL
      : `${STREAM_URL}${STREAM_URL.includes("?") ? "&" : "?"}retry=${streamAttempt}`;

  // ============================================================
  // LOAD THE USER'S SAVED PHOTOS
  // ============================================================

  const loadCaptures = useCallback(async () => {
    setIsLoadingPhotos(true);

    const { data: userData } =
      await supabase.auth.getUser();

    const user = userData.user;

    if (!user) {
      setSavedPhotos([]);
      setIsLoadingPhotos(false);

      return;
    }

    const { data: rows, error } = await supabase
      .from("camera_captures")
      .select("id, created_at, storage_path, filename")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(CAPTURE_LIMIT);

    if (error) {
      console.error(
        "Failed to load saved photos:",
        error
      );

      setCaptureError("Failed to load your saved photos.");
      setIsLoadingPhotos(false);

      return;
    }

    if (!rows || rows.length === 0) {
      setSavedPhotos([]);
      setIsLoadingPhotos(false);

      return;
    }

    // The bucket is private, so every photo needs a temporary link.
    const { data: signedList, error: signedError } =
      await supabase.storage
        .from(CAPTURE_BUCKET)
        .createSignedUrls(
          rows.map((row) => row.storage_path),
          SIGNED_URL_SECONDS
        );

    if (signedError || !signedList) {
      console.error(
        "Failed to create photo links:",
        signedError
      );

      setCaptureError("Failed to load your saved photos.");
      setIsLoadingPhotos(false);

      return;
    }

    const urlByPath = new Map<string, string>();

    signedList.forEach((item) => {
      if (item.signedUrl && item.path) {
        urlByPath.set(item.path, item.signedUrl);
      }
    });

    setSavedPhotos(
      rows
        .filter((row) => urlByPath.has(row.storage_path))
        .map((row) => ({
          id: row.id,
          url: urlByPath.get(row.storage_path) as string,
          timestamp: formatTimestamp(
            new Date(row.created_at)
          ),
          filename: row.filename,
          storagePath: row.storage_path,
        }))
    );

    setIsLoadingPhotos(false);
  }, [supabase]);

  useEffect(() => {
    void loadCaptures();
  }, [loadCaptures]);

  // ============================================================
  // STREAM EVENTS
  // ============================================================

  const handleStreamLoad = useCallback(() => {
    const image = imageRef.current;

    setStreamState("live");
    setCaptureError(null);

    if (image && image.naturalWidth > 0) {
      setStreamResolution(
        `${image.naturalWidth} x ${image.naturalHeight}`
      );
    }
  }, []);

  const handleStreamError = useCallback(() => {
    console.warn("Camera feed unavailable");

    setStreamState("offline");
    setStreamResolution(null);
  }, []);

  const handleRetry = useCallback(() => {
    setStreamState("connecting");
    setCaptureError(null);
    setStreamAttempt((attempt) => attempt + 1);
  }, []);

  // ============================================================
  // SAVE A CAPTURE (Storage file + database row)
  // ============================================================

  const saveCapture = useCallback(
    async (
      blob: Blob,
      width: number,
      height: number,
      now: Date
    ): Promise<SavedPhoto> => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error("Not signed in");
      }

      const user = userData.user;

      const filename = formatFilename(now);

      // Every user has their own folder: <user id>/<file name>
      const storagePath = `${user.id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from(CAPTURE_BUCKET)
        .upload(storagePath, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Link the photo to the user's running operation, if there is one.
      const { data: runningSession } = await supabase
        .from("operation_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "running")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: row, error: insertError } =
        await supabase
          .from("camera_captures")
          .insert({
            user_id: user.id,
            operation_session_id: runningSession?.id ?? null,
            storage_path: storagePath,
            filename,
            width,
            height,
            size_bytes: blob.size,
          })
          .select("id, created_at")
          .single();

      if (insertError) {
        // Do not leave a file behind without a database record.
        await supabase.storage
          .from(CAPTURE_BUCKET)
          .remove([storagePath]);

        throw insertError;
      }

      const { data: signed, error: signedError } =
        await supabase.storage
          .from(CAPTURE_BUCKET)
          .createSignedUrl(storagePath, SIGNED_URL_SECONDS);

      if (signedError || !signed) {
        throw signedError ?? new Error("No photo link");
      }

      return {
        id: row.id,
        url: signed.signedUrl,
        timestamp: formatTimestamp(new Date(row.created_at)),
        filename,
        storagePath,
      };
    },
    [supabase]
  );

  // ============================================================
  // CAPTURE BUTTON
  // ============================================================

  const handleSnapshot = useCallback(async () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image || isSaving) return;

    // Do not save a blank picture when the camera is not showing video.
    if (streamState !== "live" || !image.naturalWidth) {
      setCaptureError(
        "The camera is not live yet, so a photo cannot be captured."
      );

      return;
    }

    const context = canvas.getContext("2d");

    if (!context) return;

    const width = image.naturalWidth;
    const height = image.naturalHeight;

    canvas.width = width;
    canvas.height = height;

    let blob: Blob | null = null;

    try {
      context.drawImage(image, 0, 0, width, height);

      // toBlob throws a SecurityError when the camera server does not
      // allow cross-origin access (CORS), so it must be inside try.
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.92);
      });
    } catch (error) {
      console.error("Snapshot failed:", error);

      setCaptureError(
        "Unable to capture the photo. The camera server must allow cross-origin access (CORS)."
      );

      return;
    }

    if (!blob) {
      setCaptureError("Failed to create the photo.");

      return;
    }

    setIsSaving(true);
    setCaptureError(null);

    try {
      const saved = await saveCapture(
        blob,
        width,
        height,
        new Date()
      );

      setSavedPhotos((previous) =>
        [saved, ...previous].slice(0, CAPTURE_LIMIT)
      );
    } catch (error) {
      console.error("Failed to save capture:", error);

      setCaptureError(
        "The photo was captured but could not be saved. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }, [streamState, isSaving, saveCapture]);

  // ============================================================
  // DOWNLOAD / DELETE
  // ============================================================

  const handleDownload = useCallback(
    async (photo: SavedPhoto) => {
      const { data, error } = await supabase.storage
        .from(CAPTURE_BUCKET)
        .createSignedUrl(photo.storagePath, 60, {
          download: photo.filename,
        });

      if (error || !data) {
        console.error("Download failed:", error);

        setCaptureError("Unable to download the photo.");

        return;
      }

      window.location.href = data.signedUrl;
    },
    [supabase]
  );

  const handleDelete = useCallback(
    async (photo: SavedPhoto) => {
      if (
        !window.confirm(
          "Delete this photo permanently? This cannot be undone."
        )
      ) {
        return;
      }

      const { error: storageError } = await supabase.storage
        .from(CAPTURE_BUCKET)
        .remove([photo.storagePath]);

      if (storageError) {
        console.error("Failed to delete file:", storageError);

        setCaptureError("Unable to delete the photo.");

        return;
      }

      const { error: rowError } = await supabase
        .from("camera_captures")
        .delete()
        .eq("id", photo.id);

      if (rowError) {
        console.error("Failed to delete record:", rowError);

        setCaptureError("Unable to delete the photo.");

        return;
      }

      setSavedPhotos((previous) =>
        previous.filter((item) => item.id !== photo.id)
      );
    },
    [supabase]
  );

  const handleQuit = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  // Keyboard shortcuts: C = capture, Q / Esc = quit
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Do not react to Ctrl+C (copy), Cmd+C, or a held-down key.
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.repeat
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;

      if (
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(
          target.tagName
        ) ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "c") {
        void handleSnapshot();
      } else if (key === "q" || event.key === "Escape") {
        handleQuit();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, [handleSnapshot, handleQuit]);

  return (
    <>
      <TopNavbar pageReady />

      <main className="min-h-screen bg-[#030712] px-4 pb-10 pt-6 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Back button */}
          <div className="mb-6">
            <BackToDashboardButton />
          </div>

          {/* ── TOP GRID: LIVE FEED + CAMERA PANEL ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Live feed card */}
            <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#111827] text-lg">
                    📷
                  </span>

                  <div>
                    <h2 className="text-base font-bold uppercase tracking-wide text-white">
                      {CAMERA_INFO.name}
                    </h2>

                    <p className="text-xs text-[#94a3b8]">
                      {CAMERA_INFO.model}
                    </p>
                  </div>
                </div>

                <StatusBadge state={streamState} />
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#1f2937] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={streamSrc}
                  alt="Live camera feed"
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover"
                  onLoad={handleStreamLoad}
                  onError={handleStreamError}
                />

                {streamState !== "live" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-4 text-center">
                    {streamState === "connecting" ? (
                      <p className="text-sm text-[#cbd5e1]">
                        Connecting to the camera...
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#fca5a5]">
                          Camera feed unavailable
                        </p>

                        <p className="max-w-sm text-xs text-[#94a3b8]">
                          Check that the Raspberry Pi is
                          powered on, the camera server is
                          running, and you are on the same
                          network.
                        </p>

                        <button
                          type="button"
                          onClick={handleRetry}
                          className="rounded-lg bg-[#22c55e] px-4 py-2 text-xs font-bold text-[#052e16] transition hover:bg-[#4ade80]"
                        >
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {captureError && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg border border-red-900 bg-red-950/60 px-3 py-2 text-xs text-[#fca5a5]"
                >
                  {captureError}
                </p>
              )}

              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>

            {/* Right column: camera card + controls */}
            <div className="flex flex-col gap-4">
              {/* Camera 1 card */}
              <div className="rounded-2xl border border-[#166534] bg-[#052e16]/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#166534] bg-[#052e16] text-lg">
                      📷
                    </span>

                    <div>
                      <p className="text-sm font-bold text-white">
                        Camera 1
                      </p>

                      <p className="text-xs text-[#86efac]/80">
                        {CAMERA_INFO.name} (
                        {CAMERA_INFO.shortModel})
                      </p>
                    </div>
                  </div>

                  <StatusBadge state={streamState} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <StatBox
                    label="Resolution"
                    value={streamResolution ?? "—"}
                    icon="📐"
                  />

                  <StatBox
                    label="Status"
                    value={
                      streamState === "live"
                        ? "Live"
                        : streamState === "connecting"
                          ? "Connecting"
                          : "Offline"
                    }
                    icon="📡"
                  />

                  <StatBox
                    label="Camera"
                    value={CAMERA_INFO.shortModel}
                    icon="🔧"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleSnapshot()}
                  disabled={
                    streamState !== "live" || isSaving
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-4 py-3 text-sm font-bold text-[#052e16] transition hover:bg-[#4ade80] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>📷</span>
                  {isSaving ? "Saving..." : "Capture Photo"}
                </button>
              </div>

              {/* Controls card */}
              <div className="rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
                <p className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
                  Controls
                </p>

                <div className="flex flex-wrap gap-4">
                  <KeyHint
                    keyLabel="C"
                    description="Capture Photo"
                  />

                  <KeyHint
                    keyLabel="Q"
                    description="Back to Dashboard"
                  />

                  <KeyHint
                    keyLabel="ESC"
                    description="Back to Dashboard"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── SAVED PHOTOS ── */}
          <div className="mt-4 rounded-2xl border border-[#1f2937] bg-[#0b1220] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🖼️</span>

                <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                  Captured Photos
                </h3>
              </div>

              {!isLoadingPhotos && (
                <span className="text-xs text-[#94a3b8]">
                  {savedPhotos.length} saved
                </span>
              )}
            </div>

            {isLoadingPhotos ? (
              <p className="py-6 text-center text-xs text-[#64748b]">
                Loading your saved photos...
              </p>
            ) : savedPhotos.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#64748b]">
                No photos saved yet. Press{" "}
                <span className="font-semibold text-[#cbd5e1]">
                  C
                </span>{" "}
                or the Capture Photo button.
              </p>
            ) : (
              <>
                <p className="mb-3 text-[11px] text-[#64748b]">
                  Photos are saved to your account. Only you
                  can see them. The newest {CAPTURE_LIMIT} are
                  shown.
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {savedPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-xl border border-[#1f2937] bg-black"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={`Captured ${photo.timestamp}`}
                        className="aspect-video w-full object-cover"
                      />

                      <div className="bg-[#0b1220] px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">
                            📷
                          </span>

                          <span className="truncate text-[11px] text-[#94a3b8]">
                            {photo.timestamp}
                          </span>
                        </div>

                        <div className="mt-1.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void handleDownload(photo)
                            }
                            className="flex-1 rounded-md border border-[#334155] bg-[#111827] px-2 py-1 text-[11px] font-semibold text-[#cbd5e1] transition hover:border-[#22c55e] hover:text-[#4ade80]"
                          >
                            Download
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(photo)
                            }
                            className="flex-1 rounded-md border border-[#334155] bg-[#111827] px-2 py-1 text-[11px] font-semibold text-[#cbd5e1] transition hover:border-[#f87171] hover:text-[#f87171]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function StatusBadge({ state }: { state: StreamState }) {
  const config = {
    live: {
      label: "Live",
      text: "text-[#4ade80]",
      dot: "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.7)]",
    },
    connecting: {
      label: "Connecting",
      text: "text-[#fbbf24]",
      dot: "bg-[#f59e0b]",
    },
    offline: {
      label: "Offline",
      text: "text-[#f87171]",
      dot: "bg-[#ef4444]",
    },
  }[state];

  return (
    <span
      className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${config.text}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${config.dot}`}
      />
      {config.label}
    </span>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg border border-[#166534]/60 bg-[#031f0d] px-2 py-2">
      <p className="text-sm">{icon}</p>

      <p className="mt-1 text-[10px] uppercase tracking-wide text-[#86efac]/70">
        {label}
      </p>

      <p className="text-xs font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function KeyHint({
  keyLabel,
  description,
}: {
  keyLabel: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 min-w-7 items-center justify-center rounded-md border border-[#334155] bg-[#111827] px-2 text-xs font-bold text-[#cbd5e1]">
        {keyLabel}
      </span>

      <span className="text-xs text-[#94a3b8]">
        {description}
      </span>
    </div>
  );
}
