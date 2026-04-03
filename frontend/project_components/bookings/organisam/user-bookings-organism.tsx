"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";

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
  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  if (baseDomain && host.endsWith(`.${baseDomain}`)) {
    const leftPart = host.slice(0, -(`.${baseDomain}`).length);
    const candidate = leftPart.split(".")[0]?.trim().toLowerCase();
    if (!candidate || candidate === "www" || candidate === "backend") {
      return null;
    }
    return candidate;
  }

  const parts = host.split(".").filter(Boolean);
  if (parts.length >= 3) {
    const candidate = parts[0]?.trim().toLowerCase();
    if (!candidate || candidate === "www" || candidate === "backend") {
      return null;
    }
    return candidate;
  }

  return null;
}

const TABS: Array<{ key: ViewType; label: string }> = [
  { key: "pending", label: "Pending Requests" },
  { key: "today", label: "Today's Bookings" },
  { key: "ongoing", label: "Ongoing Bookings" },
  { key: "upcoming", label: "Upcoming Bookings" },
  { key: "cancelled", label: "Cancelled / Rejected" },
  { key: "old", label: "Old Bookings" },
];

export default function UserBookingsOrganism() {
  const [activeTab, setActiveTab] = useState<ViewType>("pending");
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: hmsData, loading: hmsLoading } = useQuery<HmsListResponse>(LIST_HMS_QUERY, {
    fetchPolicy: "cache-first",
  });

  const hostName = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const baseDomain = (hmsData?.subsiteBaseDomain || "").trim().toLowerCase();
  const configuredBaseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || "").trim().toLowerCase();
  const effectiveBaseDomain = (baseDomain || configuredBaseDomain).trim().toLowerCase();
  const isMainSiteHost = effectiveBaseDomain
    ? hostName === effectiveBaseDomain || hostName === `www.${effectiveBaseDomain}`
    : hostName === "localhost" || hostName === "127.0.0.1";
  const hostSubsiteKey = resolveHostSubsiteKey(hostName, effectiveBaseDomain);
  const hostMatchedSubsite = useMemo(
    () => (hmsData?.listHms || []).find((item) => (item.hmsName || "").toLowerCase() === hostSubsiteKey) || null,
    [hmsData, hostSubsiteKey],
  );
  const effectiveHmsId = isMainSiteHost ? null : (hostMatchedSubsite?.id ?? null);
  const canRunBookingsQuery = isMainSiteHost || Boolean(effectiveHmsId);

  const { data, loading, error, refetch } = useQuery<BookingResponse>(LIST_BOOKINGS_QUERY, {
    skip: !canRunBookingsQuery,
    variables: { view: activeTab, mine: true, ...(effectiveHmsId ? { hmsId: effectiveHmsId } : {}) },
    fetchPolicy: "network-only",
  });

  const bookings = useMemo(() => data?.listBookings || [], [data]);
  const showInitialLoadingState = (hmsLoading || loading) && !data?.listBookings;
  const scopeError = !hmsLoading && !isMainSiteHost && !effectiveHmsId
    ? "Unable to resolve subsite context for this host."
    : "";

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      {scopeError ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{scopeError}</div> : null}
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error.message}</div> : null}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">User Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-100">My Bookings</h1>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="hidden h-10 rounded-full border border-slate-700 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition-colors duration-150 hover:border-slate-500 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-70 md:inline-flex md:items-center md:justify-center"
        >
          <span
            className={`inline-block h-2 w-2 rounded-full bg-slate-300 ${isRefreshing ? "opacity-100" : "opacity-60"}`}
            aria-hidden="true"
          />
          <span className="ml-2">{isRefreshing ? "Refreshing" : "Refresh"}</span>
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <div className="flex w-full items-stretch gap-2 md:hidden">
          <div
            className="relative flex-1"
            onBlur={(event) => {
              const nextFocusTarget = event.relatedTarget as Node | null;
              if (!nextFocusTarget || !event.currentTarget.contains(nextFocusTarget)) {
                setMobileTabsOpen(false);
              }
            }}
          >
            <button
              type="button"
              onClick={() => setMobileTabsOpen((prev) => !prev)}
              className="flex h-full w-full items-center justify-between rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition-colors duration-150 hover:border-slate-500 hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60"
              aria-expanded={mobileTabsOpen}
              aria-haspopup="listbox"
            >
              <span>{TABS.find((tab) => tab.key === activeTab)?.label || "Select"}</span>
              <span className="text-slate-400">▼</span>
            </button>
            {mobileTabsOpen ? (
              <div className="absolute z-10 mt-2 w-full origin-top rounded-3xl border border-slate-700 bg-slate-900 p-1 shadow-lg">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setMobileTabsOpen(false);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-150 ${activeTab === tab.key ? "bg-emerald-700 text-white" : "text-slate-300 hover:bg-slate-800"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center rounded-full border border-slate-700 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition-colors duration-150 hover:border-slate-500 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span
              className={`inline-block h-2 w-2 rounded-full bg-slate-300 ${isRefreshing ? "opacity-100" : "opacity-60"}`}
              aria-hidden="true"
            />
            <span className="ml-2">{isRefreshing ? "Refreshing" : "Refresh"}</span>
          </button>
        </div>

        <div className="hidden flex-wrap gap-2 md:flex">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${activeTab === tab.key ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </div>

      {showInitialLoadingState ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-sm text-slate-300">Loading bookings...</div>
      ) : (
        <BookingListView
          bookings={bookings}
          emptyMessage={
            activeTab === "pending"
              ? "No pending booking requests found."
              : activeTab === "today"
                ? "No bookings are scheduled to start today."
                : activeTab === "ongoing"
                  ? "No ongoing bookings right now."
              : activeTab === "upcoming"
                ? "No upcoming bookings found."
                : activeTab === "cancelled"
                  ? "No cancelled or rejected bookings found."
                  : "No old bookings found."
          }
        />
      )}
    </div>
  );
}