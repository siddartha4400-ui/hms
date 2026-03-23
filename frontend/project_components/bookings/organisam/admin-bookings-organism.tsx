"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiSlash,
  FiTrendingUp,
  FiUserCheck,
  FiXCircle,
} from "react-icons/fi";

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

type ViewType = "pending" | "today" | "noshow" | "ongoing" | "overstay" | "upcoming" | "relieved" | "cancelled";

type BookingResponse = {
  listBookings: BookingListItem[];
};

type ProfileResponse = {
  getUserProfile?: {
    companyId?: string | null;
  };
};

const TABS: Array<{ key: ViewType; label: string; icon: React.ReactNode }> = [
  { key: "pending", label: "Pending Requests", icon: <FiClock className="h-4 w-4" /> },
  { key: "today", label: "Today's Check-ins", icon: <FiCalendar className="h-4 w-4" /> },
  { key: "noshow", label: "No Shows", icon: <FiAlertCircle className="h-4 w-4" /> },
  { key: "ongoing", label: "In-House Guests", icon: <FiUserCheck className="h-4 w-4" /> },
  { key: "overstay", label: "Overstay Guests", icon: <FiTrendingUp className="h-4 w-4" /> },
  { key: "upcoming", label: "Upcoming Bookings", icon: <FiCheckCircle className="h-4 w-4" /> },
  { key: "relieved", label: "Relieved / Completed", icon: <FiSlash className="h-4 w-4" /> },
  { key: "cancelled", label: "Cancelled / Rejected", icon: <FiXCircle className="h-4 w-4" /> },
];

type Props = {
  initialTab?: ViewType;
};

export default function AdminBookingsOrganism({ initialTab = "pending" }: Props) {
  const [activeTab, setActiveTab] = useState<ViewType>(initialTab);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [checkoutModal, setCheckoutModal] = useState<{ open: boolean; bookingReference: string }>({
    open: false,
    bookingReference: "",
  });
  const [extraAmountInput, setExtraAmountInput] = useState("0");
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

  function parseDateOnly(value: string): Date | null {
    if (!value) return null;
    const datePart = value.split("T")[0] || "";
    const [yearRaw, monthRaw, dayRaw] = datePart.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  function canLateCheckIn(booking: BookingListItem): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkOutDate = parseDateOnly(booking.checkOut);
    if (!checkOutDate) {
      return true;
    }
    // Allow late check-in only while stay window has not fully expired.
    return checkOutDate >= today;
  }

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
    const response = await completeBooking({
      variables: {
        bookingReference,
        ...(hmsId ? { hmsId } : {}),
        checkoutMode: "normal",
      },
    });
    const payload = response.data?.completeBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to relieve booking.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Guest relieved and booking completed.");
    await refetch();
  }

  async function handleOverstayCheckout() {
    if (!checkoutModal.bookingReference) {
      return;
    }

    const parsedAmount = Number(extraAmountInput || 0);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("Extra amount must be a non-negative number.");
      return;
    }

    setMessage("");
    setError("");
    const response = await completeBooking({
      variables: {
        bookingReference: checkoutModal.bookingReference,
        ...(hmsId ? { hmsId } : {}),
        checkoutMode: "overstay",
        extraAmount: parsedAmount,
      },
    });
    const payload = response.data?.completeBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to complete overstay checkout.");
      await refetch();
      return;
    }
    setCheckoutModal({ open: false, bookingReference: "" });
    setExtraAmountInput("0");
    setMessage(payload.message || "Overstay checkout completed.");
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 rounded-xl border border-slate-700 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${activeTab === tab.key ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            style={{ textDecoration: "none" }}
          >
            <span className="shrink-0">{tab.icon}</span>
            <span>{tab.label}</span>
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
                : activeTab === "noshow"
                  ? "No no-show bookings found."
                  : activeTab === "ongoing"
                    ? "No guests are currently in-house."
                    : activeTab === "overstay"
                      ? "No overstay guests found."
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
                : activeTab === "noshow"
                ? (booking) => (
                    <div className="flex flex-wrap gap-2">
                      {canLateCheckIn(booking) ? (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(booking.bookingReference)}
                          disabled={approving || rejecting || cancelling || relieving || checkingIn}
                          className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                        >
                          Late Check In
                        </button>
                      ) : null}
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
                : activeTab === "overstay"
                ? (booking) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckoutModal({ open: true, bookingReference: booking.bookingReference });
                          setExtraAmountInput("0");
                        }}
                        disabled={approving || rejecting || cancelling || relieving || checkingIn}
                        className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                      >
                        Overstay Checkout
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

      {checkoutModal.open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setCheckoutModal({ open: false, bookingReference: "" });
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-slate-100">Overstay Checkout</h3>
            <p className="mt-1 text-sm text-slate-400">Add extra amount, then close booking as checked-out.</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Extra Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={extraAmountInput}
                onChange={(event) => setExtraAmountInput(event.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCheckoutModal({ open: false, bookingReference: "" })}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverstayCheckout}
                className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
              >
                Confirm Checkout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}