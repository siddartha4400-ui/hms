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
      <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    ) : null;
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="overflow-hidden rounded-xl border border-black/5 bg-white shadow-[0_8px_24px_-20px_rgba(15,23,42,0.4)] transition hover:border-black/10 hover:shadow-[0_12px_28px_-20px_rgba(15,23,42,0.45)]">
            <button
              type="button"
              onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">{item.title}</div>
                {item.subtitle ? <div className="mt-0.5 text-xs text-slate-500">{item.subtitle}</div> : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.badge}
                <FiChevronDown className={`h-4 w-4 text-slate-500 transition duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>
            {isOpen ? <div className="border-t border-black/5 px-4 py-3">{item.content}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
