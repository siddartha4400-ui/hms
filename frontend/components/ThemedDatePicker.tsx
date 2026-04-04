"use client";

import { type FocusEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { formatDateDDMMYYYY, parseFlexibleDateToISO } from "@/lib/date-format";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  yearStart?: number;
  yearEnd?: number;
};

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function pad(v: number) { return String(v).padStart(2, "0"); }
function toDateString(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function parseDate(value?: string): Date | null {
  if (!value) return null;
  const p = new Date(`${value}T00:00:00`);
  return isNaN(p.getTime()) ? null : p;
}

type PopoverPos = { top?: number; bottom?: number; left: number; width: number; openUp: boolean };

export default function ThemedDatePicker({
  value, onChange, placeholder = "DD-MM-YYYY", disabled = false,
  className = "", minDate, maxDate, yearStart, yearEnd,
}: Props) {
  const selectedDate   = useMemo(() => parseDate(value), [value]);
  const minDateValue   = useMemo(() => parseDate(minDate), [minDate]);
  const maxDateValue   = useMemo(() => parseDate(maxDate), [maxDate]);
  const initialDate    = selectedDate || new Date();

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, m) =>
      new Date(2020, m, 1).toLocaleString(undefined, { month: "long" })),
    [],
  );
  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    const start = yearStart ?? minDateValue?.getFullYear() ?? cy - 10;
    const end   = yearEnd   ?? maxDateValue?.getFullYear() ?? cy + 10;
    return Array.from({ length: Math.max(end - start + 1, 1) }, (_, i) => start + i);
  }, [maxDateValue, minDateValue, yearEnd, yearStart]);

  const [open, setOpen]               = useState(false);
  const [viewYear, setViewYear]       = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth]     = useState(initialDate.getMonth());
  const [monthMotion, setMonthMotion] = useState("calendar-grid-jump");
  const [inputValue, setInputValue]   = useState(value || "");
  const [inputError, setInputError]   = useState("");
  const [popPos, setPopPos]           = useState<PopoverPos | null>(null);
  const [isMobile, setIsMobile]       = useState(false);
  const [mounted, setMounted]         = useState(false);

  const rootRef    = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setInputValue(value ? formatDateDDMMYYYY(value) : "");
  }, [value]);

  useEffect(() => {
    if (!selectedDate) return;
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  /* click-outside (desktop) */
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const popover = document.getElementById("tdp-popover");
      if (popover?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isMobile]);

  /* compute popover position (desktop) */
  const computePos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popH = 370;
    const popW = Math.min(300, window.innerWidth - 32);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < popH + 8 && rect.top > popH;
    let left = rect.left;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    const pos: PopoverPos = openUp
      ? { bottom: window.innerHeight - rect.top + 4, left, width: popW, openUp: true }
      : { top: rect.bottom + 4, left, width: popW, openUp: false };
    setPopPos(pos);
  };

  const openCalendar = () => {
    if (disabled) return;
    computePos();
    setOpen(true);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: Array<{ day: number; monthOffset: -1 | 0 | 1 }> = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, monthOffset: -1 });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, monthOffset: 0 });
  while (cells.length < 42) cells.push({ day: cells.length - (firstDay + daysInMonth) + 1, monthOffset: 1 });

  const displayValue = selectedDate ? formatDateDDMMYYYY(value) : "";
  const isOutOfRange = (date: Date) =>
    (minDateValue ? date < minDateValue : false) || (maxDateValue ? date > maxDateValue : false);

  const moveMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setMonthMotion(delta > 0 ? "calendar-grid-next" : "calendar-grid-prev");
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const selectDate = (day: number, offset: -1 | 0 | 1) => {
    const date = new Date(viewYear, viewMonth + offset, day);
    if (isOutOfRange(date)) return;
    const nextValue = toDateString(date.getFullYear(), date.getMonth(), date.getDate());
    onChange(nextValue);
    setInputValue(formatDateDDMMYYYY(nextValue));
    setInputError("");
    setOpen(false);
  };

  const handleTypedInputBlur = (e: FocusEvent<HTMLInputElement>) => {
    const nextFocused = e.relatedTarget as Node | null;
    if (nextFocused && rootRef.current?.contains(nextFocused)) return;
    const parsed = parseFlexibleDateToISO(inputValue);
    if (parsed === null) { setInputError("Use DD-MM-YYYY"); return; }
    const pd = parseDate(parsed);
    if (pd && isOutOfRange(pd)) {
      if (minDateValue && pd < minDateValue) { setInputError(`On or after ${formatDateDDMMYYYY(minDate)}`); return; }
      if (maxDateValue && pd > maxDateValue) { setInputError(`On or before ${formatDateDDMMYYYY(maxDate)}`); return; }
    }
    setInputError("");
    onChange(parsed);
    setInputValue(parsed ? formatDateDDMMYYYY(parsed) : "");
    setOpen(false);
    if (pd) { setViewYear(pd.getFullYear()); setViewMonth(pd.getMonth()); }
  };

  const setToday = () => {
    const today = new Date();
    if (isOutOfRange(today)) return;
    const nextValue = toDateString(today.getFullYear(), today.getMonth(), today.getDate());
    onChange(nextValue);
    setInputValue(formatDateDDMMYYYY(nextValue));
    setInputError("");
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setOpen(false);
  };

  const clearDate = () => { onChange(""); setInputValue(""); setInputError(""); setOpen(false); };

  /* ── Calendar grid body (shared desktop + mobile) ── */
  const calendarBody = (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          className="tdp-nav-btn h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition-all"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 text-center font-700 text-sm" style={{ color: "var(--text-primary)" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </div>

        <button
          type="button"
          onClick={() => moveMonth(1)}
          className="tdp-nav-btn h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition-all"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Month/Year selects row */}
      <div className="flex gap-2 mb-3">
        <select
          value={viewMonth}
          onChange={(e) => { setMonthMotion("calendar-grid-jump"); setViewMonth(Number(e.target.value)); }}
          className="flex-1 h-8 rounded-lg px-2 text-xs outline-none calendar-select"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        >
          {monthOptions.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>
        <select
          value={viewYear}
          onChange={(e) => { setMonthMotion("calendar-grid-jump"); setViewYear(Number(e.target.value)); }}
          className="w-20 h-8 rounded-lg px-2 text-xs outline-none calendar-select"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        >
          {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] py-1 font-600" style={{ color: "var(--text-muted)" }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div key={`${viewYear}-${viewMonth}`} className={`grid grid-cols-7 gap-0.5 calendar-grid ${monthMotion}`}>
        {cells.map((cell, i) => {
          const date = new Date(viewYear, viewMonth + cell.monthOffset, cell.day);
          const cv = toDateString(date.getFullYear(), date.getMonth(), date.getDate());
          const isSelected = value === cv;
          const isDisabled = isOutOfRange(date);
          const isToday = cv === toDateString(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

          return (
            <button
              key={`${cell.monthOffset}-${cell.day}-${i}`}
              type="button"
              onClick={() => selectDate(cell.day, cell.monthOffset)}
              disabled={isDisabled}
              className={`aspect-square w-full rounded-xl text-xs leading-none flex items-center justify-center calendar-day-btn ${isSelected ? "calendar-day-selected" : ""}`.trim()}
              style={{
                color: isDisabled ? "var(--text-muted)" : isSelected ? "#fff" : cell.monthOffset === 0 ? "var(--text-primary)" : "var(--text-muted)",
                background: isSelected
                  ? "linear-gradient(135deg, var(--brand), var(--action))"
                  : isToday
                  ? "var(--brand-dim)"
                  : "transparent",
                border: isSelected
                  ? "none"
                  : isToday
                  ? "1px solid var(--brand-border)"
                  : "1px solid transparent",
                opacity: isDisabled ? 0.3 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
                fontWeight: isSelected ? 700 : isToday ? 600 : 400,
              }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
        <button
          type="button" onClick={setToday}
          className="flex-1 text-xs font-600 py-2 rounded-xl transition-all"
          style={{ background: "var(--brand-dim)", color: "var(--brand-light)", border: "1px solid var(--brand-border)" }}
        >
          Today
        </button>
        <button
          type="button" onClick={clearDate}
          className="flex-1 text-xs font-600 py-2 rounded-xl transition-all"
          style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
        >
          Clear
        </button>
      </div>
    </>
  );

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        className="relative h-16 rounded-2xl border calendar-input-wrap"
        style={{
          background: "var(--bg-input)",
          borderColor: inputError ? "var(--danger)" : open ? "rgba(6,182,212,0.50)" : "var(--border)",
          boxShadow: open ? "0 0 0 3px rgba(6,182,212,0.12)" : "none",
        }}
      >
        <input
          type="text"
          value={inputValue || displayValue}
          disabled={disabled}
          onFocus={openCalendar}
          onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
          onBlur={handleTypedInputBlur}
          placeholder={placeholder}
          className="w-full h-full pl-4 pr-12 rounded-2xl outline-none text-sm"
          style={{ background: "transparent", color: "var(--text-primary)" }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openCalendar())}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center calendar-toggle-btn"
          style={{ color: open ? "var(--brand)" : "var(--text-secondary)" }}
          aria-label="Toggle calendar"
        >
          {open ? <FiX className="w-3.5 h-3.5" /> : <FiCalendar className="w-3.5 h-3.5" />}
        </button>
      </div>

      {inputError ? (
        <p className="text-[11px] mt-1 px-1" style={{ color: "var(--danger)" }}>{inputError}</p>
      ) : null}

      {/* ── Desktop popover (portal, fixed) ── */}
      {open && !disabled && !isMobile && mounted && popPos
        ? createPortal(
            <div
              id="tdp-popover"
              className="calendar-popover"
              style={{
                position: "fixed",
                top:    popPos.top,
                bottom: popPos.bottom,
                left:   popPos.left,
                width:  popPos.width,
                zIndex: 9999,
                background: "var(--bg-surface)",
                border: "1px solid rgba(6,182,212,0.20)",
                borderRadius: "1.25rem",
                padding: "1rem",
                boxShadow: "0 24px 80px -16px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06) inset",
                transformOrigin: popPos.openUp ? "bottom center" : "top center",
              }}
            >
              {calendarBody}
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
                className="tdp-backdrop"
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
                className="tdp-sheet"
                style={{
                  position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
                  background: "var(--bg-surface)",
                  borderTop: "1px solid rgba(6,182,212,0.20)",
                  borderRadius: "1.5rem 1.5rem 0 0",
                  padding: "1.25rem 1.25rem 2rem",
                  boxShadow: "0 -20px 60px -12px rgba(0,0,0,0.6)",
                  animation: "sheetUp 0.32s cubic-bezier(0.16,1,0.3,1) both",
                }}
              >
                {/* Handle */}
                <div className="flex justify-center mb-4">
                  <div style={{ width: "3rem", height: "0.3rem", borderRadius: "9999px", background: "var(--border-strong)" }} />
                </div>
                <p className="text-sm font-700 mb-4 text-center" style={{ color: "var(--text-primary)" }}>
                  Select Date
                </p>
                {calendarBody}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
