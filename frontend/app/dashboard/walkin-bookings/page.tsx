"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import PublicBookingOrganism from "@/project_components/bookings/organisam/public-booking-organism";
import { getUserRole, getValidAuthToken } from "@/lib/auth-token";

export default function WalkinBookingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getValidAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const role = getUserRole();
    const isAdmin = role === "root_admin" || role === "site_admin" || role === "site_building_manager";
    if (!isAdmin) {
      router.replace("/my-bookings");
      return;
    }

    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return null;
  }

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] no-underline mb-4"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-secondary)" }}
        >
          ← Dashboard
        </Link>
        <div className="mb-4 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
            Admin Walk-in Booking
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            For direct visitors at building. Create request here, then manage status in bookings console.
          </p>
          <Link
            href="/dashboard/bookings"
            className="mt-2 inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] no-underline"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            Open bookings console
          </Link>
        </div>
      </div>
      <PublicBookingOrganism mode="admin" />
    </div>
  );
}
