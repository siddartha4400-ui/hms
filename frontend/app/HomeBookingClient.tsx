"use client";

import dynamic from "next/dynamic";

const PublicBookingOrganism = dynamic(
  () => import("@/project_components/bookings/organisam/public-booking-organism"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#f6f1e8] px-6 py-12 md:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl animate-pulse space-y-8">
          <div className="h-12 w-56 rounded-2xl bg-[#e7dfd1]" />
          <div className="h-20 w-full rounded-3xl bg-[#e7dfd1]" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-72 rounded-[2rem] bg-[#e7dfd1]" />
            <div className="h-72 rounded-[2rem] bg-[#ddd2bf]" />
          </div>
        </div>
      </div>
    ),
  },
);

export default function HomeBookingClient() {
  return <PublicBookingOrganism />;
}