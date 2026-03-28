"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiSlash,
  FiTrendingUp,
  FiUserCheck,
  FiXCircle,
} from "react-icons/fi";

import BookingListView, { BookingListItem } from "../molecule/booking-list-view";
import {
  APPROVE_BOOKING_MUTATION,
  CANCEL_BOOKING_MUTATION,
  CHECK_IN_BOOKING_MUTATION,
  COMPLETE_BOOKING_MUTATION,
  LIST_BOOKINGS_QUERY,
  REJECT_BOOKING_MUTATION,
} from "../graphql/operations";
import { LIST_BUILDINGS_QUERY } from "@/project_components/propertys/graphql/operations";
import { getUserHmsId } from "@/lib/auth-token";
import { GET_USER_PROFILE_QUERY } from "@/project_components/common-routes/graphql/operations";
import { LIST_HMS_QUERY } from "@/project_components/subsites/graphql/operations";

type ViewType =
  | "pending"
  | "today"
  | "noshow"
  | "ongoing"
  | "due_soon"
  | "overstay"
  | "upcoming"
  | "relieved"
  | "cancelled";

type QueryViewType = Exclude<ViewType, "due_soon">;

type BookingResponse = {
  listBookings: BookingListItem[];
};

type BuildingFilterItem = {
  id: number;
  cityName?: string | null;
  name?: string | null;
  propertyType?: string | null;
};

type BuildingFilterResponse = {
  listBuildings: BuildingFilterItem[];
};

type BookingMutationPayload = {
  success?: boolean | null;
  message?: string | null;
};

type ApproveBookingResponse = { approveBooking?: BookingMutationPayload | null };
type RejectBookingResponse = { rejectBooking?: BookingMutationPayload | null };
type CancelBookingResponse = { cancelBooking?: BookingMutationPayload | null };
type CompleteBookingResponse = { completeBooking?: BookingMutationPayload | null };
type CheckInBookingResponse = { checkInBooking?: BookingMutationPayload | null };

type ProfileResponse = {
  getUserProfile?: {
    companyId?: string | null;
  };
};

type HmsItem = {
  id: number;
  hmsDisplayName?: string | null;
  hmsName?: string | null;
  hmsType?: number | null;
};

type HmsListResponse = {
  subsiteBaseDomain?: string | null;
  listHms: HmsItem[];
};

function resolveHostSubsiteKey(hostName: string, baseDomain: string): string | null {
  const host = (hostName || "").trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  if (baseDomain && host.endsWith(`.${baseDomain}`)) {
    const leftPart = host.slice(0, -(`.${baseDomain}`).length);
    const candidate = leftPart.split(".")[0]?.trim().toLowerCase();
    if (!candidate || candidate === "www" || candidate === "backend") {
      return null;
    }
    return candidate;
  }

  const parts = host.split(".").filter(Boolean);
  if (parts.length >= 3) {
    const candidate = parts[0]?.trim().toLowerCase();
    if (!candidate || candidate === "www" || candidate === "backend") {
      return null;
    }
    return candidate;
  }

  return null;
}

const TABS: Array<{ key: ViewType; label: string; icon: React.ReactNode }> = [
  { key: "pending", label: "Booking Requests", icon: <FiClock className="h-4 w-4" /> },
  { key: "today", label: "Today's Check-ins", icon: <FiCalendar className="h-4 w-4" /> },
  { key: "noshow", label: "No Shows", icon: <FiAlertCircle className="h-4 w-4" /> },
  { key: "ongoing", label: "In-House Guests", icon: <FiUserCheck className="h-4 w-4" /> },
  { key: "due_soon", label: "Upcoming Due Dates", icon: <FiCalendar className="h-4 w-4" /> },
  { key: "overstay", label: "Due Overdue", icon: <FiTrendingUp className="h-4 w-4" /> },
  { key: "upcoming", label: "Upcoming Bookings", icon: <FiCheckCircle className="h-4 w-4" /> },
  { key: "relieved", label: "Relieved / Completed", icon: <FiSlash className="h-4 w-4" /> },
  { key: "cancelled", label: "Cancelled / Rejected", icon: <FiXCircle className="h-4 w-4" /> },
];

