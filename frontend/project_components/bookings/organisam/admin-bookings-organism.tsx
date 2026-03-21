"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";

import BookingListView, { BookingListItem } from "../molecule/booking-list-view";
import { LIST_BOOKINGS_QUERY } from "../graphql/operations";

type ViewType = "today" | "ongoing";

type BookingResponse = {
  listBookings: BookingListItem[];
};

const TABS: Array<{ key: ViewType; label: string }> = [
  { key: "today", label: "Today's Bookings" },
  { key: "ongoing", label: "Ongoing Bookings" },
];

export default function AdminBookingsOrganism() {
  const [activeTab, setActiveTab] = useState<ViewType>("today");
  const { data, loading, refetch } = useQuery<BookingResponse>(LIST_BOOKINGS_QUERY, {
    variables: { view: activeTab, mine: false },
    fetchPolicy: "network-only",
  });

  const bookings = useMemo(() => data?.listBookings || [], [data]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin Side Booking</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-100">Bookings Console</h1>
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

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-sm text-slate-300">Loading bookings...</div>
      ) : (
        <BookingListView
          bookings={bookings}
          emptyMessage={activeTab === "today" ? "No bookings are scheduled to start today." : "No ongoing bookings right now."}
        />
      )}
    </div>
  );
}