"use client";

import React from "react";
import { FiChevronDown } from "react-icons/fi";

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

export default function ThemedSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  leftIcon,
  ariaLabel,
}: Props) {
  const controlStyle = {
    borderColor: "var(--border)",
    background: disabled ? "var(--bg-elevated)" : "var(--bg-input)",
    color: disabled ? "var(--text-muted)" : "var(--text-primary)",
  };

  const optionStyle = {
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    padding: "4px 8px",
  };

  return (
    <div className={`themed-select-shell relative ${className}`.trim()}>
      {leftIcon ? (
        <span
          className="themed-select-left-icon pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2"
          style={{ color: disabled ? "var(--text-muted)" : "var(--text-secondary)" }}
        >
          {leftIcon}
        </span>
      ) : null}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel || placeholder || "Select"}
        className={`simple-select-control mobile-select-control h-12 w-full rounded-xl border text-left text-sm leading-tight outline-none transition disabled:cursor-not-allowed focus:border-[var(--brand-border)] focus:ring-2 focus:ring-[var(--brand-dim)] focus:ring-offset-0 ${leftIcon ? "pl-10" : "pl-3"}`}
        style={controlStyle}
      >
        {placeholder ? <option value="" style={optionStyle}>{placeholder}</option> : null}
        {options.map((option) => (
          <option key={`${option.value}`} value={option.value} style={optionStyle}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        className="themed-select-chevron pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: disabled ? "var(--text-muted)" : "var(--text-secondary)" }}
      >
        <FiChevronDown className="h-4 w-4" />
      </span>
    </div>
  );
}