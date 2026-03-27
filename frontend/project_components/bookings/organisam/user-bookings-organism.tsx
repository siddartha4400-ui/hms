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
  const { data: hmsData, loading: hmsLoading } = useQuery<HmsListResponse>(LIST_HMS_QUERY, {
    fetchPolicy: "cache-first",
  });

  const hostName = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const baseDomain = (hmsData?.subsiteBaseDomain || "").trim().toLowerCase();
  const isMainSiteHost = baseDomain
    ? hostName === baseDomain || hostName === `www.${baseDomain}`
    : hostName === "hms.local" || hostName === "www.hms.local";
  const hostSubsiteKey = resolveHostSubsiteKey(hostName, baseDomain);
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
  const scopeError = !hmsLoading && !isMainSiteHost && !effectiveHmsId
    ? "Unable to resolve subsite context for this host."
    : "";

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
          onClick={() => refetch()}
          className="h-10 rounded-xl border border-slate-700 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${activeTab === tab.key ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {hmsLoading || loading ? (
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