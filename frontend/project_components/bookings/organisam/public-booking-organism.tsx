"use client";

import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiHome,
  FiLayers,
  FiLogIn,
  FiLogOut,
  FiMapPin,
  FiMoon,
  FiShield,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ReusableFormModal, ThemedDatePicker } from "@/components";
import AttachmentUploader, { UploadedAttachment } from "@/components/AttachmentUploader";
import { getValidAuthToken } from "@/lib/auth-token";
import { LOGIN_MUTATION, LOGOUT_MUTATION } from "@/project_components/login/graphql/operations";
import { LIST_CITIES_QUERY } from "@/project_components/propertys/graphql/operations";

import { CREATE_BOOKING_MUTATION, SEARCH_AVAILABILITY_QUERY } from "../graphql/operations";
import { formatDateDDMMYYYY } from "../utils/date";

type City = {
  id: number;
  cityName: string;
  state?: string | null;
  country?: string | null;
};

type AvailabilityOption = {
  inventoryType: "room" | "bed";
  bookingTargetId: number;
  hmsId: number;
  hmsName: string;
  hmsDisplayName: string;
  imageUrl?: string | null;
  cityId: number;
  cityName: string;
  buildingId: number;
  buildingName: string;
  location?: string | null;
  propertyType: "pg" | "lodge";
  roomId?: number | null;
  roomNumber?: string | null;
  roomType?: string | null;
  bedId?: number | null;
  bedNumber?: string | null;
  guestCapacity?: number | null;
  pricePerDay?: number | null;
  pricePerMonth?: number | null;
  totalAmount?: number | null;
  available: boolean;
};

type BookingGuest = {
  fullName: string;
  mobileNumber: string;
  aadhaarAttachmentId: number | null;
};

type BookingResponse = {
  createBooking: {
    success: boolean;
    message: string;
    booking?: {
      bookingReference: string;
      hmsDisplayName: string;
      cityName: string;
      buildingName: string;
      roomNumber?: string | null;
      bedNumber?: string | null;
      checkIn: string;
      checkOut: string;
      guestCount: number;
      totalAmount: number;
    } | null;
  };
};

type LoginResponse = {
  login: {
    success: boolean;
    message: string;
    token?: string | null;
    refreshToken?: string | null;
  };
};

type AvailabilityResponse = {
  searchAvailability: AvailabilityOption[];
};

type CitiesResponse = {
  listCities: City[];
};

function formatDateInput(value: Date): string {
  return value.toISOString().split("T")[0];
}

function addDays(base: string, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
}

function formatCurrency(value?: number | null): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function stayLength(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Number.isNaN(diff) ? 0 : diff;
}

function makeGuestList(count: number): BookingGuest[] {
  return Array.from({ length: count }, () => ({
    fullName: "",
    mobileNumber: "",
    aadhaarAttachmentId: null,
  }));
}

