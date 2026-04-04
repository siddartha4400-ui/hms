"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { FiBookOpen, FiCalendar, FiCheckCircle, FiClock, FiRefreshCw, FiSlash, FiXCircle } from "react-icons/fi";

import BookingListView, { BookingListItem } from "../molecule/booking-list-view";
import { LIST_BOOKINGS_QUERY } from "../graphql/operations";
import { LIST_HMS_QUERY } from "@/project_components/subsites/graphql/operations";

type ViewType = "pending" | "today" | "ongoing" | "upcoming" | "cancelled" | "old";

type BookingResponse = {
  listBookings: BookingListItem[];
};

type HmsItem = {
  id: number;
  hmsName?: string | null;
};

type HmsListResponse = {
  subsiteBaseDomain?: string | null;
  listHms: HmsItem[];
};

function resolveHostSubsiteKey(hostName: string, baseDomain: string): string | null {
  const host = (hostName || "").trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  if (baseDomain && host.endsWith(`.${baseDomain}`)) {
    const leftPart = host.slice(0, -(`.${baseDomain}`).length);
    const candidate = leftPart.split(".")[0]?.trim().toLowerCase();
    if (!candidate || candidate === "www" || candidate === "backend") return null;
    return candidate;
  }
  const parts = host.split(".").filter(Boolean);
  if (parts.length >= 3) {
    const candidate = parts[0]?.trim().toLowerCase();
    if (!candidate || candidate === "www" || candidate === "backend") return null;
    return candidate;
  }
  return null;
}

const TABS: Array<{ key: ViewType; label: string; icon: React.ReactNode }> = [
  { key: "pending",   label: "Pending",    icon: <FiClock className="h-3.5 w-3.5" /> },
  { key: "today",     label: "Today",      icon: <FiCalendar className="h-3.5 w-3.5" /> },
  { key: "ongoing",   label: "Ongoing",    icon: <FiCheckCircle className="h-3.5 w-3.5" /> },
  { key: "upcoming",  label: "Upcoming",   icon: <FiBookOpen className="h-3.5 w-3.5" /> },
  { key: "cancelled", label: "Cancelled",  icon: <FiXCircle className="h-3.5 w-3.5" /> },
  { key: "old",       label: "Old",        icon: <FiSlash className="h-3.5 w-3.5" /> },
];

const EMPTY_MESSAGES: Record<ViewType, string> = {
  pending:   "No pending booking requests found.",
  today:     "No bookings are scheduled to start today.",
  ongoing:   "No ongoing bookings right now.",
  upcoming:  "No upcoming bookings found.",
  cancelled: "No cancelled or rejected bookings found.",
  old:       "No old bookings found.",
};

export default function UserBookingsOrganism() {
  const [activeTab, setActiveTab]     = useState<ViewType>("pending");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: hmsData, loading: hmsLoading } = useQuery<HmsListResponse>(LIST_HMS_QUERY, {
    fetchPolicy: "cache-first",
  });

  const hostName          = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const baseDomain        = (hmsData?.subsiteBaseDomain || "").trim().toLowerCase();
  const configuredBase    = (process.env.NEXT_PUBLIC_BASE_DOMAIN || "").trim().toLowerCase();
  const effectiveBase     = (baseDomain || configuredBase).trim().toLowerCase();
  const isMainSiteHost    = effectiveBase
    ? hostName === effectiveBase || hostName === `www.${effectiveBase}`
    : hostName === "localhost" || hostName === "127.0.0.1";
  const hostSubsiteKey    = resolveHostSubsiteKey(hostName, effectiveBase);
  const hostMatchedSubsite = useMemo(
    () => (hmsData?.listHms || []).find((item) => (item.hmsName || "").toLowerCase() === hostSubsiteKey) || null,
    [hmsData, hostSubsiteKey],
  );
  const effectiveHmsId      = isMainSiteHost ? null : (hostMatchedSubsite?.id ?? null);
  const canRunBookingsQuery = isMainSiteHost || Boolean(effectiveHmsId);

  const { data, loading, error, refetch } = useQuery<BookingResponse>(LIST_BOOKINGS_QUERY, {
    skip: !canRunBookingsQuery,
    variables: { view: activeTab, mine: true, ...(effectiveHmsId ? { hmsId: effectiveHmsId } : {}) },
    fetchPolicy: "network-only",
  });

  const bookings = useMemo(() => data?.listBookings || [], [data]);
  const showLoading = (hmsLoading || loading) && !data?.listBookings;
  const scopeError  = !hmsLoading && !isMainSiteHost && !effectiveHmsId
    ? "Unable to resolve subsite context for this host."
    : "";

  async function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try { await refetch(); } finally { setIsRefreshing(false); }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 lg:px-10">

        {/* ── Page header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.24em]"
              style={{ color: "var(--brand)" }}
            >
              User Dashboard
            </p>
            <h1
              className="mt-1.5 text-2xl font-extrabold tracking-tight md:text-3xl"
              style={{ color: "var(--text-primary)" }}
            >
              My Bookings
            </h1>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <FiRefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* ── Error banners ── */}
        {scopeError ? (
          <div
            className="mb-4 rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(239,68,68,0.28)", background: "rgba(239,68,68,0.10)", color: "var(--danger)" }}
          >
            {scopeError}
          </div>
        ) : null}
        {error ? (
          <div
            className="mb-4 rounded-2xl border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(239,68,68,0.28)", background: "rgba(239,68,68,0.10)", color: "var(--danger)" }}
          >
            {error.message}
          </div>
        ) : null}

        {/* ── Scrollable horizontal tab bar ── */}
        <div className="booking-tabs-bar mb-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="booking-tab"
                style={
                  isActive
                    ? {
                        background: "var(--brand)",
                        color: "#fff",
                        borderColor: "transparent",
                        boxShadow: "0 4px 14px -4px rgba(6,182,212,0.5)",
                      }
                    : {
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        borderColor: "var(--border)",
                      }
                }
              >
                <span className="shrink-0">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Booking list ── */}
        {showLoading ? (
          <div
            className="rounded-2xl border p-8 text-center text-sm"
            style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-secondary)" }}
          >
            Loading bookings…
          </div>
        ) : (
          <BookingListView
            bookings={bookings}
            emptyMessage={EMPTY_MESSAGES[activeTab]}
          />
        )}
      </div>
    </div>
  );
}
