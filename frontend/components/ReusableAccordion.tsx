"use client";

import React from "react";
import { FiChevronDown } from "react-icons/fi";

export type AccordionItem = {
  id: string | number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  content: React.ReactNode;
};

type Props = {
  items: AccordionItem[];
  defaultOpenId?: string | number | null;
  emptyMessage?: string;
};

export default function ReusableAccordion({ items, defaultOpenId = null, emptyMessage }: Props) {
  const [openId, setOpenId] = React.useState<string | number | null>(defaultOpenId);

  React.useEffect(() => {
    if (defaultOpenId !== null) {
      setOpenId(defaultOpenId);
    }
  }, [defaultOpenId]);

  if (!items.length) {
    return emptyMessage ? (
      <div
        className="rounded-2xl border border-dashed p-8 text-center text-sm"
        style={{
          borderColor: "var(--border-strong)",
          background: "var(--bg-elevated)",
          color: "var(--text-secondary)",
        }}
      >
        {emptyMessage}
      </div>
    ) : null;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border transition-all duration-200"
            style={{
              borderColor: isOpen ? "rgba(6,182,212,0.30)" : "var(--border)",
              background: "var(--bg-surface)",
              boxShadow: isOpen
                ? "0 8px 32px -12px rgba(6,182,212,0.18), 0 0 0 1px rgba(6,182,212,0.08) inset"
                : "0 4px 16px -8px rgba(0,0,0,0.15)",
            }}
          >
            <button
              type="button"
              onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors"
              style={{
                background: isOpen ? "rgba(6,182,212,0.04)" : "transparent",
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">{item.title}</div>
                {item.subtitle ? (
                  <div className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {item.subtitle}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.badge}
                <FiChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  style={{ color: isOpen ? "var(--brand)" : "var(--text-muted)" }}
                />
              </div>
            </button>
            {isOpen ? (
              <div
                className="px-4 py-3.5"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
