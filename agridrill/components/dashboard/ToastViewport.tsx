"use client";

import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import { useToast } from "@/hooks/useToast";
import { type ToastVariant } from "@/types/dashboard";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-slate-200 bg-white text-slate-800",
};

const VARIANT_ICONS: Record<ToastVariant, typeof FiInfo> = {
  success: FiCheckCircle,
  error: FiAlertTriangle,
  info: FiInfo,
};

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const Icon = VARIANT_ICONS[toast.variant];
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur transition-all animate-in fade-in slide-in-from-bottom-2 ${VARIANT_STYLES[toast.variant]}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? <p className="mt-0.5 text-xs opacity-80">{toast.description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-full p-1 text-current opacity-60 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
              aria-label="Dismiss notification"
            >
              <FiX className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
