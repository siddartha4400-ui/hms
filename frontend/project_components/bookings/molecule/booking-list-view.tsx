"use client";

import { useState } from "react";
import { ReactNode } from "react";
import { ReusableAccordion } from "@/components";
import { normalizeBackendAssetUrl } from "@/lib/backend-url";

import { formatDateDDMMYYYY } from "../utils/date";

export type BookingListItem = {
  id: number;
  bookingReference: string;
  status: string;
  paymentMethod: string;
  specialRequest?: string | null;
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
  guests?: Array<{
    id: number;
    fullName: string;
    mobileNumber?: string | null;
    aadhaarAttachmentId?: number | null;
    aadhaarAttachmentUrl?: string | null;
  }>;
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
  const [aadhaarPreview, setAadhaarPreview] = useState<{ name: string; url: string } | null>(null);

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

        {booking.specialRequest ? (
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Comments</p>
            <p className="mt-1 whitespace-pre-wrap">{booking.specialRequest}</p>
          </div>
        ) : null}

        {(booking.guests || []).length > 0 ? (
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Guest Details</p>
            <div className="mt-2 grid gap-1.5 text-xs text-slate-600 md:grid-cols-2">
              {(booking.guests || []).map((guest, guestIndex) => (
                <div key={guest.id || guestIndex} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <p>Name: <span className="font-medium text-slate-900">{guest.fullName || "-"}</span></p>
                  <p>Mobile: <span className="font-medium text-slate-900">{guest.mobileNumber || "-"}</span></p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p>Aadhaar: <span className="font-medium text-slate-900">{guest.aadhaarAttachmentId ? "Uploaded" : "-"}</span></p>
                    {guest.aadhaarAttachmentUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setAadhaarPreview({
                            name: guest.fullName || "Guest",
                            url: normalizeBackendAssetUrl(guest.aadhaarAttachmentUrl || ""),
                          })
                        }
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700"
                      >
                        View Aadhaar
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
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

  const isPdf = Boolean(aadhaarPreview?.url && aadhaarPreview.url.toLowerCase().includes(".pdf"));

  return (
    <>
      <ReusableAccordion items={accordionItems} emptyMessage={emptyMessage} />

      {aadhaarPreview ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAadhaarPreview(null);
            }
          }}
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">Aadhaar preview - {aadhaarPreview.name}</p>
              <button
                type="button"
                onClick={() => setAadhaarPreview(null)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto bg-slate-900 p-3">
              {isPdf ? (
                <iframe
                  title="Aadhaar PDF preview"
                  src={aadhaarPreview.url}
                  className="h-[70vh] w-full rounded-lg border border-slate-700 bg-white"
                />
              ) : (
                <img
                  src={aadhaarPreview.url}
                  alt={`Aadhaar for ${aadhaarPreview.name}`}
                  className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg border border-slate-700 bg-black/20 object-contain"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}