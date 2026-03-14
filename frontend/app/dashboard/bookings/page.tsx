"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  ALL_BOOKINGS,
  CREATE_BOOKING,
  UPDATE_BOOKING_STATUS,
  ALL_GUESTS,
  CREATE_GUEST,
} from "@/lib/graphql/bookings";
import { ALL_ROOMS } from "@/lib/graphql/rooms";

const statusColors: Readonly<Record<string, string>> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-green-100 text-green-800",
  checked_out: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

type BookingItem = {
  id: number;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: string | null;
  notes: string;
  guest: { id: number; name: string; email: string };
  room: { id: number; number: string; building: { name: string } };
};

type GuestItem = { id: number; name: string; email: string };
type RoomItem = {
  id: number;
  number: string;
  status: string;
  building: { name: string };
};

export default function BookingsPage() {
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { data, loading, refetch } = useQuery<{ allBookings: BookingItem[] }>(ALL_BOOKINGS, {
    variables: filter ? { status: filter } : {},
  });
  const [updateStatus] = useMutation(UPDATE_BOOKING_STATUS);

  const bookings: BookingItem[] = data?.allBookings || [];

  const handleStatusChange = async (id: number, newStatus: string) => {
    await updateStatus({ variables: { id, status: newStatus } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bookings</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage reservations and check-ins
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "New Booking"}
        </button>
      </div>

      {showForm && (
        <NewBookingForm
          onComplete={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      <div className="flex gap-2">
        {["", "pending", "confirmed", "checked_in", "checked_out", "cancelled"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {s === ""
                ? "All"
                : s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">
                    {b.guest.name}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {b.guest.email}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Room {b.room.number} - {b.room.building.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {b.checkIn} to {b.checkOut}
                    {b.totalPrice && (
                      <span className="ml-3 font-medium text-gray-700">
                        ${b.totalPrice}
                      </span>
                    )}
                  </p>
                  {b.notes && (
                    <p className="text-sm text-gray-400 italic">{b.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[b.status]}`}
                  >
                    {b.status.replace("_", " ")}
                  </span>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        handleStatusChange(b.id, e.target.value);
                    }}
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600"
                  >
                    <option value="">Update...</option>
                    <option value="confirmed">Confirm</option>
                    <option value="checked_in">Check In</option>
                    <option value="checked_out">Check Out</option>
                    <option value="cancelled">Cancel</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewBookingForm({ onComplete }: Readonly<{ onComplete: () => void }>) {
  const { data: guestsData } = useQuery<{ allGuests: GuestItem[] }>(ALL_GUESTS);
  const { data: roomsData } = useQuery<{ allRooms: RoomItem[] }>(ALL_ROOMS, {
    variables: { status: "available" },
  });
  const [createBooking] = useMutation<{ createBooking: { booking: { id: number; status: string }; message: string } }>(CREATE_BOOKING);
  const [createGuest] = useMutation<{ createGuest: { guest: GuestItem } }>(CREATE_GUEST);

  const [guestId, setGuestId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // New guest fields
  const [showNewGuest, setShowNewGuest] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");

  const guests: GuestItem[] = guestsData?.allGuests || [];
  const rooms: RoomItem[] = roomsData?.allRooms || [];

  const handleNewGuest = async () => {
    try {
      const { data } = await createGuest({
        variables: {
          name: newGuestName,
          email: newGuestEmail,
          phone: newGuestPhone,
        },
      });
      setGuestId(String(data?.createGuest.guest.id));
      setShowNewGuest(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create guest";
      setError(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await createBooking({
        variables: {
          guestId: parseInt(guestId),
          roomId: parseInt(roomId),
          checkIn,
          checkOut,
          totalPrice: totalPrice || undefined,
          notes,
        },
      });
      if (
        data?.createBooking.message === "Room is already booked for these dates"
      ) {
        setError(data.createBooking.message);
        return;
      }
      onComplete();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create booking";
      setError(message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4"
    >
      <h3 className="text-lg font-semibold text-gray-900">New Booking</h3>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Guest
          </label>
          {showNewGuest ? (
            <div className="mt-1 space-y-2">
              <input
                placeholder="Name"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Email"
                type="email"
                value={newGuestEmail}
                onChange={(e) => setNewGuestEmail(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Phone"
                value={newGuestPhone}
                onChange={(e) => setNewGuestPhone(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleNewGuest}
                className="rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
              >
                Add Guest
              </button>
            </div>
          ) : (
            <div className="mt-1 flex gap-2">
              <select
                value={guestId}
                onChange={(e) => setGuestId(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select guest...</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewGuest(true)}
                className="whitespace-nowrap rounded bg-gray-100 px-3 py-2 text-xs text-gray-700 hover:bg-gray-200"
              >
                New
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Room
          </label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select available room...</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.number} - {r.building.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Check-in
          </label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Check-out
          </label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Price
          </label>
          <input
            type="number"
            step="0.01"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            placeholder="Optional"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Create Booking
      </button>
    </form>
  );
}
