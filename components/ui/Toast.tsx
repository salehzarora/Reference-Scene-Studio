"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, opts?: { variant?: ToastVariant; duration?: number }) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // Safe fallback if used outside provider.
    return {
      toast: (message: string) => {
        if (typeof window !== "undefined") console.log("[toast]", message);
      },
    } as ToastContextValue;
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    (message, opts) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : "t-" + Date.now() + "-" + Math.random();
      const item: Toast = {
        id,
        message,
        variant: opts?.variant ?? "info",
        duration: opts?.duration ?? 4000,
      };
      setToasts((prev) => [...prev, item]);
      window.setTimeout(() => dismiss(id), item.duration);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon =
    toast.variant === "success"
      ? CheckCircle2
      : toast.variant === "error"
        ? AlertCircle
        : Info;
  const tone =
    toast.variant === "success"
      ? "text-success"
      : toast.variant === "error"
        ? "text-danger"
        : "text-accent";

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto animate-slide-in",
        "flex items-start gap-3 rounded-lg border border-border bg-bg-elevated/95 backdrop-blur shadow-soft",
        "px-4 py-3 text-sm text-text-primary",
      )}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", tone)} />
      <div className="flex-1 leading-snug">{toast.message}</div>
      <button
        onClick={onDismiss}
        className="text-text-muted hover:text-text-primary transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
