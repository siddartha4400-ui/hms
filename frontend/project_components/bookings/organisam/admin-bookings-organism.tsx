"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";

import BookingListView, { BookingListItem } from "../molecule/booking-list-view";
import {
  APPROVE_BOOKING_MUTATION,
  CANCEL_BOOKING_MUTATION,
  CHECK_IN_BOOKING_MUTATION,
  COMPLETE_BOOKING_MUTATION,
  LIST_BOOKINGS_QUERY,
  REJECT_BOOKING_MUTATION,
} from "../graphql/operations";
import { getUserHmsId } from "@/lib/auth-token";
import { GET_USER_PROFILE_QUERY } from "@/project_components/common-routes/graphql/operations";

type ViewType = "pending" | "today" | "ongoing" | "upcoming" | "relieved" | "cancelled";

type BookingResponse = {
  listBookings: BookingListItem[];
};

type ProfileResponse = {
  getUserProfile?: {
    companyId?: string | null;
  };
};

const TABS: Array<{ key: ViewType; label: string }> = [
  { key: "pending", label: "Pending Requests" },
  { key: "today", label: "Today's Check-ins" },
  { key: "ongoing", label: "In-House Guests" },
  { key: "upcoming", label: "Upcoming Bookings" },
  { key: "relieved", label: "Relieved / Completed" },
  { key: "cancelled", label: "Cancelled / Rejected" },
];

export default function AdminBookingsOrganism() {
  const [activeTab, setActiveTab] = useState<ViewType>("pending");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const storedHmsId = getUserHmsId();
  const { data: profileData } = useQuery<ProfileResponse>(GET_USER_PROFILE_QUERY, {
    fetchPolicy: "cache-first",
  });
  const profileCompanyId = useMemo(() => {
    const raw = profileData?.getUserProfile?.companyId;
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [profileData]);
  const hmsId = storedHmsId ?? profileCompanyId;
  const { data, loading, error: listError, refetch } = useQuery<BookingResponse>(LIST_BOOKINGS_QUERY, {
    variables: { view: activeTab, mine: false, ...(hmsId ? { hmsId } : {}) },
    fetchPolicy: "network-only",
  });
  const [approveBooking, { loading: approving }] = useMutation(APPROVE_BOOKING_MUTATION);
  const [rejectBooking, { loading: rejecting }] = useMutation(REJECT_BOOKING_MUTATION);
  const [cancelBooking, { loading: cancelling }] = useMutation(CANCEL_BOOKING_MUTATION);
  const [completeBooking, { loading: relieving }] = useMutation(COMPLETE_BOOKING_MUTATION);
  const [checkInBooking, { loading: checkingIn }] = useMutation(CHECK_IN_BOOKING_MUTATION);

  const bookings = useMemo(() => data?.listBookings || [], [data]);

  async function handleApprove(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await approveBooking({ variables: { bookingReference, ...(hmsId ? { hmsId } : {}) } });
    const payload = response.data?.approveBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to approve booking request.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Booking approved.");
    await refetch();
  }

  async function handleReject(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await rejectBooking({ variables: { bookingReference, ...(hmsId ? { hmsId } : {}) } });
    const payload = response.data?.rejectBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to reject booking request.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Booking rejected.");
    await refetch();
  }

  async function handleCancel(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await cancelBooking({ variables: { bookingReference, ...(hmsId ? { hmsId } : {}) } });
    const payload = response.data?.cancelBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to cancel booking.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Booking cancelled.");
    await refetch();
  }

  async function handleRelieve(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await completeBooking({ variables: { bookingReference, ...(hmsId ? { hmsId } : {}) } });
    const payload = response.data?.completeBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to relieve booking.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Guest relieved and booking completed.");
    await refetch();
  }

  async function handleCheckIn(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await checkInBooking({ variables: { bookingReference, ...(hmsId ? { hmsId } : {}) } });
    const payload = response.data?.checkInBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to check in guest.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Guest checked in successfully.");
    await refetch();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {listError ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{listError.message}</div> : null}
      {message ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
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
          emptyMessage={
            activeTab === "pending"
              ? "No booking requests are waiting for approval."
              : activeTab === "today"
                ? "No check-ins scheduled for today."
                : activeTab === "ongoing"
                  ? "No guests are currently in-house."
                  : activeTab === "upcoming"
                    ? "No upcoming confirmed bookings."
                    : activeTab === "relieved"
                      ? "No relieved/completed bookings found."
                      : "No cancelled or rejected bookings found."
          }
          actionSlot={
            activeTab === "pending"
              ? (booking) => (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(booking.bookingReference)}
                      disabled={approving || rejecting || cancelling || relieving}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(booking.bookingReference)}
                      disabled={approving || rejecting || cancelling || relieving}
                      className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )
              : activeTab === "today"
                ? (booking) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCheckIn(booking.bookingReference)}
                        disabled={approving || rejecting || cancelling || relieving || checkingIn}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                      >
                        Check In
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(booking.bookingReference)}
                        disabled={approving || rejecting || cancelling || relieving || checkingIn}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                : activeTab === "ongoing"
                ? (booking) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRelieve(booking.bookingReference)}
                        disabled={approving || rejecting || cancelling || relieving || checkingIn}
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                      >
                        Relieve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(booking.bookingReference)}
                        disabled={approving || rejecting || cancelling || relieving || checkingIn}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                : activeTab === "upcoming"
                  ? (booking) => (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCancel(booking.bookingReference)}
                          disabled={approving || rejecting || cancelling || relieving || checkingIn}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    )
                  : undefined
          }
        />
      )}
    </div>
  );
}