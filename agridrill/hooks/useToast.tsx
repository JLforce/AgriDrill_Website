"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { type ToastMessage, type ToastVariant } from "@/types/dashboard";

interface ToastContextValue {
  readonly toasts: readonly ToastMessage[];
  readonly showToast: (title: string, options?: { description?: string; variant?: ToastVariant }) => void;
  readonly dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue["showToast"]>(
    (title, options) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: ToastMessage = {
        id,
        title,
        description: options?.description,
        variant: options?.variant ?? "info",
      };

      setToasts((current) => [...current, toast]);
      window.setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
