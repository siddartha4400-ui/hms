"use client";

import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

type PopupVariant = "success" | "error" | "info";

type PopupToastProps = {
  message?: string;
  variant?: PopupVariant;
  duration?: number;
  onClose?: () => void;
};

const VARIANT_STYLES: Record<PopupVariant, { border: string; icon: React.ReactNode }> = {
  success: {
    border: "var(--positive)",
    icon: <FiCheckCircle className="w-5 h-5" style={{ color: "var(--positive)" }} />,
  },
  error: {
    border: "var(--danger)",
    icon: <FiAlertCircle className="w-5 h-5" style={{ color: "var(--danger)" }} />,
  },
  info: {
    border: "var(--brand)",
    icon: <FiInfo className="w-5 h-5" style={{ color: "var(--brand)" }} />,
  },
};

export default function PopupToast({
  message,
  variant = "info",
  duration = 3000,
  onClose,
}: PopupToastProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [message]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDismissed(true);
      onClose?.();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message, duration, onClose]);

  if (!message || dismissed) {
    return null;
  }

  const selected = VARIANT_STYLES[variant];

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[1200] w-[92vw] max-w-lg animate-fade-in-up">
      <div
        className="rounded-xl border backdrop-blur-md shadow-2xl px-4 py-3 flex items-start gap-3"
        style={{
          background: "var(--bg-navbar)",
          borderColor: "var(--border)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
          borderLeftWidth: "4px",
          borderLeftColor: selected.border,
        }}
      >
        <div className="shrink-0 mt-0.5">{selected.icon}</div>
        <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-primary)" }}>
          {message}
        </p>
        <button
          type="button"
          aria-label="Close notification"
          onClick={() => {
            setDismissed(true);
            onClose?.();
          }}
          className="shrink-0 rounded-md p-1 transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}