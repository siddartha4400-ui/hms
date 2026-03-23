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
};

export default function ThemedSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
}: Props) {
  const controlStyle = {
    borderColor: "var(--border)",
    background: disabled ? "var(--bg-elevated)" : "var(--bg-input)",
    color: disabled ? "var(--text-muted)" : "var(--text-primary)",
  };

  const optionStyle = {
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
  };

  return (
    <div className={`relative ${className}`.trim()}>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border px-4 pr-11 text-sm outline-none transition disabled:cursor-not-allowed"
        style={controlStyle}
      >
        {placeholder ? <option value="" style={optionStyle}>{placeholder}</option> : null}
        {options.map((option) => (
          <option key={`${option.value}`} value={option.value} style={optionStyle}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4" style={{ color: "var(--text-secondary)" }}>
        <FiChevronDown className="h-4 w-4" />
      </span>
    </div>
  );
}