export default function PublicBookingOrganism() {
  const today = useMemo(() => formatDateInput(new Date()), []);
  const [cityId, setCityId] = useState<number | "">("");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [guestCount, setGuestCount] = useState(1);
  const [selectedOption, setSelectedOption] = useState<AvailabilityOption | null>(null);
  const [guests, setGuests] = useState<BookingGuest[]>(makeGuestList(1));
  const [specialRequest, setSpecialRequest] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmation, setConfirmation] = useState<BookingResponse["createBooking"]["booking"] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return Boolean(getValidAuthToken());
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingBookingAfterLogin, setPendingBookingAfterLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const { data: cityData } = useQuery<CitiesResponse>(LIST_CITIES_QUERY, {
    variables: { isActive: true },
  });
  const [loadAvailability, { data: availabilityData, loading: availabilityLoading }] = useLazyQuery<AvailabilityResponse>(
    SEARCH_AVAILABILITY_QUERY,
    { fetchPolicy: "network-only" },
  );
  const [createBooking, { loading: bookingLoading }] = useMutation<BookingResponse>(CREATE_BOOKING_MUTATION);
  const [loginMutation, { loading: loginLoading }] = useMutation<LoginResponse>(LOGIN_MUTATION);
  const [logoutMutation, { loading: logoutLoading }] = useMutation(LOGOUT_MUTATION);
  const router = useRouter();

  const nights = stayLength(checkIn, checkOut);
  const results = availabilityData?.searchAvailability || [];

  function handleGuestCountChange(nextCount: number) {
    setGuestCount(nextCount);
    setGuests((current) => {
      const next = makeGuestList(nextCount);
      return next.map((guest, index) => current[index] || guest);
    });
  }

  function validateSearch(): boolean {
    if (!cityId) {
      setFormError("Select a city before searching.");
      return false;
    }
    if (!checkIn || !checkOut) {
      setFormError("Choose both check-in and check-out dates.");
      return false;
    }
    if (nights <= 0) {
      setFormError("Check-out must be after check-in.");
      return false;
    }
    if (nights > 31) {
      setFormError("Stay must be less than or equal to 31 days.");
      return false;
    }
    setFormError("");
    return true;
  }

  async function handleSearch() {
    if (!validateSearch()) {
      return;
    }
    setConfirmation(null);
    setSelectedOption(null);
    await loadAvailability({
      variables: {
        cityId: Number(cityId),
        checkIn,
        checkOut,
        guestCount,
      },
    });
  }

  function updateGuest(index: number, field: keyof BookingGuest, value: string | number | null) {
    setGuests((current) =>
      current.map((guest, guestIndex) => (guestIndex === index ? { ...guest, [field]: value } : guest)),
    );
  }

  function handleUpload(index: number, attachments: UploadedAttachment[]) {
    const attachment = attachments[0];
    if (!attachment) {
      return;
    }
    updateGuest(index, "aadhaarAttachmentId", attachment.id);
  }

  function validateGuestInputs(): boolean {
    for (const [index, guest] of guests.entries()) {
      if (!guest.fullName.trim()) {
        setFormError(`Guest ${index + 1} full name is required.`);
        return false;
      }
      if (!guest.aadhaarAttachmentId) {
        setFormError(`Upload Aadhaar proof for guest ${index + 1}.`);
        return false;
      }
    }
    return true;
  }

  async function submitBookingRequest() {
    setFormError("");
    const response = await createBooking({
      variables: {
        inventoryType: selectedOption?.inventoryType,
        roomId: selectedOption?.roomId,
        bedId: selectedOption?.bedId,
        checkIn,
        checkOut,
        guestCount,
        paymentMethod: "cod",
        specialRequest: specialRequest.trim() || null,
        guests: guests.map((guest) => ({
          fullName: guest.fullName,
          mobileNumber: guest.mobileNumber,
          aadhaarAttachmentId: guest.aadhaarAttachmentId,
        })),
      },
    });

    if (!response.data?.createBooking.success || !response.data.createBooking.booking) {
      setFormError(response.data?.createBooking.message || "Booking failed.");
      return;
    }

    setConfirmation(response.data.createBooking.booking);
    setSelectedOption(null);
    await handleSearch();
  }

  async function handleBooking() {
    if (!selectedOption) {
      setFormError("Select a room or bed to continue.");
      return;
    }
    if (!isAuthenticated) {
      setPendingBookingAfterLogin(true);
      setShowLoginModal(true);
      setFormError("Login is required before booking.");
      return;
    }

    if (!validateGuestInputs()) {
      return;
    }

    await submitBookingRequest();
  }

  async function handleLoginFromPopup() {
    setLoginError("");
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Email and password are required.");
      return;
    }

    const response = await loginMutation({
      variables: {
        method: "password",
        email: loginEmail.trim(),
        password: loginPassword,
      },
    });

    const payload = response.data?.login;
    if (!payload?.success || !payload.token || !payload.refreshToken) {
      setLoginError(payload?.message || "Login failed.");
      return;
    }

    localStorage.setItem("authToken", payload.token);
    localStorage.setItem("refreshToken", payload.refreshToken);
    setIsAuthenticated(true);
    setShowLoginModal(false);

    if (pendingBookingAfterLogin) {
      setPendingBookingAfterLogin(false);
      if (!selectedOption) {
        return;
      }
      if (!validateGuestInputs()) {
        return;
      }
      await submitBookingRequest();
    }
  }

  async function handleLogout() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await logoutMutation({ variables: { refreshToken } });
      } catch {}
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    setIsAuthenticated(false);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-slate-900">
      {/* Sticky top navigation */}
      <nav className="sticky top-0 z-50 border-b border-black/8 bg-[#f6f1e8]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 md:px-10 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17362e]">
              <FiLayers className="text-sm text-white" />
            </div>
            <div className="leading-none">
              <span className="block text-sm font-bold text-slate-900">HotelSphere</span>
              <span className="hidden text-[9px] uppercase tracking-[.2em] text-slate-400 md:block">Hospitality Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  href="/my-bookings"
                  className="hidden items-center rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 no-underline transition hover:bg-black/5 md:inline-flex"
                >
                  My Bookings
                </Link>
                <Link
                  href="/dashboard"
                  className="hidden items-center rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 no-underline transition hover:bg-black/5 md:inline-flex"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white disabled:opacity-60"
                >
                  <FiLogOut className="text-sm" />
                  <span className="hidden md:inline">{logoutLoading ? "Signing out…" : "Sign out"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#17362e] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#0f2721]"
              >
                <FiLogIn className="text-sm" />
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-black/5 bg-[radial-gradient(circle_at_top_left,_rgba(27,94,73,0.18),_transparent_30%),linear-gradient(135deg,_#f8f5ef_0%,_#e9ddcb_50%,_#f3eee5_100%)]">
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-[#1b5e49]/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#c16d3c]/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:px-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1b5e49]/15 bg-white/70 px-4 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1b5e49]">Live inventory · Instant booking</span>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-[-0.04em] text-slate-900 md:text-6xl">
                Find a room or PG bed for your next stay.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Browse available lodge rooms and shared PG beds across cities. Pick your dates, verify with Aadhaar, and confirm with cash on delivery — all in one place.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step 1</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">Search stays</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Choose your city and travel dates. We'll instantly show all open rooms and PG beds.</p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-white/80 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step 2</p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">Verify identity</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Upload an Aadhaar photo for each guest. Required at check-in — takes under a minute.</p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-[#17362e] p-5 text-white shadow-[0_24px_80px_-36px_rgba(23,54,46,0.7)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Step 3</p>
                <p className="mt-3 text-2xl font-semibold">Pay on arrival</p>
                <p className="mt-2 text-sm leading-6 text-emerald-50/80">No advance payment needed. Pay the full amount in cash when you arrive at the property.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white/88 p-6 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.35)] backdrop-blur md:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Public search</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Book now</h2>
              </div>
              <div className="rounded-2xl bg-[#f0e7d9] px-3 py-2 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e4f2b]">Night span</p>
                <p className="text-lg font-semibold text-slate-900">{Math.max(nights, 0)} nights</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                City
                <select
                  value={cityId}
                  onChange={(event) => setCityId(event.target.value ? Number(event.target.value) : "")}
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 outline-none transition focus:border-[#1b5e49]"
                >
                  <option value="">Select city</option>
                  {cityData?.listCities?.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.cityName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Guests
                <select
                  value={guestCount}
                  onChange={(event) => handleGuestCountChange(Number(event.target.value))}
                  className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 outline-none transition focus:border-[#1b5e49]"
                >
                  {[1, 2, 3, 4].map((value) => (
                    <option key={value} value={value}>
                      {value} {value === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Check-in
                <ThemedDatePicker
                  value={checkIn}
                  onChange={(nextValue) => {
                    setCheckIn(nextValue);
                    if (stayLength(nextValue, checkOut) <= 0) {
                      setCheckOut(addDays(nextValue, 1));
                    }
                  }}
                  placeholder="DD-MM-YYYY"
                  className="w-full"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Check-out
                <ThemedDatePicker
                  value={checkOut}
                  onChange={(nextValue) => setCheckOut(nextValue)}
                  placeholder="DD-MM-YYYY"
                  className="w-full"
                />
              </label>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Trip dates: <span className="font-semibold text-slate-700">{formatDateDDMMYYYY(checkIn)}</span> to <span className="font-semibold text-slate-700">{formatDateDDMMYYYY(checkOut)}</span>
            </p>

            <button
              onClick={handleSearch}
              disabled={availabilityLoading}
              className="mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#17362e] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#0f2721] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {availabilityLoading ? "Searching..." : "Search availability"}
              <FiArrowRight />
            </button>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f0e7d9] px-3 py-1.5"><FiCalendar /> stay under 31 days</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f0e7d9] px-3 py-1.5"><FiCreditCard /> COD only</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f0e7d9] px-3 py-1.5"><FiShield /> Aadhaar required</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12 lg:py-12">
        {formError ? (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {formError}
          </div>
        ) : null}

        {confirmation ? (
          <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-[0_20px_60px_-40px_rgba(22,101,52,0.45)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  <FiCheckCircle /> Booking confirmed
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-slate-900">Reference {confirmation.bookingReference}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                  {confirmation.hmsDisplayName} at {confirmation.buildingName}, {confirmation.cityName} is reserved from {formatDateDDMMYYYY(confirmation.checkIn)} to {formatDateDDMMYYYY(confirmation.checkOut)}.
                </p>
              </div>
              <div className="rounded-3xl bg-white px-5 py-4 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Amount due on arrival</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(confirmation.totalAmount)}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Available inventory</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900">Results for your trip</h2>
              </div>
              <p className="text-sm text-slate-500">{results.length} option{results.length === 1 ? "" : "s"}</p>
            </div>

            {results.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/70 p-8 text-center text-slate-500">
                Search by city, dates, and guest count to see available lodge rooms and PG beds.
              </div>
            ) : (
              <div className="grid gap-5">
                {results.map((option) => {
                  const isSelected = selectedOption?.bookingTargetId === option.bookingTargetId && selectedOption?.inventoryType === option.inventoryType;
                  return (
                    <article
                      key={`${option.inventoryType}-${option.bookingTargetId}`}
                      className={`overflow-hidden rounded-[2rem] border transition ${isSelected ? "border-[#1b5e49] shadow-[0_24px_80px_-40px_rgba(27,94,73,0.55)]" : "border-black/5 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)]"}`}
                    >
                      <div className="grid gap-0 md:grid-cols-[0.42fr_0.58fr]">
                        <div className="min-h-[220px] bg-[linear-gradient(135deg,_rgba(23,54,46,0.88),_rgba(193,109,60,0.62))] p-6 text-white">
                          <div className="flex h-full flex-col justify-between">
                            <div className="space-y-3">
                              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                                {option.inventoryType === "room" ? "Lodge room" : "PG bed"}
                              </span>
                              <div>
                                <h3 className="text-3xl font-semibold tracking-[-0.03em]">{option.buildingName}</h3>
                                <p className="mt-2 text-sm text-white/75">{option.hmsDisplayName}</p>
                              </div>
                            </div>
                            <div className="rounded-3xl bg-black/15 p-4 backdrop-blur-sm">
                              <p className="text-xs uppercase tracking-[0.22em] text-white/70">Arrival price</p>
                              <p className="mt-2 text-3xl font-semibold">{formatCurrency(option.totalAmount)}</p>
                              <p className="mt-1 text-sm text-white/75">{formatCurrency(option.pricePerDay)} per day</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-6">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Stay summary</p>
                              <p className="mt-2 text-2xl font-semibold text-slate-900">
                                {option.inventoryType === "room" ? `Room ${option.roomNumber}` : `Bed ${option.bedNumber}`}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">{option.roomType} · {option.propertyType.toUpperCase()}</p>
                            </div>
                            <button
                              onClick={() => setSelectedOption(option)}
                              className={`rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition ${isSelected ? "bg-[#17362e] text-white" : "bg-[#f0e7d9] text-slate-900 hover:bg-[#e6d8c5]"}`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </button>
                          </div>

                          <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3"><FiMapPin /> {option.location || option.cityName}</div>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3"><FiUsers /> {option.inventoryType === "bed" ? "1 guest" : `${guestCount} guest search`}</div>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3"><FiHome /> {option.cityName}</div>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3"><FiMoon /> {Math.max(nights, 1)} night stay</div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_22px_70px_-50px_rgba(15,23,42,0.5)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Checkout panel</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900">Complete booking</h2>

              {!isAuthenticated ? (
                <div className="mt-5 rounded-2xl border border-[#1b5e49]/20 bg-[#f0faf6] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#17362e]">
                      <FiLogIn className="text-sm text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">Sign in to complete your booking</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Browse and select a property first — sign in only when you're ready to confirm.</p>
                      <button
                        type="button"
                        onClick={() => setShowLoginModal(true)}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#17362e] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#0f2721]"
                      >
                        <FiLogIn className="text-xs" />
                        Sign in
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm">
                  <FiCheckCircle className="shrink-0 text-emerald-600" />
                  <span className="font-medium text-emerald-800">You're signed in — ready to book.</span>
                </div>
              )}

              {selectedOption ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-3xl bg-[#17362e] p-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">Selected inventory</p>
                    <p className="mt-2 text-2xl font-semibold">{selectedOption.buildingName}</p>
                    <p className="mt-1 text-sm text-emerald-50/80">{selectedOption.inventoryType === "room" ? `Room ${selectedOption.roomNumber}` : `Bed ${selectedOption.bedNumber} · Room ${selectedOption.roomNumber}`}</p>
                    <p className="mt-4 text-3xl font-semibold">{formatCurrency(selectedOption.totalAmount)}</p>
                    <p className="mt-1 text-sm text-emerald-50/75">Cash on delivery at arrival</p>
                  </div>

                  <div className="space-y-4">
                    {guests.map((guest, index) => (
                      <div key={index} className="rounded-3xl border border-black/5 bg-[#faf7f1] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Guest {index + 1}</p>
                        <div className="mt-3 grid gap-3">
                          <label className="space-y-2 text-sm font-medium text-slate-700">
                            Full name
                            <input
                              type="text"
                              value={guest.fullName}
                              onChange={(event) => updateGuest(index, "fullName", event.target.value)}
                              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 outline-none transition focus:border-[#1b5e49]"
                              placeholder="Guest full name"
                            />
                          </label>
                          <label className="space-y-2 text-sm font-medium text-slate-700">
                            Mobile number
                            <input
                              type="tel"
                              value={guest.mobileNumber}
                              onChange={(event) => updateGuest(index, "mobileNumber", event.target.value)}
                              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 outline-none transition focus:border-[#1b5e49]"
                              placeholder="Optional contact number"
                            />
                          </label>
                          <AttachmentUploader
                            entityType="booking_guest_aadhaar"
                            entityId={0}
                            hmsId={selectedOption.hmsId}
                            multiple={false}
                            accept="image/*,.pdf"
                            label="Upload Aadhaar proof"
                            showUploadedList
                            onUploadComplete={(attachments) => handleUpload(index, attachments)}
                            onUploadError={(message) => setFormError(message)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Special request
                    <textarea
                      value={specialRequest}
                      onChange={(event) => setSpecialRequest(event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[#1b5e49]"
                      placeholder="Arrival note, luggage request, or any preference"
                    />
                  </label>

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#c16d3c] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#ab5b2d] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {bookingLoading ? "Confirming..." : "Confirm COD booking"}
                    <FiArrowRight />
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-black/10 bg-[#faf7f1] p-6 text-sm leading-6 text-slate-600">
                  Choose a result on the left to open the guest form and Aadhaar upload steps.
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_22px_70px_-50px_rgba(15,23,42,0.5)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Why book with us?</p>
              <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
                <div className="flex gap-3">
                  <FiUser className="mt-0.5 shrink-0 text-[#1b5e49]" />
                  <span>Browse freely without signing in. Log in only when you're ready to confirm a stay.</span>
                </div>
                <div className="flex gap-3">
                  <FiShield className="mt-0.5 shrink-0 text-[#1b5e49]" />
                  <span>Your room is secured the moment you book — no one else can take it.</span>
                </div>
                <div className="flex gap-3">
                  <FiCalendar className="mt-0.5 shrink-0 text-[#1b5e49]" />
                  <span>View all your past and upcoming bookings anytime in your personal dashboard.</span>
                </div>
                <div className="flex gap-3">
                  <FiCheckCircle className="mt-0.5 shrink-0 text-[#1b5e49]" />
                  <span>No advance payment — pay the full amount in cash when you arrive.</span>
                </div>
              </div>
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="mt-5 w-full rounded-2xl border border-[#1b5e49]/20 bg-[#f0faf6] py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#1b5e49] transition hover:bg-[#e2f5ec]"
                >
                  Sign in or create account
                </button>
              ) : (
                <Link
                  href="/my-bookings"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 no-underline transition hover:bg-emerald-100"
                >
                  View my bookings <FiArrowRight />
                </Link>
              )}
            </div>
          </aside>
        </div>
      </section>

      <ReusableFormModal
        isOpen={showLoginModal}
        title="Login To Continue Booking"
        onClose={() => setShowLoginModal(false)}
        onSave={handleLoginFromPopup}
        saveLabel={loginLoading ? "Signing In..." : "Login"}
        saveDisabled={loginLoading}
      >
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={loginEmail}
            onChange={(event) => setLoginEmail(event.target.value)}
            className="h-11 w-full rounded-lg border border-black/10 bg-white px-3"
            placeholder="you@example.com"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            value={loginPassword}
            onChange={(event) => setLoginPassword(event.target.value)}
            className="h-11 w-full rounded-lg border border-black/10 bg-white px-3"
            placeholder="Enter password"
          />
        </label>
        {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}
      </ReusableFormModal>
    </div>
  );
}