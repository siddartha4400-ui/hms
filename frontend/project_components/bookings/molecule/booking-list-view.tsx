"use client";

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
  createdAtUtc?: string | null;
};

type Props = {
  bookings: BookingListItem[];
  emptyMessage: string;
};

function formatCurrency(value?: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function BookingListView({ bookings, emptyMessage }: Props) {
  if (!bookings.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <article key={booking.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_16px_46px_-32px_rgba(15,23,42,0.45)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{booking.hmsDisplayName}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{booking.buildingName}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {booking.inventoryType === "bed"
                  ? `Bed ${booking.bedNumber || "-"} • Room ${booking.roomNumber || "-"}`
                  : `Room ${booking.roomNumber || "-"}`}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Ref</p>
              <p className="text-sm font-semibold text-slate-900">{booking.bookingReference}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2 lg:grid-cols-4">
            <p>Check-in: <span className="font-medium text-slate-900">{formatDateDDMMYYYY(booking.checkIn)}</span></p>
            <p>Check-out: <span className="font-medium text-slate-900">{formatDateDDMMYYYY(booking.checkOut)}</span></p>
            <p>Booked on: <span className="font-medium text-slate-900">{formatDateDDMMYYYY(booking.createdAtUtc || "")}</span></p>
            <p>Guests: <span className="font-medium text-slate-900">{booking.guestCount}</span></p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
            <p className="text-sm text-slate-600">{booking.cityName} • {booking.status.toUpperCase()} • {booking.paymentMethod.toUpperCase()}</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(booking.totalAmount)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}