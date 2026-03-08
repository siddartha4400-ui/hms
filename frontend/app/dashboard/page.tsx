"use client";

import { useQuery } from "@apollo/client/react";
import { useAuth } from "@/lib/auth-context";
import { DASHBOARD_STATS, ALL_BOOKINGS } from "@/lib/graphql/bookings";

interface BookingItem {
  id: string;
  guest: { name: string };
  room: { number: string; building: { name: string } };
  checkIn: string;
  checkOut: string;
  status: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: statsData } = useQuery<{ dashboardStats: string }>(DASHBOARD_STATS);
  const { data: bookingsData } = useQuery<{ allBookings: BookingItem[] }>(ALL_BOOKINGS);

  const stats = statsData?.dashboardStats
    ? JSON.parse(statsData.dashboardStats)
    : null;

  const recentBookings = bookingsData?.allBookings?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user || "User"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Rooms"
          value={stats?.total_rooms ?? "--"}
          color="bg-blue-500"
        />
        <StatCard
          label="Available"
          value={stats?.available_rooms ?? "--"}
          color="bg-green-500"
        />
        <StatCard
          label="Booked"
          value={stats?.booked_rooms ?? "--"}
          color="bg-yellow-500"
        />
        <StatCard
          label="Active Bookings"
          value={stats?.active_bookings ?? "--"}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Bookings
          </h3>
          {recentBookings.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No bookings yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentBookings.map(
                (b: {
                  id: string;
                  guest: { name: string };
                  room: { number: string; building: { name: string } };
                  checkIn: string;
                  checkOut: string;
                  status: string;
                }) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {b.guest.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Room {b.room.number} - {b.room.building.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {b.checkIn} to {b.checkOut}
                      </p>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Room Status Overview
          </h3>
          {stats ? (
            <div className="mt-4 space-y-4">
              <BarItem
                label="Available"
                count={stats.available_rooms}
                total={stats.total_rooms}
                color="bg-green-500"
              />
              <BarItem
                label="Booked"
                count={stats.booked_rooms}
                total={stats.total_rooms}
                color="bg-yellow-500"
              />
              <BarItem
                label="Maintenance"
                count={stats.maintenance_rooms}
                total={stats.total_rooms}
                color="bg-red-500"
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No room data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    checked_in: "bg-green-100 text-green-800",
    checked_out: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function BarItem({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{count}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
