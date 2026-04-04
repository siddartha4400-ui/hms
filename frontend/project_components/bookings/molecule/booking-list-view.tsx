"use client";

import { useState } from "react";
import { ReactNode } from "react";
import { FiEye, FiX } from "react-icons/fi";
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
  propertyType?: string | null;
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

function getStatusStyle(status: string): React.CSSProperties {
  switch (status) {
    case "pending":
      return { background: "rgba(245,158,11,0.14)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.28)" };
    case "confirmed":
      return { background: "rgba(16,185,129,0.13)", color: "var(--positive)", border: "1px solid rgba(16,185,129,0.28)" };
    case "checked_in":
      return { background: "rgba(6,182,212,0.12)", color: "var(--brand-light)", border: "1px solid rgba(6,182,212,0.25)" };
    case "rejected":
      return { background: "rgba(239,68,68,0.12)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" };
    case "cancelled":
      return { background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-strong)" };
    default:
      return { background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" };
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
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--text-muted)" }}
        >
          {booking.hmsDisplayName}
        </p>
        <h3
          className="mt-0.5 text-base font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {booking.buildingName}
        </h3>
      </>
    ),
    subtitle:
      booking.inventoryType === "bed"
        ? `Bed ${booking.bedNumber || "–"} · Room ${booking.roomNumber || "–"}`
        : `Room ${booking.roomNumber || "–"}`,
    badge: (
      <div className="flex min-w-[110px] flex-col items-end gap-1.5">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
          style={getStatusStyle(booking.status)}
        >
          {booking.status.replace(/_/g, " ")}
        </span>
        <div
          className="rounded-lg px-2.5 py-1 text-right"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          <p
            className="text-[9px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-muted)" }}
          >
            Ref
          </p>
          <p
            className="text-[11px] font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {booking.bookingReference}
          </p>
        </div>
      </div>
    ),
    content: (
      <>
        {/* Core booking info */}
        <div
          className="grid gap-1.5 rounded-xl px-3 py-2.5 text-xs"
          style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
        >
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            <p>
              Check-in:{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {formatDateDDMMYYYY(booking.checkIn)}
              </span>
            </p>
            <p>
              Check-out:{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {formatDateDDMMYYYY(booking.checkOut)}
              </span>
            </p>
            <p>
              Booked on:{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {formatDateDDMMYYYY(booking.createdAtUtc || "")}
              </span>
            </p>
            <p>
              Guests:{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {booking.guestCount}
              </span>
            </p>
          </div>
        </div>

        {/* Requester info */}
        {booking.bookedByName || booking.bookedByEmail || booking.primaryGuestMobile ? (
          <div
            className="mt-2.5 grid gap-1.5 rounded-xl px-3 py-2.5 text-xs md:grid-cols-3"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            <p>
              Requester:{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {booking.bookedByName || "–"}
              </span>
            </p>
            <p>
              Email:{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {booking.bookedByEmail || "–"}
              </span>
            </p>
            <p>
              Mobile:{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {booking.primaryGuestMobile || "–"}
              </span>
            </p>
          </div>
        ) : null}

        {/* Special request / comments */}
        {booking.specialRequest ? (
          <div
            className="mt-2.5 rounded-xl px-3 py-2.5 text-xs"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "var(--text-muted)" }}
            >
              Comments
            </p>
            <p className="mt-1 whitespace-pre-wrap">{booking.specialRequest}</p>
          </div>
        ) : null}

        {/* Guest details */}
        {(booking.guests || []).length > 0 ? (
          <div
            className="mt-2.5 rounded-xl px-3 py-2.5"
            style={{ background: "var(--bg-elevated)" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: "var(--text-muted)" }}
            >
              Guest Details
            </p>
            <div className="mt-2 grid gap-1.5 text-xs md:grid-cols-2">
              {(booking.guests || []).map((guest, guestIndex) => (
                <div
                  key={guest.id || guestIndex}
                  className="rounded-xl border px-3 py-2.5"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-surface)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <p>
                    Name:{" "}
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {guest.fullName || "–"}
                    </span>
                  </p>
                  <p className="mt-0.5">
                    Mobile:{" "}
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {guest.mobileNumber || "–"}
                    </span>
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p>
                      Aadhaar:{" "}
                      <span
                        className="font-semibold"
                        style={{ color: guest.aadhaarAttachmentId ? "var(--positive)" : "var(--text-muted)" }}
                      >
                        {guest.aadhaarAttachmentId ? "Uploaded" : "–"}
                      </span>
                    </p>
                    {guest.aadhaarAttachmentUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setAadhaarPreview({
                            name: guest.fullName || "Guest",
                            url: normalizeBackendAssetUrl(guest.aadhaarAttachmentUrl || ""),
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all"
                        style={{
                          background: "var(--brand-dim)",
                          color: "var(--brand-light)",
                          border: "1px solid var(--brand-border)",
                        }}
                      >
                        <FiEye className="h-3 w-3" />
                        View
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer: city, payment, actions, amount */}
        <div
          className="mt-3 flex flex-col gap-3 border-t pt-3 md:flex-row md:items-center md:justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {booking.cityName} · {booking.paymentMethod.replaceAll("_", " ").toUpperCase()}
            </span>
            {actionSlot ? actionSlot(booking) : null}
          </div>
          <p
            className="text-base font-bold"
            style={{ color: "var(--brand-light)" }}
          >
            {formatCurrency(booking.totalAmount)}
          </p>
        </div>
      </>
    ),
  }));

  const isPdf = Boolean(aadhaarPreview?.url && aadhaarPreview.url.toLowerCase().includes(".pdf"));

  return (
    <>
      <ReusableAccordion items={accordionItems} emptyMessage={emptyMessage} />

      {/* Aadhaar preview modal */}
      {aadhaarPreview ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setAadhaarPreview(null);
          }}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Aadhaar preview — {aadhaarPreview.name}
              </p>
              <button
                type="button"
                onClick={() => setAadhaarPreview(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
                aria-label="Close"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div
              className="max-h-[75vh] overflow-auto p-3"
              style={{ background: "var(--bg-elevated)" }}
            >
              {isPdf ? (
                <iframe
                  title="Aadhaar PDF preview"
                  src={aadhaarPreview.url}
                  className="h-[70vh] w-full rounded-xl"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-surface)" }}
                />
              ) : (
                <img
                  src={aadhaarPreview.url}
                  alt={`Aadhaar for ${aadhaarPreview.name}`}
                  className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                  style={{ border: "1px solid var(--border)" }}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
