"use client";

import dynamic from "next/dynamic";

const PublicBookingV2Organism = dynamic(
  () => import("@/project_components/bookings/organisam/public-booking-v2-organism"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen px-6 py-12 md:px-10 lg:px-12" style={{ background: "var(--bg-base)" }}>
        <div className="mx-auto max-w-7xl animate-pulse space-y-8">
          <div className="h-12 w-56 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-20 w-full rounded-3xl" style={{ background: "var(--bg-elevated)" }} />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-72 rounded-[2rem]" style={{ background: "var(--bg-surface)" }} />
            <div className="h-72 rounded-[2rem]" style={{ background: "var(--bg-elevated)" }} />
          </div>
        </div>
      </div>
    ),
  },
);

export default function HomeBookingClientV2() {
  return <PublicBookingV2Organism />;
}
