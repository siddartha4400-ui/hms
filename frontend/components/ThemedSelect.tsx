"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronDown, FiX } from "react-icons/fi";

type SelectOption = {
  label: string;
  value: string | number;
};

type Props = {
  value: string | number | "";
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  ariaLabel?: string;
};

type DropPos = { top?: number; bottom?: number; left: number; width: number; openUp: boolean };

export default function ThemedSelect({
  value, onChange, options, placeholder,
  disabled = false, className = "", leftIcon, ariaLabel,
}: Props) {
  const [open, setOpen]         = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted]   = useState(false);
  const [dropPos, setDropPos]   = useState<DropPos | null>(null);

  const rootRef    = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected     = options.find((o) => String(o.value) === String(value));
  const displayLabel = selected?.label ?? placeholder ?? "Select";
  const hasValue     = Boolean(selected);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* click-outside (desktop) */
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const pop = document.getElementById("tsel-popover");
      if (pop?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isMobile]);

  const computePos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popH = options.length * 48 + 32;
    const popW = Math.max(rect.width, 200);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < popH + 8 && rect.top > popH;
    let left = rect.left;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    setDropPos(
      openUp
        ? { bottom: window.innerHeight - rect.top + 4, left, width: popW, openUp: true }
        : { top: rect.bottom + 4, left, width: popW, openUp: false },
    );
  };

  const handleOpen = () => {
    if (disabled) return;
    computePos();
    setOpen(true);
  };

  const handleSelect = (optValue: string | number) => {
    onChange(String(optValue));
    setOpen(false);
  };

  /* ── Option list (shared desktop + mobile) ── */
  const optionList = (
    <div className="p-2 flex flex-col gap-0.5">
      {placeholder ? (
        <button
          type="button"
          onClick={() => handleSelect("")}
          className="themed-select-option w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="flex-1">{placeholder}</span>
        </button>
      ) : null}

      {options.map((opt) => {
        const isSel = String(opt.value) === String(value);
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className="themed-select-option w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm text-left"
            style={{
              color:      isSel ? "var(--brand-light)" : "var(--text-primary)",
              background: isSel ? "rgba(6,182,212,0.12)" : "transparent",
              fontWeight: isSel ? 600 : 400,
              minHeight: "3rem",
            }}
          >
            <span className="flex-1 text-base">{opt.label}</span>
            {isSel ? <FiCheck className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} /> : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={`themed-select-shell relative ${className}`.trim()}
      style={{ userSelect: "none" }}
    >
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label={ariaLabel || placeholder || "Select"}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="themed-select-trigger h-16 w-full flex items-center gap-2.5 rounded-2xl border px-4 text-left outline-none disabled:cursor-not-allowed"
        style={{
          borderColor: open ? "rgba(6,182,212,0.50)" : "var(--border)",
          background:  disabled ? "var(--bg-elevated)" : open ? "rgba(6,182,212,0.06)" : "var(--bg-input)",
          color:       disabled ? "var(--text-muted)" : "var(--text-primary)",
          boxShadow:   open ? "0 0 0 3px rgba(6,182,212,0.12)" : "none",
          transition:  "border-color 180ms ease, background 180ms ease, box-shadow 180ms ease",
        }}
      >
        {leftIcon ? (
          <span className="shrink-0" style={{ color: open ? "var(--brand)" : disabled ? "var(--text-muted)" : "var(--text-secondary)", transition: "color 180ms ease" }}>
            {leftIcon}
          </span>
        ) : null}

        <span
          className="flex-1 min-w-0 truncate text-sm leading-tight"
          style={{ color: hasValue ? "var(--text-primary)" : "var(--text-muted)", fontWeight: hasValue ? 600 : 400 }}
        >
          {displayLabel}
        </span>

        <span
          className="shrink-0"
          style={{ color: open ? "var(--brand)" : "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 300ms ease, color 180ms ease" }}
        >
          <FiChevronDown className="h-4 w-4" />
        </span>
      </button>

      {/* ── Desktop dropdown (portal, fixed) ── */}
      {open && !disabled && !isMobile && mounted && dropPos
        ? createPortal(
            <div
              id="tsel-popover"
              role="listbox"
              style={{
                position:      "fixed",
                top:           dropPos.top,
                bottom:        dropPos.bottom,
                left:          dropPos.left,
                width:         dropPos.width,
                zIndex:        9999,
                background:    "var(--bg-surface)",
                border:        "1px solid rgba(6,182,212,0.22)",
                borderRadius:  "1.25rem",
                boxShadow:     "0 20px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset",
                transformOrigin: dropPos.openUp ? "bottom center" : "top center",
                animation:     "selectDropIn 0.2s cubic-bezier(0.16,1,0.3,1) both",
                overflow:      "hidden",
              }}
            >
              {optionList}
            </div>,
            document.body,
          )
        : null}

      {/* ── Mobile bottom sheet ── */}
      {open && !disabled && isMobile && mounted
        ? createPortal(
            <>
              {/* Backdrop */}
              <div
                onClick={() => setOpen(false)}
                style={{
                  position: "fixed", inset: 0, zIndex: 9998,
                  background: "rgba(0,0,0,0.65)",
                  backdropFilter: "blur(4px)",
                  animation: "backdropIn 0.2s ease both",
                }}
              />
              {/* Sheet */}
              <div
                style={{
                  position:     "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
                  background:   "var(--bg-surface)",
                  borderTop:    "1px solid rgba(6,182,212,0.20)",
                  borderRadius: "1.5rem 1.5rem 0 0",
                  paddingBottom: "env(safe-area-inset-bottom, 1.5rem)",
                  boxShadow:    "0 -20px 60px -12px rgba(0,0,0,0.6)",
                  animation:    "sheetUp 0.32s cubic-bezier(0.16,1,0.3,1) both",
                }}
              >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div style={{ width: "3rem", height: "0.3rem", borderRadius: "9999px", background: "var(--border-strong)" }} />
                </div>

                {/* Sheet header */}
                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-base font-700" style={{ color: "var(--text-primary)" }}>
                    {ariaLabel || placeholder || "Select"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-9 w-9 rounded-full flex items-center justify-center"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>

                {/* Options - larger touch targets on mobile */}
                <div className="px-3 pb-4 flex flex-col gap-1">
                  {options.map((opt) => {
                    const isSel = String(opt.value) === String(value);
                    return (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                        style={{
                          color:      isSel ? "var(--brand-light)" : "var(--text-primary)",
                          background: isSel ? "rgba(6,182,212,0.12)" : "var(--bg-elevated)",
                          border:     `1px solid ${isSel ? "rgba(6,182,212,0.30)" : "transparent"}`,
                          fontWeight: isSel ? 600 : 400,
                          minHeight: "3.5rem",
                        }}
                      >
                        {leftIcon && (
                          <span style={{ color: isSel ? "var(--brand)" : "var(--text-secondary)" }}>
                            {leftIcon}
                          </span>
                        )}
                        <span className="flex-1 text-base">{opt.label}</span>
                        {isSel ? (
                          <span className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}>
                            <FiCheck className="h-3.5 w-3.5 text-white" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
