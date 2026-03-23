"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { FiCalendar, FiDollarSign, FiTrendingUp } from "react-icons/fi";
import Link from "next/link";

import { LIST_BOOKINGS_QUERY } from "../graphql/operations";
import { getUserHmsId } from "@/lib/auth-token";
import { GET_USER_PROFILE_QUERY } from "@/project_components/common-routes/graphql/operations";
import { ThemedDatePicker } from "@/components";

type BookingListItem = {
  id: number;
  bookingReference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  hmsDisplayName: string;
  buildingName: string;
  roomNumber?: string | null;
  bedNumber?: string | null;
};

type BookingResponse = {
  listBookings: BookingListItem[];
};

type ProfileResponse = {
  getUserProfile?: {
    companyId?: string | null;
  };
};

export default function IncomeOrganism() {
  const today = useMemo(() => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  }, []);

  const thirtyDaysAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  }, []);

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);

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

  const { data, loading } = useQuery<BookingResponse>(LIST_BOOKINGS_QUERY, {
    variables: { view: "relieved", mine: false, ...(hmsId ? { hmsId } : {}) },
    fetchPolicy: "network-only",
  });

  const bookings = useMemo<BookingListItem[]>(() => {
    if (!data?.listBookings) return [];
    return (data.listBookings || []).filter((booking) => {
      const checkOutDate = booking.checkOut.split("T")[0];
      return checkOutDate >= fromDate && checkOutDate <= toDate;
    });
  }, [data, fromDate, toDate]);

  const totalIncome = useMemo(() => {
    return bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
  }, [bookings]);

  const avgIncome = useMemo(() => {
    return bookings.length > 0 ? totalIncome / bookings.length : 0;
  }, [bookings, totalIncome]);

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(value: string): string {
    const [year, month, day] = value.split("-");
    return `${day}-${month}-${year}`;
  }

  function ensureISO(value: string): string {
    if (!value) return value;
    // If already ISO format (YYYY-MM-DD), return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // If DD-MM-YYYY or DD/MM/YYYY format, convert to ISO
    const [day, month, year] = value.split(/[-/]/);
    if (day && month && year) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return value;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <div className="rounded-2xl border p-6" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
            Revenue Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Income Analytics</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Track completed bookings and revenue by date range.
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-secondary)" }}>
              <FiCalendar className="inline mr-1" /> From Date
            </label>
            <ThemedDatePicker
              value={fromDate}
              onChange={(nextValue) => {
                const isoDate = ensureISO(nextValue);
                if (!isoDate) return;

                const boundedFromDate = isoDate > today ? today : isoDate;
                setFromDate(boundedFromDate);
                if (toDate < boundedFromDate) {
                  setToDate(boundedFromDate);
                }
              }}
              placeholder="DD-MM-YYYY"
              maxDate={today}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-secondary)" }}>
              <FiCalendar className="inline mr-1" /> To Date
            </label>
            <ThemedDatePicker
              value={toDate}
              onChange={(nextValue) => {
                const isoDate = ensureISO(nextValue);
                if (!isoDate) return;

                const boundedToDate = isoDate > today ? today : isoDate;
                if (boundedToDate >= fromDate) {
                  setToDate(boundedToDate);
                }
              }}
              placeholder="DD-MM-YYYY"
              minDate={fromDate}
              maxDate={today}
              className="w-full"
            />
          </div>

          <div className="text-xs text-center mt-4 md:col-span-2 lg:col-span-2" style={{ color: "var(--text-secondary)" }}>
            {formatDate(fromDate)} — {formatDate(toDate)}
          </div>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
            Loading income data...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {/* Total Income */}
            <div
              className="rounded-2xl border p-5 text-center"
              style={{ borderColor: "var(--brand-border)", background: "var(--brand-dim)" }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <FiDollarSign className="h-5 w-5" style={{ color: "var(--brand)" }} />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--brand-light)" }}>
                  Total Income
                </p>
              </div>
              <p className="text-3xl font-bold mt-3" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-secondary)" }}>
                {bookings.length} completed booking{bookings.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Average Income */}
            <div
              className="rounded-2xl border p-5 text-center"
              style={{ borderColor: "#60a5fa", background: "rgba(59, 130, 246, 0.08)" }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <FiTrendingUp className="h-5 w-5" style={{ color: "#3b82f6" }} />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "#1e40af" }}>
                  Avg per Booking
                </p>
              </div>
              <p className="text-3xl font-bold mt-3" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(avgIncome)}
              </p>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-secondary)" }}>
                {bookings.length > 0 ? "Based on completed stays" : "No data available"}
              </p>
            </div>

            {/* Booking Count */}
            <div
              className="rounded-2xl border p-5 text-center"
              style={{ borderColor: "#34d399", background: "rgba(16, 185, 129, 0.08)" }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <FiCalendar className="h-5 w-5" style={{ color: "var(--positive)" }} />
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "#059669" }}>
                  Completed
                </p>
              </div>
              <p className="text-3xl font-bold mt-3" style={{ color: "var(--text-primary)" }}>
                {bookings.length}
              </p>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-secondary)" }}>
                Booking{bookings.length !== 1 ? "s" : ""} in period
              </p>
            </div>
          </div>
        )}

        {/* Recent Completed Bookings */}
        {!loading && bookings.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Completed Bookings in Range
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-xl border p-3"
                  style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {booking.buildingName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {booking.hmsDisplayName} • Ref: {booking.bookingReference}
                    </p>
                  </div>
                  <p className="text-base font-bold" style={{ color: "var(--brand)" }}>
                    {formatCurrency(booking.totalAmount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div
            className="rounded-2xl border border-dashed p-8 text-center"
            style={{ borderColor: "var(--border-strong)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            <p className="text-sm">No completed bookings found in this date range.</p>
          </div>
        )}
      </div>
    </div>
  );
}