type Props = {
  initialTab?: ViewType;
  monthlyOnly?: boolean;
};

function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const datePart = value.split("T")[0] || "";
  const [yearRaw, monthRaw, dayRaw] = datePart.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function isMonthlyBooking(booking: BookingListItem): boolean {
  return (booking.specialRequest || "").toLowerCase().includes("booking mode: monthly stay");
}

function canLateCheckIn(booking: BookingListItem): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkOutDate = parseDateOnly(booking.checkOut);
  if (!checkOutDate) {
    return true;
  }
  return checkOutDate >= today;
}

function propertyTypeFromHmsType(hmsType?: number | null): "pg" | "lodge" | null {
  if (hmsType === 2) return "pg";
  if (hmsType === 1) return "lodge";
  return null;
}

export default function AdminBookingsOrganism({ initialTab = "pending", monthlyOnly = false }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ViewType>(initialTab);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedSubsite, setSelectedSubsite] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedPropertyType, setSelectedPropertyType] = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [checkoutModal, setCheckoutModal] = useState<{ open: boolean; bookingReference: string }>({
    open: false,
    bookingReference: "",
  });
  const [extraAmountInput, setExtraAmountInput] = useState("0");

  const storedHmsId = getUserHmsId();
  const { data: profileData } = useQuery<ProfileResponse>(GET_USER_PROFILE_QUERY, {
    fetchPolicy: "cache-first",
  });
  const profileCompanyId = useMemo(() => {
    const raw = profileData?.getUserProfile?.companyId;
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [profileData]);

  const { data: hmsData, loading: hmsLoading } = useQuery<HmsListResponse>(LIST_HMS_QUERY, {
    fetchPolicy: "cache-first",
  });

  const hostName = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
  const baseDomain = (hmsData?.subsiteBaseDomain || "").trim().toLowerCase();
  const configuredBaseDomain = (process.env.NEXT_PUBLIC_BASE_DOMAIN || "").trim().toLowerCase();
  const effectiveBaseDomain = (baseDomain || configuredBaseDomain).trim().toLowerCase();
  const isMainSiteHost = effectiveBaseDomain
    ? hostName === effectiveBaseDomain || hostName === `www.${effectiveBaseDomain}`
    : hostName === "localhost" || hostName === "127.0.0.1";
  const subsiteOptions = useMemo(() => hmsData?.listHms || [], [hmsData]);
  const hostSubsiteKey = useMemo(() => resolveHostSubsiteKey(hostName, effectiveBaseDomain), [hostName, effectiveBaseDomain]);
  const hostMatchedSubsite = useMemo(
    () => subsiteOptions.find((item) => (item.hmsName || "").toLowerCase() === hostSubsiteKey) || null,
    [hostSubsiteKey, subsiteOptions],
  );

  const baseHmsId = storedHmsId ?? profileCompanyId;
  const selectedSubsiteId = selectedSubsite === "all" ? null : Number(selectedSubsite);
  const effectiveHmsId = isMainSiteHost ? selectedSubsiteId : (hostMatchedSubsite?.id ?? baseHmsId);
  const queryView: QueryViewType = activeTab === "due_soon" ? "ongoing" : activeTab;
  const hasCrossSubsiteMismatch =
    !isMainSiteHost &&
    Boolean(hostMatchedSubsite?.id) &&
    Boolean(baseHmsId) &&
    Number(baseHmsId) !== Number(hostMatchedSubsite?.id);

  useEffect(() => {
    if (hmsLoading) return;
    if (hasCrossSubsiteMismatch) {
      router.replace("/");
    }
  }, [hasCrossSubsiteMismatch, hmsLoading, router]);

  useEffect(() => {
    if (!isMainSiteHost) return;
    if (hmsLoading) return;
    if (subsiteOptions.length === 0) return;

    if (selectedSubsite === "all") {
      return;
    }

    const selectedId = Number(selectedSubsite);
    if (!Number.isFinite(selectedId)) {
      setSelectedSubsite("all");
      return;
    }

    if (!subsiteOptions.some((item) => item.id === selectedId)) {
      setSelectedSubsite("all");
    }
  }, [hmsLoading, isMainSiteHost, selectedSubsite, subsiteOptions]);

  useEffect(() => {
    if (!isMainSiteHost) return;
    if (hmsLoading) return;
    if (subsiteOptions.length === 0) return;
    if (selectedSubsite !== "all") return;
    if (baseHmsId && subsiteOptions.some((item) => item.id === baseHmsId)) {
      setSelectedSubsite(String(baseHmsId));
    }
  }, [hmsLoading, isMainSiteHost, selectedSubsite, baseHmsId, subsiteOptions]);

  const selectedHmsRecord = useMemo(() => {
    if (!effectiveHmsId) return null;
    return subsiteOptions.find((item) => item.id === effectiveHmsId) || null;
  }, [effectiveHmsId, subsiteOptions]);

  const lockedPropertyType = useMemo(() => {
    if (isMainSiteHost) return null;
    return propertyTypeFromHmsType(selectedHmsRecord?.hmsType ?? null);
  }, [isMainSiteHost, selectedHmsRecord]);

  const { data, loading, error: listError, refetch } = useQuery<BookingResponse>(LIST_BOOKINGS_QUERY, {
    skip: hasCrossSubsiteMismatch,
    variables: { view: queryView, mine: false, ...(effectiveHmsId ? { hmsId: effectiveHmsId } : {}) },
    fetchPolicy: "network-only",
  });
  const { data: buildingsData } = useQuery<BuildingFilterResponse>(LIST_BUILDINGS_QUERY, {
    skip: hasCrossSubsiteMismatch,
    variables: { ...(effectiveHmsId ? { companyId: effectiveHmsId } : {}), isActive: true },
    fetchPolicy: "cache-first",
  });

  const [approveBooking, { loading: approving }] = useMutation<ApproveBookingResponse>(APPROVE_BOOKING_MUTATION);
  const [rejectBooking, { loading: rejecting }] = useMutation<RejectBookingResponse>(REJECT_BOOKING_MUTATION);
  const [cancelBooking, { loading: cancelling }] = useMutation<CancelBookingResponse>(CANCEL_BOOKING_MUTATION);
  const [completeBooking, { loading: relieving }] = useMutation<CompleteBookingResponse>(COMPLETE_BOOKING_MUTATION);
  const [checkInBooking, { loading: checkingIn }] = useMutation<CheckInBookingResponse>(CHECK_IN_BOOKING_MUTATION);

  const baseBookings = useMemo(() => {
    let source = data?.listBookings || [];

    if (monthlyOnly) {
      source = source.filter((item) => isMonthlyBooking(item));
    }

    if (activeTab === "due_soon") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueLimit = new Date(today);
      dueLimit.setDate(dueLimit.getDate() + 7);

      source = source.filter((item) => {
        const dueDate = parseDateOnly(item.checkOut);
        if (!dueDate) return false;
        return dueDate > today && dueDate <= dueLimit;
      });
    }

    return source;
  }, [activeTab, data, monthlyOnly]);

  const allFilterBuildings = useMemo(() => buildingsData?.listBuildings || [], [buildingsData]);

  const cityOptions = useMemo(() => {
    const names = new Set<string>();
    allFilterBuildings.forEach((item) => {
      const name = (item.cityName || "").trim();
      if (name) names.add(name);
    });
    if (names.size === 0) {
      baseBookings.forEach((item) => {
        const name = (item.cityName || "").trim();
        if (name) names.add(name);
      });
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allFilterBuildings, baseBookings]);

  const propertyTypeOptions = useMemo(() => {
    const values = new Set<string>();
    allFilterBuildings.forEach((item) => {
      const type = (item.propertyType || "").trim().toLowerCase();
      if (type) values.add(type);
    });
    if (values.size === 0) {
      baseBookings.forEach((item) => {
        const type = (item.propertyType || "").trim().toLowerCase();
        if (type) values.add(type);
      });
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [allFilterBuildings, baseBookings]);

  useEffect(() => {
    if (selectedCity !== "all" && !cityOptions.includes(selectedCity)) {
      setSelectedCity("all");
    }
  }, [cityOptions, selectedCity]);

  useEffect(() => {
    if (lockedPropertyType) {
      if (selectedPropertyType !== lockedPropertyType) {
        setSelectedPropertyType(lockedPropertyType);
      }
      return;
    }

    if (selectedPropertyType !== "all" && !propertyTypeOptions.includes(selectedPropertyType)) {
      setSelectedPropertyType("all");
    }
  }, [lockedPropertyType, propertyTypeOptions, selectedPropertyType]);

  const cityAndPropertyFilteredBookings = useMemo(() => {
    return baseBookings.filter((item) => {
      if (selectedCity !== "all" && item.cityName !== selectedCity) {
        return false;
      }
      const itemPropertyType = (item.propertyType || "").trim().toLowerCase();
      if (selectedPropertyType !== "all" && itemPropertyType !== selectedPropertyType) {
        return false;
      }
      return true;
    });
  }, [baseBookings, selectedCity, selectedPropertyType]);

  const buildingOptions = useMemo(() => {
    const names = new Set<string>();
    const filteredBuildings = allFilterBuildings.filter((item) => {
      const cityName = (item.cityName || "").trim();
      const type = (item.propertyType || "").trim().toLowerCase();
      if (selectedCity !== "all" && cityName !== selectedCity) {
        return false;
      }
      if (selectedPropertyType !== "all" && type !== selectedPropertyType) {
        return false;
      }
      return true;
    });
    filteredBuildings.forEach((item) => {
      const name = (item.name || "").trim();
      if (name) names.add(name);
    });

    if (names.size === 0) {
      cityAndPropertyFilteredBookings.forEach((item) => {
        const name = (item.buildingName || "").trim();
        if (name) names.add(name);
      });
    }

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allFilterBuildings, cityAndPropertyFilteredBookings, selectedCity, selectedPropertyType]);

  useEffect(() => {
    if (selectedBuilding !== "all" && !buildingOptions.includes(selectedBuilding)) {
      setSelectedBuilding("all");
    }
  }, [buildingOptions, selectedBuilding]);

  const bookings = useMemo(() => {
    if (selectedBuilding === "all") {
      return cityAndPropertyFilteredBookings;
    }
    return cityAndPropertyFilteredBookings.filter((item) => item.buildingName === selectedBuilding);
  }, [cityAndPropertyFilteredBookings, selectedBuilding]);

  const selectedCityLabel = selectedCity === "all" ? "All Cities" : selectedCity;
  const selectedPropertyTypeLabel =
    selectedPropertyType === "all"
      ? "All Types"
      : selectedPropertyType === "lodge"
        ? "Hostel/Lodge"
        : selectedPropertyType.toUpperCase();
  const selectedSubsiteLabel =
    selectedSubsite === "all"
      ? "All Subsites"
      : (subsiteOptions.find((item) => item.id === Number(selectedSubsite))?.hmsDisplayName ||
         subsiteOptions.find((item) => item.id === Number(selectedSubsite))?.hmsName ||
         "Selected Subsite");
  const selectedBuildingLabel = selectedBuilding === "all" ? "All Buildings" : selectedBuilding;

  async function handleApprove(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await approveBooking({ variables: { bookingReference, ...(effectiveHmsId ? { hmsId: effectiveHmsId } : {}) } });
    const payload = response.data?.approveBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to approve booking request.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Booking approved.");
    await refetch();
  }

  async function handleReject(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await rejectBooking({ variables: { bookingReference, ...(effectiveHmsId ? { hmsId: effectiveHmsId } : {}) } });
    const payload = response.data?.rejectBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to reject booking request.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Booking rejected.");
    await refetch();
  }

  async function handleCancel(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await cancelBooking({ variables: { bookingReference, ...(effectiveHmsId ? { hmsId: effectiveHmsId } : {}) } });
    const payload = response.data?.cancelBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to cancel booking.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Booking cancelled.");
    await refetch();
  }

  async function handleRelieve(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await completeBooking({
      variables: {
        bookingReference,
        ...(effectiveHmsId ? { hmsId: effectiveHmsId } : {}),
        checkoutMode: "normal",
      },
    });
    const payload = response.data?.completeBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to relieve booking.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Guest relieved and booking completed.");
    await refetch();
  }

  async function handleOverdueCheckout() {
    if (!checkoutModal.bookingReference) {
      return;
    }

    const parsedAmount = Number(extraAmountInput || 0);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("Extra amount must be a non-negative number.");
      return;
    }

    setMessage("");
    setError("");
    const response = await completeBooking({
      variables: {
        bookingReference: checkoutModal.bookingReference,
        ...(effectiveHmsId ? { hmsId: effectiveHmsId } : {}),
        checkoutMode: "overstay",
        extraAmount: parsedAmount,
      },
    });
    const payload = response.data?.completeBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to complete due-overdue checkout.");
      await refetch();
      return;
    }

    setCheckoutModal({ open: false, bookingReference: "" });
    setExtraAmountInput("0");
    setMessage(payload.message || "Due-overdue checkout completed.");
    await refetch();
  }

  async function handleCheckIn(bookingReference: string) {
    setMessage("");
    setError("");
    const response = await checkInBooking({ variables: { bookingReference, ...(effectiveHmsId ? { hmsId: effectiveHmsId } : {}) } });
    const payload = response.data?.checkInBooking;
    if (!payload?.success) {
      setError(payload?.message || "Unable to check in guest.");
      await refetch();
      return;
    }
    setMessage(payload.message || "Guest checked in successfully.");
    await refetch();
  }

  function handleDueReminder(booking: BookingListItem) {
    setError("");
    const target = isMonthlyBooking(booking) ? "monthly renewal" : "next due payment";
    setMessage(`Reminder noted for ${booking.bookingReference}: follow up guest for ${target}.`);
  }

  const loadingActions = approving || rejecting || cancelling || relieving || checkingIn;

  const emptyMessage =
    activeTab === "pending"
      ? monthlyOnly
        ? "No monthly stay requests are waiting for approval."
        : "No booking requests are waiting for approval."
      : activeTab === "today"
        ? monthlyOnly
          ? "No monthly stay check-ins scheduled for today."
          : "No check-ins scheduled for today."
        : activeTab === "noshow"
          ? monthlyOnly
            ? "No monthly stay no-shows found."
            : "No no-show bookings found."
          : activeTab === "ongoing"
            ? monthlyOnly
              ? "No monthly stay guests are currently in-house."
              : "No guests are currently in-house."
            : activeTab === "due_soon"
              ? monthlyOnly
                ? "No upcoming monthly due renewals in next 7 days."
                : "No upcoming due dates in next 7 days."
              : activeTab === "overstay"
                ? monthlyOnly
                  ? "No overdue monthly due records found."
                  : "No due-overdue guests found."
                : activeTab === "upcoming"
                  ? monthlyOnly
                    ? "No upcoming monthly stay bookings."
                    : "No upcoming confirmed bookings."
                  : activeTab === "relieved"
                    ? monthlyOnly
                      ? "No relieved/completed monthly stays found."
                      : "No relieved/completed bookings found."
                    : monthlyOnly
                      ? "No cancelled or rejected monthly stays found."
                      : "No cancelled or rejected bookings found.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {listError ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{listError.message}</div> : null}
      {message ? <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {monthlyOnly ? "Admin Side Booking" : "Admin Short-Stay Booking"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-100">
            {monthlyOnly ? "Monthly Stay Console" : "Short-Stay Console"}
          </h1>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {isMainSiteHost ? (
            <label className="min-w-[190px]">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Subsite</span>
              <select
                value={selectedSubsite}
                onChange={(event) => setSelectedSubsite(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-semibold tracking-wide text-slate-200 outline-none"
              >
                <option value="all">All Subsites</option>
                {subsiteOptions.map((subsite) => (
                  <option key={subsite.id} value={String(subsite.id)}>
                    {subsite.hmsDisplayName || subsite.hmsName || `Subsite ${subsite.id}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="min-w-[160px]">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">City</span>
            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-semibold tracking-wide text-slate-200 outline-none"
            >
              <option value="all">All Cities</option>
              {cityOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="min-w-[160px]">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Property Type</span>
            <select
              value={selectedPropertyType}
              onChange={(event) => setSelectedPropertyType(event.target.value)}
              disabled={Boolean(lockedPropertyType)}
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-semibold tracking-wide text-slate-200 outline-none"
            >
              {lockedPropertyType ? (
                <option value={lockedPropertyType}>{lockedPropertyType === "lodge" ? "Hostel/Lodge" : lockedPropertyType.toUpperCase()}</option>
              ) : (
                <>
                  <option value="all">All Types</option>
                  {propertyTypeOptions.map((type) => (
                    <option key={type} value={type}>{type === "lodge" ? "Hostel/Lodge" : type.toUpperCase()}</option>
                  ))}
                </>
              )}
            </select>
          </label>
          <label className="min-w-[180px]">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Building</span>
            <select
              value={selectedBuilding}
              onChange={(event) => setSelectedBuilding(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-semibold tracking-wide text-slate-200 outline-none"
            >
              <option value="all">All Buildings</option>
              {buildingOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 rounded-xl border border-slate-700 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="-mt-2 mb-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">
        {isMainSiteHost ? <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1">{selectedSubsiteLabel}</span> : null}
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1">{selectedCityLabel}</span>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1">{selectedPropertyTypeLabel}</span>
        <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1">{selectedBuildingLabel}</span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
              activeTab === tab.key ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
            style={{ textDecoration: "none" }}
          >
            <span className="shrink-0">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-sm text-slate-300">Loading bookings...</div>
      ) : (
        <BookingListView
          bookings={bookings}
          emptyMessage={emptyMessage}
          actionSlot={
            activeTab === "pending"
              ? (booking) => (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(booking.bookingReference)}
                      disabled={loadingActions}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(booking.bookingReference)}
                      disabled={loadingActions}
                      className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                )
              : activeTab === "today"
                ? (booking) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCheckIn(booking.bookingReference)}
                        disabled={loadingActions}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                      >
                        Check In
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(booking.bookingReference)}
                        disabled={loadingActions}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                : activeTab === "noshow"
                  ? (booking) => (
                      <div className="flex flex-wrap gap-2">
                        {canLateCheckIn(booking) ? (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(booking.bookingReference)}
                            disabled={loadingActions}
                            className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                          >
                            Late Check In
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleCancel(booking.bookingReference)}
                          disabled={loadingActions}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    )
                  : activeTab === "ongoing" || activeTab === "due_soon"
                    ? (booking) => (
                        <div className="flex flex-wrap gap-2">
                          {activeTab === "due_soon" ? (
                            <button
                              type="button"
                              onClick={() => handleDueReminder(booking)}
                              className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                            >
                              Remind Payment
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleRelieve(booking.bookingReference)}
                            disabled={loadingActions}
                            className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                          >
                            Relieve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancel(booking.bookingReference)}
                            disabled={loadingActions}
                            className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      )
                    : activeTab === "overstay"
                      ? (booking) => (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutModal({ open: true, bookingReference: booking.bookingReference });
                                setExtraAmountInput("0");
                              }}
                              disabled={loadingActions}
                              className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                            >
                              Due Checkout
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(booking.bookingReference)}
                              disabled={loadingActions}
                              className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </div>
                        )
                      : activeTab === "upcoming"
                        ? (booking) => (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleCancel(booking.bookingReference)}
                                disabled={loadingActions}
                                className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                          )
                        : undefined
          }
        />
      )}

      {checkoutModal.open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setCheckoutModal({ open: false, bookingReference: "" });
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-slate-100">Due Overdue Checkout</h3>
            <p className="mt-1 text-sm text-slate-400">Add due extra amount, then close booking as checked-out.</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Extra Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={extraAmountInput}
                onChange={(event) => setExtraAmountInput(event.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCheckoutModal({ open: false, bookingReference: "" })}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverdueCheckout}
                className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
              >
                Confirm Checkout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
