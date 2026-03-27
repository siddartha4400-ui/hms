"use client";

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

// ─── Theme definitions ────────────────────────────────────────────────────────
export type AppTheme = "dark" | "light" | "sunset";
export const THEME_CHANGED_EVENT = "hs-theme-changed";

export const THEMES: AppTheme[] = ["dark", "light", "sunset"];

export const THEME_META: Record<
  AppTheme,
  { label: string; next: AppTheme; icon: string; tip: string }
> = {
  dark:   { label: "Dark",   next: "light",   icon: "moon",   tip: "Switch to Light theme"  },
  light:  { label: "Light",  next: "sunset",  icon: "sun",    tip: "Switch to Sunset theme" },
  sunset: { label: "Sunset", next: "dark",    icon: "sunset", tip: "Switch to Dark theme"   },
};

const LS_KEY = "hs-theme";

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}

// ─── ThemeToggle Button ───────────────────────────────────────────────────────
export default function ThemeToggle({ compact = false, selectable = false }: { compact?: boolean; selectable?: boolean }) {
  const [theme, setTheme] = useState<AppTheme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem(LS_KEY) as AppTheme) || "dark";
    setTheme(saved);
    applyTheme(saved);
    setMounted(true);
  }, []);

  const handleCycle = () => {
    const next = THEME_META[theme].next;
    setTheme(next);
    localStorage.setItem(LS_KEY, next);
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_CHANGED_EVENT));
  };

  const handleSelect = (next: AppTheme) => {
    setTheme(next);
    localStorage.setItem(LS_KEY, next);
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_CHANGED_EVENT));
  };

  // Prevent flash before mount
  if (!mounted) return <div className="w-9 h-9" />;

  const meta = THEME_META[theme];

  const icons: Record<string, React.ReactNode> = {
    moon:   <FiMoon className="text-sm" />,
    sun:    <FiSun className="text-sm" />,
    sunset: (
      <svg viewBox="0 0 20 20" fill="none" className="w-[14px] h-[14px]" stroke="currentColor" strokeWidth={1.8}>
        <path d="M10 3v1M4.2 5.2l.7.7M15.8 5.2l-.7.7M3 11h1M16 11h1" strokeLinecap="round"/>
        <path d="M6 11a4 4 0 0 1 8 0" />
        <path d="M3 15h14M5 18h10" strokeLinecap="round"/>
      </svg>
    ),
  };

  const themeColors: Record<AppTheme, { bg: string; border: string; color: string }> = {
    dark:   { bg: "rgba(6,182,212,0.10)",   border: "rgba(6,182,212,0.25)",   color: "#06b6d4" },
    light:  { bg: "rgba(2,132,199,0.08)",    border: "rgba(2,132,199,0.25)",   color: "#0284c7" },
    sunset: { bg: "rgba(251,146,60,0.12)",   border: "rgba(251,146,60,0.30)",  color: "#fb923c" },
  };

  const col = themeColors[theme];

  if (selectable) {
    return (
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Theme options">
        {THEMES.map((option) => {
          const isActive = option === theme;
          const optionMeta = THEME_META[option];
          const optionCol = themeColors[option];

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              title={`Use ${optionMeta.label} theme`}
              aria-label={`Use ${optionMeta.label} theme`}
              aria-pressed={isActive}
              className="h-9 rounded-md px-2 text-[11px] font-semibold transition-all duration-200"
              style={{
                background: isActive ? optionCol.bg : "var(--bg-input)",
                border: isActive ? `1px solid ${optionCol.border}` : "1px solid var(--border)",
                color: isActive ? optionCol.color : "var(--text-secondary)",
              }}
            >
              {optionMeta.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (compact) {
    return (
      <button
        id="theme-toggle"
        onClick={handleCycle}
        title={meta.tip}
        aria-label={meta.tip}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
        style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.color }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.2)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ""; }}
      >
        {icons[meta.icon]}
      </button>
    );
  }

  // Full labeled button
  return (
    <button
      id="theme-toggle"
      onClick={handleCycle}
      title={meta.tip}
      aria-label={meta.tip}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-widest font-medium transition-all duration-200"
      style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.color }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ""; }}
    >
      {icons[meta.icon]}
      <span>{meta.label}</span>
    </button>
  );
}
