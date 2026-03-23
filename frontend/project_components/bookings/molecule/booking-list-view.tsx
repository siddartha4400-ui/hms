"use client";

import { ReactNode } from "react";
import { ReusableAccordion } from "@/components";

import { formatDateDDMMYYYY } from "../utils/date";

export type BookingListItem = {
  id: number;
  bookingReference: string;
  status: string;
  paymentMethod: string;
  inventoryType: string;
  hmsDisplayName: string;
  cityName: string;
  buildingName: string;
  roomNumber?: string | null;
  bedNumber?: string | null;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  totalAmount: number;
  bookedByName?: string | null;
  bookedByEmail?: string | null;
  primaryGuestMobile?: string | null;
  createdAtUtc?: string | null;
};

type Props = {
  bookings: BookingListItem[];
  emptyMessage: string;
  actionSlot?: (booking: BookingListItem) => ReactNode;
};

function statusClasses(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "checked_in":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "cancelled":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
  }
}

function formatCurrency(value?: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function BookingListView({ bookings, emptyMessage, actionSlot }: Props) {
  const accordionItems = bookings.map((booking) => ({
    id: booking.id,
    title: (
      <>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{booking.hmsDisplayName}</p>
        <h3 className="mt-0.5 text-lg font-semibold text-slate-900">{booking.buildingName}</h3>
      </>
    ),
    subtitle:
      booking.inventoryType === "bed"
        ? `Bed ${booking.bedNumber || "-"} • Room ${booking.roomNumber || "-"}`
        : `Room ${booking.roomNumber || "-"}`,
    badge: (
      <div className="flex min-w-[118px] flex-col items-end gap-1.5">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusClasses(booking.status)}`}>
          {booking.status}
        </span>
        <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Ref</p>
          <p className="text-xs font-semibold text-slate-900">{booking.bookingReference}</p>
        </div>
      </div>
    ),
    content: (
      <>
        <div className="grid gap-1.5 text-xs text-slate-600 md:grid-cols-2 lg:grid-cols-4">
          <p>Check-in: <span className="font-medium text-slate-900">{formatDateDDMMYYYY(booking.checkIn)}</span></p>
          <p>Check-out: <span className="font-medium text-slate-900">{formatDateDDMMYYYY(booking.checkOut)}</span></p>
          <p>Booked on: <span className="font-medium text-slate-900">{formatDateDDMMYYYY(booking.createdAtUtc || "")}</span></p>
          <p>Guests: <span className="font-medium text-slate-900">{booking.guestCount}</span></p>
        </div>

        {booking.bookedByName || booking.bookedByEmail || booking.primaryGuestMobile ? (
          <div className="mt-3 grid gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 md:grid-cols-3">
            <p>Requester: <span className="font-medium text-slate-900">{booking.bookedByName || "-"}</span></p>
            <p>Email: <span className="font-medium text-slate-900">{booking.bookedByEmail || "-"}</span></p>
            <p>Mobile: <span className="font-medium text-slate-900">{booking.primaryGuestMobile || "-"}</span></p>
          </div>
        ) : null}

        <div className="mt-3 flex flex-col gap-2.5 border-t border-black/5 pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-600">{booking.cityName} • {booking.paymentMethod.replaceAll("_", " ").toUpperCase()}</p>
            {actionSlot ? actionSlot(booking) : null}
          </div>
          <p className="text-base font-semibold text-slate-900">{formatCurrency(booking.totalAmount)}</p>
        </div>
      </>
    ),
  }));

  return <ReusableAccordion items={accordionItems} emptyMessage={emptyMessage} />;
}