"use client";

import { type FocusEvent, useEffect, useMemo, useRef, useState } from "react";
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

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

export default function ThemedDatePicker({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  disabled = false,
  className = "",
  minDate,
  maxDate,
  yearStart,
  yearEnd,
}: Props) {
  const selectedDate = useMemo(() => parseDate(value), [value]);
  const minDateValue = useMemo(() => parseDate(minDate), [minDate]);
  const maxDateValue = useMemo(() => parseDate(maxDate), [maxDate]);
  const initialDate = selectedDate || new Date();
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, m) => new Date(2020, m, 1).toLocaleString(undefined, { month: "long" })),
    [],
  );
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = yearStart ?? minDateValue?.getFullYear() ?? currentYear - 10;
    const end = yearEnd ?? maxDateValue?.getFullYear() ?? currentYear + 10;
    return Array.from({ length: Math.max(end - start + 1, 1) }, (_, i) => start + i);
  }, [maxDateValue, minDateValue, yearEnd, yearStart]);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [monthMotionClass, setMonthMotionClass] = useState("calendar-grid-jump");
  const [inputValue, setInputValue] = useState(value || "");
  const [inputError, setInputError] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setInputValue(value ? formatDateDDMMYYYY(value) : "");
  }, [value]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: Array<{ day: number; monthOffset: -1 | 0 | 1 }> = [];

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    cells.push({ day: daysInPrevMonth - i, monthOffset: -1 });
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ day: d, monthOffset: 0 });
  }

  while (cells.length < 42) {
    cells.push({ day: cells.length - (firstDay + daysInMonth) + 1, monthOffset: 1 });
  }

  const displayValue = selectedDate ? formatDateDDMMYYYY(value) : "";

  const isOutOfRange = (date: Date) => {
    if (minDateValue && date < minDateValue) {
      return true;
    }
    if (maxDateValue && date > maxDateValue) {
      return true;
    }
    return false;
  };

  const moveMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setMonthMotionClass(delta > 0 ? "calendar-grid-next" : "calendar-grid-prev");
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handleMonthSelect = (month: number) => {
    setMonthMotionClass("calendar-grid-jump");
    setViewMonth(month);
  };

  const handleYearSelect = (year: number) => {
    setMonthMotionClass("calendar-grid-jump");
    setViewYear(year);
  };

  const selectDate = (day: number, offset: -1 | 0 | 1) => {
    const date = new Date(viewYear, viewMonth + offset, day);
    if (isOutOfRange(date)) {
      return;
    }
    const nextValue = toDateString(date.getFullYear(), date.getMonth(), date.getDate());
    onChange(nextValue);
    setInputValue(formatDateDDMMYYYY(nextValue));
    setInputError("");
    setOpen(false);
  };

  const handleTypedInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const nextFocused = event.relatedTarget as Node | null;
    if (nextFocused && rootRef.current?.contains(nextFocused)) {
      return;
    }

    const parsed = parseFlexibleDateToISO(inputValue);

    if (parsed === null) {
      setInputError("Use DD-MM-YYYY or DD/MM/YYYY");
      return;
    }

    const parsedDate = parseDate(parsed);
    if (parsedDate && isOutOfRange(parsedDate)) {
      if (minDateValue && parsedDate < minDateValue) {
        setInputError(`Date must be on or after ${formatDateDDMMYYYY(minDate)}`);
        return;
      }
      if (maxDateValue && parsedDate > maxDateValue) {
        setInputError(`Date must be on or before ${formatDateDDMMYYYY(maxDate)}`);
        return;
      }
    }

    setInputError("");
    onChange(parsed);
    setInputValue(parsed ? formatDateDDMMYYYY(parsed) : "");
    setOpen(false);

    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
    }
  };

  const setToday = () => {
    const today = new Date();
    if (isOutOfRange(today)) {
      return;
    }
    const nextValue = toDateString(today.getFullYear(), today.getMonth(), today.getDate());
    onChange(nextValue);
    setInputValue(formatDateDDMMYYYY(nextValue));
    setInputError("");
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setOpen(false);
  };

  const clearDate = () => {
    onChange("");
    setInputValue("");
    setInputError("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <div
        className="relative h-12 rounded-lg border calendar-input-wrap"
        style={{
          background: "var(--bg-input)",
          borderColor: inputError ? "var(--danger)" : "var(--border)",
        }}
      >
        <span className="absolute inset-y-0 left-0 w-12 flex items-center justify-center calendar-left-icon pointer-events-none" style={{ color: "var(--text-secondary)" }}>
          <FiCalendar className="w-[18px] h-[18px]" />
        </span>

        <input
          type="text"
          value={inputValue || displayValue}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setInputError("");
          }}
          onBlur={handleTypedInputBlur}
          placeholder={placeholder}
          className="w-full h-full pl-16 pr-12 rounded-lg outline-none"
          style={{
            background: "transparent",
            color: "var(--text-primary)",
          }}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center calendar-toggle-btn"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Toggle calendar"
        >
          {open ? <FiX className="w-4 h-4" /> : <FiCalendar className="w-4 h-4" />}
        </button>
      </div>

      {inputError ? (
        <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>
          {inputError}
        </p>
      ) : null}

      {open && !disabled ? (
        <div
          className="absolute z-[80] mt-2 w-full min-w-[280px] rounded-xl border p-3 shadow-2xl calendar-popover sm:min-w-[320px]"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
          }}
        >
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center calendar-controls-row">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="h-9 w-full rounded-md flex items-center justify-center sm:h-8 sm:w-8"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={viewMonth}
              onChange={(e) => handleMonthSelect(Number(e.target.value))}
              className="h-9 rounded-md px-2 text-xs outline-none calendar-select sm:h-8"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              {monthOptions.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={viewYear}
              onChange={(e) => handleYearSelect(Number(e.target.value))}
              className="h-9 rounded-md px-2 text-xs outline-none calendar-select sm:h-8"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="h-9 w-full rounded-md flex items-center justify-center sm:h-8 sm:w-8"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="text-center text-xs py-1" style={{ color: "var(--text-muted)" }}>
                {day}
              </div>
            ))}
          </div>

          <div key={`${viewYear}-${viewMonth}`} className={`grid grid-cols-7 gap-1 calendar-grid ${monthMotionClass}`.trim()}>
            {cells.map((cell, index) => {
              const date = new Date(viewYear, viewMonth + cell.monthOffset, cell.day);
              const currentValue = toDateString(date.getFullYear(), date.getMonth(), date.getDate());
              const isSelected = value === currentValue;
              const isDisabled = isOutOfRange(date);

              return (
                <button
                  key={`${cell.monthOffset}-${cell.day}-${index}`}
                  type="button"
                  onClick={() => selectDate(cell.day, cell.monthOffset)}
                  disabled={isDisabled}
                  className={`h-8 rounded-md text-xs calendar-day-btn ${isSelected ? "calendar-day-selected" : ""}`.trim()}
                  style={{
                    color:
                      isDisabled
                        ? "var(--text-muted)"
                        :
                      cell.monthOffset === 0
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    background: isSelected ? "var(--brand-dim)" : "transparent",
                    border: isSelected ? "1px solid var(--brand-border)" : "1px solid transparent",
                    opacity: isDisabled ? 0.35 : 1,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={setToday}
              className="text-xs font-medium px-2.5 py-1.5 rounded-md"
              style={{ background: "var(--brand-dim)", color: "var(--brand-light)", border: "1px solid var(--brand-border)" }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={clearDate}
              className="text-xs font-medium px-2.5 py-1.5 rounded-md"
              style={{ background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}