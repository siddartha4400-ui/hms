"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ALL_ROOMS, UPDATE_ROOM } from "@/lib/graphql/rooms";

interface RoomItem {
  id: number;
  number: string;
  building: { name: string };
  floor: { number: number };
  roomType: string;
  capacity: number;
  basePrice: string;
  status: string;
}

const statusColors: Readonly<Record<string, string>> = {
  available: "bg-green-100 text-green-800",
  booked: "bg-yellow-100 text-yellow-800",
  maintenance: "bg-red-100 text-red-800",
};

export default function RoomsPage() {
  const [filter, setFilter] = useState<string>("");
  const { data, loading, refetch } = useQuery<{ allRooms: RoomItem[] }>(ALL_ROOMS, {
    variables: filter ? { status: filter } : {},
  });
  const [updateRoom] = useMutation(UPDATE_ROOM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const rooms = data?.allRooms || [];

  const handleStatusUpdate = async (id: number) => {
    await updateRoom({ variables: { id, status: editStatus } });
    setEditingId(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rooms</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your room inventory
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {["", "available", "booked", "maintenance"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No rooms found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Building / Floor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rooms.map(
                (room: {
                  id: number;
                  number: string;
                  building: { name: string };
                  floor: { number: number };
                  roomType: string;
                  capacity: number;
                  basePrice: string;
                  status: string;
                }) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {room.number}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {room.building.name} / Floor {room.floor.number}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {room.roomType || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {room.capacity}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      ${room.basePrice}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {editingId === room.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="available">Available</option>
                          <option value="booked">Booked</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[room.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {room.status}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {editingId === room.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusUpdate(room.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(room.id);
                            setEditStatus(room.status);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
