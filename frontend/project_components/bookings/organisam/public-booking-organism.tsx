"use client";

import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiGrid,
  FiHome,
  FiLogIn,
  FiMapPin,
  FiMoon,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import Link from "next/link";

import { ThemedDatePicker, ThemedSelect } from "@/components";
import AttachmentUploader, { UploadedAttachment } from "@/components/AttachmentUploader";
import { AUTH_CHANGED_EVENT, getValidAuthToken } from "@/lib/auth-token";
import {
  LOGIN_MUTATION,
  VERIFY_LOGIN_OTP_MUTATION,
} from "@/project_components/login/graphql/operations";
import RouteMolecule from "@/project_components/login/molecule/route_molecule";
import { LIST_CITIES_QUERY } from "@/project_components/propertys/graphql/operations";
import { LIST_HMS_QUERY } from "@/project_components/subsites/graphql/operations";

import {
  CREATE_BOOKING_MUTATION,
  MY_RECENT_GUESTS_QUERY,
  SEARCH_AVAILABILITY_QUERY,
} from "../graphql/operations";
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
  floorId?: number | null;
  floorNumber?: number | null;
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

type RecentGuest = {
  id: number;
  fullName: string;
  mobileNumber?: string | null;
  aadhaarAttachmentId?: number | null;
  aadhaarAttachmentUrl?: string | null;
  lastBookingReference?: string | null;
};

type FlowStep = "search" | "inventory" | "guests";
type StayDurationMode = "short_period" | "monthly";
type CommentScope = "pg" | "lodge";
type RoomTypeFilter = "any" | "ac" | "non_ac";

type NewGuestDraft = {
  fullName: string;
  mobileNumber: string;
  aadhaarAttachmentId: number | null;
  aadhaarAttachmentUrl: string;
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
    userRole?: string | null;
  };
};

type AvailabilityResponse = {
  searchAvailability: AvailabilityOption[];
};

type RecentGuestsResponse = {
  myRecentGuests: RecentGuest[];
};

type BuildingGroup = {
  buildingId: number;
  buildingName: string;
  hmsDisplayName: string;
  cityName: string;
  location?: string | null;
  propertyType: 'pg' | 'lodge';
  slots: AvailabilityOption[];
  minPrice: number;
};

type FloorMeta = {
  key: number;
  label: string;
  count: number;
};

type PgRoomGroup = {
  roomKey: number;
  roomId?: number | null;
  roomNumber: string;
  roomType?: string | null;
  beds: AvailabilityOption[];
};

type CitiesResponse = {
  listCities: City[];
};

type HmsRecord = {
  id: number;
  hmsName: string;
  hmsDisplayName: string;
  hmsType: number;
};

type HmsResponse = {
  subsiteBaseDomain?: string;
  listHms: HmsRecord[];
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

function formatRoomTypeLabel(roomType?: string | null): string {
  const normalized = (roomType || "").trim().toLowerCase();
  if (!normalized) return "Lodge room";
  if (normalized === "non_ac") return "Non-AC";
  if (normalized === "ac") return "AC";
  if (normalized === "dorm") return "Dorm";
  if (normalized === "single") return "Single";
  if (normalized === "double") return "Double";
  if (normalized === "deluxe") return "Deluxe";
  return roomType || "Lodge room";
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

const EMPTY_RECENT_GUESTS: RecentGuest[] = [];

function areGuestListsEqual(left: BookingGuest[], right: BookingGuest[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((guest, index) => {
    const other = right[index];
    return (
      guest.fullName === other?.fullName &&
      guest.mobileNumber === other?.mobileNumber &&
      guest.aadhaarAttachmentId === other?.aadhaarAttachmentId
    );
  });
}

type PublicBookingOrganismProps = {
  mode?: "public" | "admin";
  defaultStayDurationMode?: StayDurationMode;
  hideDurationMode?: boolean;
};

export default function PublicBookingOrganism({ mode = "public", defaultStayDurationMode = "short_period", hideDurationMode = false }: PublicBookingOrganismProps) {
  const today = useMemo(() => formatDateInput(new Date()), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [cityId, setCityId] = useState<number | "">("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<"both" | "pg" | "lodge">("both");
  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomTypeFilter>("any");
  const [stayDurationMode, setStayDurationMode] = useState<StayDurationMode>(defaultStayDurationMode);
  const [propertyKeyword, setPropertyKeyword] = useState("");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [guestCount, setGuestCount] = useState(1);
  const [selectedOption, setSelectedOption] = useState<AvailabilityOption | null>(null);
  const [layoutBuilding, setLayoutBuilding] = useState<BuildingGroup | null>(null);
  const [layoutFloor, setLayoutFloor] = useState<number | null>(null);
  const [guests, setGuests] = useState<BookingGuest[]>(makeGuestList(1));
  const [specialRequest, setSpecialRequest] = useState("");
  const [commentScope, setCommentScope] = useState<CommentScope>("lodge");
  const [formError, setFormError] = useState("");
  const [confirmation, setConfirmation] = useState<BookingResponse["createBooking"]["booking"] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return false;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingBookingAfterLogin, setPendingBookingAfterLogin] = useState(false);
  const [loginModalError, setLoginModalError] = useState("");
  const [isSubsiteAutoLocked, setIsSubsiteAutoLocked] = useState(false);
  const [subsiteLabel, setSubsiteLabel] = useState("");
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);
  const [hiddenGuestIds, setHiddenGuestIds] = useState<number[]>([]);
  const [flowStep, setFlowStep] = useState<FlowStep>("search");
  const [customGuestProfiles, setCustomGuestProfiles] = useState<RecentGuest[]>([]);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [newGuestDraft, setNewGuestDraft] = useState<NewGuestDraft>({
    fullName: "",
    mobileNumber: "",
    aadhaarAttachmentId: null,
    aadhaarAttachmentUrl: "",
  });
  const inventoryRef = useRef<HTMLDivElement | null>(null);
  const guestsRef = useRef<HTMLDivElement | null>(null);

  // Sync auth state on mount and on any AUTH_CHANGED_EVENT (login / logout from Header or modal)
  useEffect(() => {
    function sync() {
      setIsAuthenticated(Boolean(getValidAuthToken()));
    }
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!showLoginModal) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setShowLoginModal(false); setLoginModalError(''); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showLoginModal]);

  function closeLoginModal() {
    setShowLoginModal(false);
    setLoginModalError('');
  }

  const { data: cityData } = useQuery<CitiesResponse>(LIST_CITIES_QUERY, {
    variables: { isActive: true },
  });
  const { data: hmsData } = useQuery<HmsResponse>(LIST_HMS_QUERY);
  const [loadAvailability, { data: availabilityData, loading: availabilityLoading }] = useLazyQuery<AvailabilityResponse>(
    SEARCH_AVAILABILITY_QUERY,
    { fetchPolicy: "network-only" },
  );
  const [createBooking, { loading: bookingLoading }] = useMutation<BookingResponse>(CREATE_BOOKING_MUTATION);
  const [loginMutation, { loading: loginLoading }] = useMutation<LoginResponse>(LOGIN_MUTATION);
  const [verifyOtpMutation] = useMutation(VERIFY_LOGIN_OTP_MUTATION);
  const { data: recentGuestsData } = useQuery<RecentGuestsResponse>(MY_RECENT_GUESTS_QUERY, {
    variables: { limit: 8 },
    skip: !isAuthenticated,
    fetchPolicy: "network-only",
  });

  const isPgOnly = propertyTypeFilter === "pg";
  const effectiveCheckIn = checkIn;
  const effectiveCheckOut = stayDurationMode === "monthly" ? addDays(checkIn, 30) : checkOut;
  const nights = stayLength(effectiveCheckIn, effectiveCheckOut);
  const recentGuests = recentGuestsData?.myRecentGuests ?? EMPTY_RECENT_GUESTS;
  const guestPool = useMemo<RecentGuest[]>(() => {
    const source = [...customGuestProfiles, ...recentGuests];
    const unique: RecentGuest[] = [];
    const seen = new Set<string>();
    for (const guest of source) {
      const key = `${(guest.fullName || "").trim().toLowerCase()}::${(guest.mobileNumber || "").trim()}::${guest.aadhaarAttachmentId || 0}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(guest);
    }
    return unique.filter((guest) => !hiddenGuestIds.includes(guest.id));
  }, [customGuestProfiles, hiddenGuestIds, recentGuests]);
  const results = (availabilityData?.searchAvailability || []).filter((item) => item.available);
  const groupedBuildings = useMemo<BuildingGroup[]>(() => {
    const map = new Map<number, BuildingGroup>();
    for (const item of results) {
      const existing = map.get(item.buildingId);
      if (!existing) {
        map.set(item.buildingId, {
          buildingId: item.buildingId,
          buildingName: item.buildingName,
          hmsDisplayName: item.hmsDisplayName,
          cityName: item.cityName,
          location: item.location,
          propertyType: item.propertyType,
          slots: [item],
          minPrice: Number(item.totalAmount || 0),
        });
      } else {
        existing.slots.push(item);
        existing.minPrice = Math.min(existing.minPrice, Number(item.totalAmount || 0));
      }
    }
    return Array.from(map.values()).sort((a, b) => a.minPrice - b.minPrice);
  }, [results]);

  const layoutFloors = useMemo<FloorMeta[]>(() => {
    if (!layoutBuilding) return [];
    const floorMap = new Map<number, FloorMeta>();
    for (const slot of layoutBuilding.slots) {
      const key = slot.floorId ?? slot.floorNumber ?? 0;
      const existing = floorMap.get(key);
      if (!existing) {
        floorMap.set(key, {
          key,
          label: slot.floorNumber !== null && slot.floorNumber !== undefined ? `Floor ${slot.floorNumber}` : "Unassigned",
          count: 1,
        });
      } else {
        existing.count += 1;
      }
    }
    return Array.from(floorMap.values()).sort((a, b) => a.key - b.key);
  }, [layoutBuilding]);

  const layoutVisibleSlots = useMemo<AvailabilityOption[]>(() => {
    if (!layoutBuilding) return [];
    if (layoutFloor === null) return layoutBuilding.slots;
    return layoutBuilding.slots.filter((slot) => (slot.floorId ?? slot.floorNumber ?? 0) === layoutFloor);
  }, [layoutBuilding, layoutFloor]);

  const layoutPgRooms = useMemo<PgRoomGroup[]>(() => {
    if (!layoutBuilding || layoutBuilding.propertyType !== "pg") {
      return [];
    }

    const roomMap = new Map<number, PgRoomGroup>();
    for (const slot of layoutVisibleSlots) {
      if (slot.inventoryType !== "bed") {
        continue;
      }
      const roomKey = slot.roomId ?? slot.bookingTargetId;
      const existing = roomMap.get(roomKey);
      if (!existing) {
        roomMap.set(roomKey, {
          roomKey,
          roomId: slot.roomId,
          roomNumber: slot.roomNumber || `Room ${roomKey}`,
          roomType: slot.roomType,
          beds: [slot],
        });
      } else {
        existing.beds.push(slot);
      }
    }

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    const rooms = Array.from(roomMap.values());
    for (const room of rooms) {
      room.beds.sort((a, b) => collator.compare(a.bedNumber || "", b.bedNumber || ""));
    }
    rooms.sort((a, b) => collator.compare(a.roomNumber, b.roomNumber));
    return rooms;
  }, [layoutBuilding, layoutVisibleSlots]);

  useEffect(() => {
    if (!layoutBuilding) {
      setLayoutFloor(null);
      return;
    }
    const firstFloor = layoutFloors[0]?.key ?? null;
    setLayoutFloor(firstFloor);
  }, [layoutBuilding]);

  useEffect(() => {
    if (flowStep === "inventory") {
      inventoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (flowStep === "guests") {
      guestsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [flowStep]);

  useEffect(() => {
    const selectedProfiles = selectedGuestIds
      .map((id) => guestPool.find((item) => item.id === id))
      .filter(Boolean) as RecentGuest[];

    const nextGuests = makeGuestList(guestCount).map((item, index) => {
      const profile = selectedProfiles[index];
      if (!profile) {
        return item;
      }
      return {
        fullName: profile.fullName || "",
        mobileNumber: profile.mobileNumber || "",
        aadhaarAttachmentId: profile.aadhaarAttachmentId || null,
      };
    });
    setGuests((current) => (areGuestListsEqual(current, nextGuests) ? current : nextGuests));
  }, [guestCount, guestPool, selectedGuestIds]);

  useEffect(() => {
    if (!hmsData || typeof window === "undefined") {
      return;
    }

    const host = window.location.hostname.toLowerCase();
    const baseDomain = (hmsData.subsiteBaseDomain || "").trim().toLowerCase();
    if (!baseDomain || host === "localhost" || host === "127.0.0.1") {
      setIsSubsiteAutoLocked(false);
      setSubsiteLabel("");
      return;
    }

    const suffix = `.${baseDomain}`;
    if (!host.endsWith(suffix)) {
      setIsSubsiteAutoLocked(false);
      setSubsiteLabel("");
      return;
    }

    const leftPart = host.slice(0, -suffix.length);
    const candidateKey = leftPart.split(".")[0]?.trim().toLowerCase();
    if (!candidateKey || candidateKey === "www" || candidateKey === "backend") {
      setIsSubsiteAutoLocked(false);
      setSubsiteLabel("");
      return;
    }

    const matchedSubsite = (hmsData.listHms || []).find((item) => item.hmsName?.toLowerCase() === candidateKey);
    if (!matchedSubsite) {
      setIsSubsiteAutoLocked(false);
      setSubsiteLabel("");
      return;
    }

    setIsSubsiteAutoLocked(true);
    setPropertyKeyword(matchedSubsite.hmsName);
    setPropertyTypeFilter(matchedSubsite.hmsType === 1 ? "lodge" : "pg");
    setSubsiteLabel(matchedSubsite.hmsDisplayName || matchedSubsite.hmsName);
  }, [hmsData]);

  useEffect(() => {
    if (propertyTypeFilter !== "pg") {
      return;
    }
    if (guestCount !== 1) {
      setGuestCount(1);
      setSelectedGuestIds((current) => current.slice(0, 1));
    }
  }, [guestCount, propertyTypeFilter]);

  function handleGuestCountChange(nextCount: number) {
    if (propertyTypeFilter === "pg") {
      setGuestCount(1);
      setSelectedGuestIds((current) => current.slice(0, 1));
      return;
    }
    setGuestCount(nextCount);
    setSelectedGuestIds((current) => current.slice(0, nextCount));
  }

  function validateSearch(): boolean {
    if (!cityId) {
      setFormError("Select a city before searching.");
      return false;
    }
    if (!checkIn) {
      setFormError("Choose a check-in or onboarding date.");
      return false;
    }
    if (stayDurationMode !== "monthly" && !checkOut) {
      setFormError("Choose both check-in and check-out dates.");
      return false;
    }
    if (stayDurationMode !== "monthly" && nights <= 0) {
      setFormError("Check-out must be after check-in.");
      return false;
    }
    if (stayDurationMode !== "monthly" && nights > 31) {
      setFormError("Stay must be less than or equal to 31 days.");
      return false;
    }
    if (checkIn < today) {
      setFormError("Check-in cannot be before today.");
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
    const response = await loadAvailability({
      variables: {
        cityId: Number(cityId),
        checkIn: effectiveCheckIn,
        checkOut: effectiveCheckOut,
        guestCount: isPgOnly ? 1 : guestCount,
        hmsName: propertyKeyword.trim() || null,
        propertyType: propertyTypeFilter === 'both' ? null : propertyTypeFilter,
        roomType: roomTypeFilter === "any" ? null : roomTypeFilter,
      },
    });
    const availableItems = (response.data?.searchAvailability || []).filter((item) => item.available);
    if (availableItems.length > 0) {
      setFlowStep("inventory");
      return;
    }
    setFormError("No available rooms or beds for selected filters. Try another date or city.");
  }

  function openAddGuestModal() {
    setNewGuestDraft({
      fullName: "",
      mobileNumber: "",
      aadhaarAttachmentId: null,
      aadhaarAttachmentUrl: "",
    });
    setShowAddGuestModal(true);
  }

  function handleGuestDraftUpload(attachments: UploadedAttachment[]) {
    const item = attachments[0];
    if (!item) {
      return;
    }
    setNewGuestDraft((current) => ({
      ...current,
      aadhaarAttachmentId: item.id,
      aadhaarAttachmentUrl: item.url,
    }));
  }

  function closeAddGuestModal() {
    setShowAddGuestModal(false);
  }

  function toggleGuestSelection(guestId: number) {
    setFormError("");
    setSelectedGuestIds((current) => {
      if (current.includes(guestId)) {
        return current.filter((id) => id !== guestId);
      }
      if (current.length >= guestCount) {
        setFormError(`You can select only ${guestCount} guest${guestCount === 1 ? "" : "s"}.`);
        return current;
      }
      return [...current, guestId];
    });
  }

  function removeReusableGuest(guestId: number) {
    setHiddenGuestIds((current) => (current.includes(guestId) ? current : [...current, guestId]));
    setCustomGuestProfiles((current) => current.filter((guest) => guest.id !== guestId));
    setSelectedGuestIds((current) => current.filter((id) => id !== guestId));
  }

  function continueToGuestStep() {
    if (!selectedOption) {
      setFormError("Select a room or bed first.");
      return;
    }
    setFormError("");
    setFlowStep("guests");
  }

  function saveNewGuestProfile() {
    if (!newGuestDraft.fullName.trim()) {
      setFormError("Guest full name is required.");
      return;
    }
    if (!isAdminMode && !newGuestDraft.aadhaarAttachmentId) {
      setFormError("Upload Aadhaar proof before saving guest.");
      return;
    }

    const newGuest: RecentGuest = {
      id: Date.now(),
      fullName: newGuestDraft.fullName.trim(),
      mobileNumber: newGuestDraft.mobileNumber.trim(),
      aadhaarAttachmentId: newGuestDraft.aadhaarAttachmentId,
      aadhaarAttachmentUrl: newGuestDraft.aadhaarAttachmentUrl,
      lastBookingReference: "NEW",
    };

    setCustomGuestProfiles((current) => [newGuest, ...current]);
    setSelectedGuestIds((current) => {
      if (current.length >= guestCount) {
        return current;
      }
      return [...current, newGuest.id];
    });
    closeAddGuestModal();
    setFormError("");
  }

  function validateGuestInputs(): boolean {
    for (const [index, guest] of guests.entries()) {
      if (!guest.fullName.trim()) {
        setFormError(`Guest ${index + 1} full name is required.`);
        return false;
      }
      if (!isAdminMode && !guest.aadhaarAttachmentId) {
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
        checkIn: effectiveCheckIn,
        checkOut: effectiveCheckOut,
        guestCount: isPgOnly ? 1 : guestCount,
        paymentMethod: "manual_booking",
        specialRequest: [
          stayDurationMode === "monthly" ? "Booking mode: Monthly stay" : "Booking mode: Short period",
          `Comment scope: ${commentScope === "pg" ? "PG only" : "Lodge only"}`,
          specialRequest.trim(),
        ]
          .filter(Boolean)
          .join(" | "),
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
    setSelectedGuestIds([]);
    setFlowStep("inventory");
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

  type LoginMethod = "password" | "email_otp" | "whatsapp_otp";

  async function handleLoginForModal(
    method: LoginMethod,
    credentials: Record<string, string>,
  ): Promise<{ success: boolean; message?: string }> {
    setLoginModalError("");
    try {
      if (method === "password") {
        const { data } = await loginMutation({
          variables: { method: "password", email: credentials.email, password: credentials.password },
        });
        const result = (data as any)?.login;
        if (result?.success && result.token) {
          localStorage.setItem("authToken", result.token);
          if (result.refreshToken) localStorage.setItem("refreshToken", result.refreshToken);
          if (result.userRole) localStorage.setItem("userRole", result.userRole);
          setIsAuthenticated(true);
          window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
          setShowLoginModal(false);
          if (pendingBookingAfterLogin) {
            setPendingBookingAfterLogin(false);
            if (selectedOption && validateGuestInputs()) await submitBookingRequest();
          }
          return { success: true };
        }
        const msg = result?.message || "Login failed.";
        setLoginModalError(msg);
        return { success: false, message: msg };
      }

      // OTP methods
      if (!credentials.otp) {
        // Step 1: request OTP
        const isEmail = method === "email_otp";
        const { data } = await loginMutation({
          variables: {
            method,
            ...(isEmail ? { email: credentials.identifier } : { mobileNumber: credentials.identifier }),
          },
        });
        const result = (data as any)?.login;
        if (result?.success) return { success: true, message: result.message || "OTP sent" };
        const msg = result?.message || "Failed to send OTP";
        setLoginModalError(msg);
        return { success: false, message: msg };
      }

      // Step 2: verify OTP
      const otpType = method === "email_otp" ? "email" : "whatsapp";
      const { data } = await verifyOtpMutation({
        variables: { identifier: credentials.identifier, otp: credentials.otp, otpType },
      });
      const result = (data as any)?.verifyLoginOtp;
      if (result?.success && result.token) {
        localStorage.setItem("authToken", result.token);
        if (result.refreshToken) localStorage.setItem("refreshToken", result.refreshToken);
        if (result.userRole) localStorage.setItem("userRole", result.userRole);
        setIsAuthenticated(true);
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
        setShowLoginModal(false);
        if (pendingBookingAfterLogin) {
          setPendingBookingAfterLogin(false);
          if (selectedOption && validateGuestInputs()) await submitBookingRequest();
        }
        return { success: true };
      }
      const msg = result?.message || "OTP verification failed";
      setLoginModalError(msg);
      return { success: false, message: msg };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setLoginModalError(msg);
      return { success: false, message: msg };
    }
  }

  const isAdminMode = mode === "admin";
  const shellStyle = { background: "var(--bg-base)", color: "var(--text-primary)" };
  const heroStyle = {
    borderColor: "var(--border)",
    background:
      "radial-gradient(circle at top left, var(--brand-dim), transparent 30%), radial-gradient(circle at top right, var(--action-dim), transparent 28%), linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 52%, var(--bg-base) 100%)",
  };
  const surfaceCardStyle = {
    borderColor: "var(--border)",
    background: "var(--bg-surface)",
    boxShadow: "0 20px 60px -40px rgba(15, 23, 42, 0.45)",
  };
  const elevatedCardStyle = {
    borderColor: "var(--border)",
    background: "var(--bg-elevated)",
  };
  const glassCardStyle = {
    borderColor: "var(--border)",
    background: "var(--bg-glass)",
    boxShadow: "0 30px 100px -45px rgba(15, 23, 42, 0.35)",
  };
  const mutedTextStyle = { color: "var(--text-secondary)" };
  const subtleTextStyle = { color: "var(--text-muted)" };
  const brandButtonStyle = { background: "var(--brand)", color: "#ffffff" };
  const actionButtonStyle = { background: "var(--action)", color: "#ffffff" };
  const chipStyle = { background: "var(--bg-chip)", color: "var(--text-secondary)" };
  const successPanelStyle = {
    borderColor: "rgba(16, 185, 129, 0.28)",
    background: "rgba(16, 185, 129, 0.12)",
  };
  const inputStyle = {
    borderColor: "var(--border)",
    background: "var(--bg-input)",
    color: "var(--text-primary)",
  };

  return (
    <div className="min-h-screen" style={shellStyle}>
      <section className={flowStep === "search" ? "relative overflow-hidden border-b" : "hidden"} style={heroStyle}>
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full blur-3xl" style={{ background: "var(--brand-dim)" }} />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: "var(--action-dim)" }} />
        <div className={`mx-auto grid max-w-7xl gap-10 px-6 py-12 md:px-10 md:py-16 lg:px-12 ${isAdminMode ? "lg:grid-cols-1" : "lg:grid-cols-[1.15fr_0.85fr]"}`}>
          {!isAdminMode ? (
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2" style={{ borderColor: "var(--brand-border)", background: "var(--bg-glass)" }}>
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--brand-light)" }}>Live inventory · Manual approval flow</span>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">
                  Search by lodge or PG, then pick your exact layout slot.
                </h1>
                <p className="max-w-2xl text-base leading-7 md:text-lg" style={mutedTextStyle}>
                  Explore building-wise availability, open a layout model, choose a specific room/bed, and send a manual booking request to the site admin for approval.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]" style={surfaceCardStyle}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={subtleTextStyle}>Step 1</p>
                  <p className="mt-3 text-2xl font-semibold">Search stays</p>
                  <p className="mt-2 text-sm leading-6" style={mutedTextStyle}>Choose your city and travel dates. We'll instantly show all open rooms and PG beds.</p>
                </div>
                <div className="rounded-3xl border p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)]" style={surfaceCardStyle}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={subtleTextStyle}>Step 2</p>
                  <p className="mt-3 text-2xl font-semibold">Verify identity</p>
                  <p className="mt-2 text-sm leading-6" style={mutedTextStyle}>Upload an Aadhaar photo for each guest. Required at check-in — takes under a minute.</p>
                </div>
                <div className="rounded-3xl border p-5 text-white shadow-[0_24px_80px_-36px_rgba(23,54,46,0.7)]" style={{ borderColor: "var(--brand-border)", background: "linear-gradient(135deg, var(--brand), var(--action))" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">Step 3</p>
                  <p className="mt-3 text-2xl font-semibold">Admin approval</p>
                  <p className="mt-2 text-sm leading-6 text-white/80">Your request goes to site admin. They verify details, confirm payment mode offline, then approve or reject.</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[2rem] border p-6 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.35)] backdrop-blur md:p-7" style={glassCardStyle}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={subtleTextStyle}>
                  {isAdminMode ? "Walk-in booking" : "Public search"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{isAdminMode ? "Create booking" : "Book now"}</h2>
              </div>
              <div className="rounded-2xl px-3 py-2 text-right" style={chipStyle}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--action-light)" }}>Night span</p>
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{Math.max(nights, 0)} nights</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isSubsiteAutoLocked ? (
                <div className="space-y-2 text-sm font-medium md:col-span-2" style={{ color: "var(--text-secondary)" }}>
                  <span>Subsite</span>
                  <div className="flex h-12 items-center rounded-2xl border px-4 text-sm" style={{ borderColor: "var(--brand-border)", background: "var(--brand-dim)", color: "var(--text-primary)" }}>
                    {subsiteLabel}
                  </div>
                </div>
              ) : null}
              <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                City
                <ThemedSelect
                  value={cityId}
                  onChange={(value) => setCityId(value ? Number(value) : "")}
                  placeholder="Select city"
                  options={(cityData?.listCities || []).map((city) => ({
                    label: city.cityName,
                    value: city.id,
                  }))}
                />
              </label>
              <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Stay type
                <ThemedSelect
                  value={propertyTypeFilter}
                  onChange={(value) => setPropertyTypeFilter(value as 'both' | 'pg' | 'lodge')}
                  disabled={isSubsiteAutoLocked}
                  options={[
                    { label: "Both (PG + Lodge)", value: "both" },
                    { label: "PG only", value: "pg" },
                    { label: "Lodge only", value: "lodge" },
                  ]}
                />
                {isSubsiteAutoLocked ? (
                  <p className="text-xs" style={subtleTextStyle}>Auto-selected from subsite type.</p>
                ) : null}
              </label>
              {!hideDurationMode && (
              <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Duration mode
                <ThemedSelect
                  value={stayDurationMode}
                  onChange={(value) => setStayDurationMode(value as StayDurationMode)}
                  options={[
                    { label: "Small period", value: "short_period" },
                    { label: "Monthly stay", value: "monthly" },
                  ]}
                />
              </label>
              )}
              <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Room type
                <ThemedSelect
                  value={roomTypeFilter}
                  onChange={(value) => setRoomTypeFilter(value as RoomTypeFilter)}
                  options={[
                    { label: "Any room type", value: "any" },
                    { label: "AC", value: "ac" },
                    { label: "Non-AC", value: "non_ac" },
                  ]}
                />
                <p className="text-xs" style={subtleTextStyle}>Use AC or Non-AC to narrow search results.</p>
              </label>
              <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Guests
                <ThemedSelect
                  value={guestCount}
                  onChange={(value) => handleGuestCountChange(Number(value))}
                  disabled={propertyTypeFilter === "pg"}
                  options={[1, 2, 3, 4].map((value) => ({
                    label: `${value} ${value === 1 ? "guest" : "guests"}`,
                    value,
                  }))}
                />
                {propertyTypeFilter === "pg" ? (
                  <p className="text-xs" style={subtleTextStyle}>PG booking allows 1 guest only.</p>
                ) : null}
              </label>
              {stayDurationMode === "monthly" ? (
                <label className="space-y-2 text-sm font-medium md:col-span-2" style={{ color: "var(--text-secondary)" }}>
                  Joining / onboarding date
                  <ThemedDatePicker
                    value={checkIn}
                    minDate={today}
                    yearStart={currentYear}
                    yearEnd={currentYear + 2}
                    onChange={(nextValue) => {
                      const bounded = nextValue < today ? today : nextValue;
                      setCheckIn(bounded);
                    }}
                    placeholder="DD-MM-YYYY"
                    className="w-full"
                  />
                </label>
              ) : (
                <>
                  <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Check-in
                    <ThemedDatePicker
                      value={checkIn}
                      minDate={today}
                      yearStart={currentYear}
                      yearEnd={currentYear + 2}
                      onChange={(nextValue) => {
                        const bounded = nextValue < today ? today : nextValue;
                        setCheckIn(bounded);
                        if (stayLength(bounded, checkOut) <= 0) {
                          setCheckOut(addDays(bounded, 1));
                        }
                        if (stayLength(bounded, checkOut) > 31) {
                          setCheckOut(addDays(bounded, 31));
                        }
                      }}
                      placeholder="DD-MM-YYYY"
                      className="w-full"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Check-out
                    <ThemedDatePicker
                      value={checkOut}
                      minDate={addDays(checkIn, 1)}
                      yearStart={currentYear}
                      yearEnd={currentYear + 2}
                      onChange={(nextValue) => {
                        if (nextValue <= checkIn) {
                          setCheckOut(addDays(checkIn, 1));
                          return;
                        }
                        if (stayLength(checkIn, nextValue) > 31) {
                          setCheckOut(addDays(checkIn, 31));
                          return;
                        }
                        setCheckOut(nextValue);
                      }}
                      placeholder="DD-MM-YYYY"
                      className="w-full"
                    />
                  </label>
                </>
              )}
            </div>

            <p className="mt-3 text-xs" style={subtleTextStyle}>
              Trip dates: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{formatDateDDMMYYYY(effectiveCheckIn)}</span> to <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{formatDateDDMMYYYY(effectiveCheckOut)}</span>
            </p>

            <button
              onClick={handleSearch}
              disabled={availabilityLoading}
              className="mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-70"
              style={brandButtonStyle}
            >
              {availabilityLoading ? "Searching..." : "Search availability"}
              <FiArrowRight />
            </button>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm" style={mutedTextStyle}>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={chipStyle}><FiCalendar /> {stayDurationMode === "monthly" ? "fixed 30-day monthly block" : "stay under 31 days"}</span>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={chipStyle}><FiShield /> manual admin approval</span>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={chipStyle}><FiShield /> Aadhaar required for public bookings</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12 lg:py-12">
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border px-4 py-3" style={flowStep === "search" ? { borderColor: "var(--brand-border)", background: "var(--brand-dim)" } : surfaceCardStyle}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={subtleTextStyle}>Step 1</p>
            <p className="mt-1 text-sm font-semibold">Search stay</p>
          </div>
          <div className="rounded-2xl border px-4 py-3" style={flowStep === "inventory" ? { borderColor: "var(--brand-border)", background: "var(--brand-dim)" } : surfaceCardStyle}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={subtleTextStyle}>Step 2</p>
            <p className="mt-1 text-sm font-semibold">Choose room or bed</p>
          </div>
          <div className="rounded-2xl border px-4 py-3" style={flowStep === "guests" ? { borderColor: "var(--brand-border)", background: "var(--brand-dim)" } : surfaceCardStyle}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={subtleTextStyle}>Step 3</p>
            <p className="mt-1 text-sm font-semibold">Select guests and submit</p>
          </div>
        </div>

        {flowStep !== "search" ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
            <p className="text-sm font-medium" style={mutedTextStyle}>
              Current flow: {flowStep === "inventory" ? "Choose inventory" : "Select guests and submit"}
            </p>
            <button
              type="button"
              onClick={() => setFlowStep("search")}
              className="rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--bg-elevated)" }}
            >
              Modify search
            </button>
          </div>
        ) : null}

        {formError ? (
          <div className="mb-6 rounded-3xl border px-5 py-4 text-sm" style={{ borderColor: "rgba(239, 68, 68, 0.28)", background: "rgba(239, 68, 68, 0.12)", color: "var(--danger)" }}>
            {formError}
          </div>
        ) : null}

        {confirmation ? (
          <div className="mb-8 rounded-[2rem] border p-6 shadow-[0_20px_60px_-40px_rgba(22,101,52,0.45)]" style={successPanelStyle}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--positive)" }}>
                  <FiCheckCircle /> Booking request submitted
                </p>
                <h3 className="mt-3 text-3xl font-semibold">Reference {confirmation.bookingReference}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6" style={mutedTextStyle}>
                  Request sent to site admin for {confirmation.hmsDisplayName} at {confirmation.buildingName}, {confirmation.cityName}. They will contact you and approve or reject after confirmation.
                </p>
              </div>
              <div className="rounded-3xl px-5 py-4 text-right shadow-sm" style={surfaceCardStyle}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={subtleTextStyle}>Estimated amount</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(confirmation.totalAmount)}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5" ref={inventoryRef}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={subtleTextStyle}>Available inventory</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Results for your trip</h2>
              </div>
              <p className="text-sm" style={subtleTextStyle}>{groupedBuildings.length} building{groupedBuildings.length === 1 ? "" : "s"}</p>
            </div>

            {flowStep === "search" ? (
              <div className="rounded-[2rem] border border-dashed p-8 text-center" style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
                Complete Step 1 and click Search availability. We will auto-jump to available buildings.
              </div>
            ) : null}

            {flowStep !== "search" && groupedBuildings.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed p-8 text-center" style={{ borderColor: "var(--border-strong)", background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
                Search by city and dates to see building-wise availability. Then open layout to select a specific room/bed.
              </div>
            ) : flowStep !== "search" ? (
              <div className="grid gap-5">
                {groupedBuildings.map((group) => {
                  const selectedCount = group.slots.filter(
                    (slot) =>
                      slot.bookingTargetId === selectedOption?.bookingTargetId &&
                      slot.inventoryType === selectedOption?.inventoryType,
                  ).length;
                  return (
                    <article
                      key={`building-${group.buildingId}`}
                      className="overflow-hidden rounded-[2rem] border transition"
                      style={selectedCount > 0 ? { borderColor: "var(--brand)", boxShadow: "0 24px 80px -40px rgba(6, 182, 212, 0.55)" } : { borderColor: "var(--border)", boxShadow: "0 20px 60px -45px rgba(15, 23, 42, 0.45)" }}
                    >
                      <div className="grid gap-0 md:grid-cols-[0.42fr_0.58fr]">
                        <div className="min-h-[220px] p-6 text-white" style={{ background: "linear-gradient(135deg, var(--brand), var(--action))" }}>
                          <div className="flex h-full flex-col justify-between">
                            <div className="space-y-3">
                              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                                {group.propertyType === "lodge" ? "Lodge layout" : "PG layout"}
                              </span>
                              <div>
                                <h3 className="text-3xl font-semibold tracking-[-0.03em]">{group.buildingName}</h3>
                                <p className="mt-2 text-sm text-white/75">{group.hmsDisplayName}</p>
                              </div>
                            </div>
                            <div className="rounded-3xl bg-black/15 p-4 backdrop-blur-sm">
                              <p className="text-xs uppercase tracking-[0.22em] text-white/70">From price</p>
                              <p className="mt-2 text-3xl font-semibold">{formatCurrency(group.minPrice)}</p>
                              <p className="mt-1 text-sm text-white/75">{group.slots.length} available slot{group.slots.length === 1 ? '' : 's'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6" style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}>
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={subtleTextStyle}>Building summary</p>
                              <p className="mt-2 text-2xl font-semibold">
                                {group.cityName}
                              </p>
                              <p className="mt-1 text-sm" style={subtleTextStyle}>{group.propertyType.toUpperCase()} · Pick exact slot from layout</p>
                            </div>
                            <button
                              onClick={() => {
                                setLayoutBuilding(group);
                                const sortedFloors = Array.from(new Set(group.slots.map((slot) => slot.floorId ?? slot.floorNumber ?? 0))).sort((a, b) => a - b);
                                setLayoutFloor(sortedFloors[0] ?? null);
                              }}
                              className="rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition"
                              style={selectedCount > 0 ? brandButtonStyle : { background: "var(--bg-chip)", color: "var(--text-primary)" }}
                            >
                              <span className="inline-flex items-center gap-2"><FiGrid />
                              {selectedCount > 0 ? "Layout selected" : "Open layout"}
                              </span>
                            </button>
                          </div>

                          <div className="mt-5 grid gap-3 text-sm md:grid-cols-2" style={mutedTextStyle}>
                            <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-3" style={elevatedCardStyle}><FiMapPin /> {group.location || group.cityName}</div>
                            <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-3" style={elevatedCardStyle}><FiUsers /> {group.propertyType === 'pg' ? '1 guest per bed' : `${guestCount} guest search`}</div>
                            <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-3" style={elevatedCardStyle}><FiHome /> {group.hmsDisplayName}</div>
                            <div className="inline-flex items-center gap-2 rounded-2xl px-4 py-3" style={elevatedCardStyle}><FiMoon /> {Math.max(nights, 1)} night stay</div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>

          <aside className="space-y-5" ref={guestsRef}>
            <div className="rounded-[2rem] border p-6 shadow-[0_22px_70px_-50px_rgba(15,23,42,0.5)]" style={surfaceCardStyle}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={subtleTextStyle}>Checkout panel</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Complete booking</h2>

              {!isAuthenticated ? (
                <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: "var(--brand-border)", background: "var(--brand-dim)" }}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={brandButtonStyle}>
                      <FiLogIn className="text-sm text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Sign in to complete your booking</p>
                      <p className="mt-1 text-xs leading-5" style={mutedTextStyle}>Browse and select a property first — sign in only when you're ready to confirm.</p>
                      <button
                        type="button"
                        onClick={() => setShowLoginModal(true)}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition"
                        style={brandButtonStyle}
                      >
                        <FiLogIn className="text-xs" />
                        Sign in
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm" style={successPanelStyle}>
                  <FiCheckCircle className="shrink-0" style={{ color: "var(--positive)" }} />
                  <span className="font-medium" style={{ color: "var(--positive)" }}>You're signed in — ready to book.</span>
                </div>
              )}

              {selectedOption ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(135deg, var(--brand), var(--action))" }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Selected inventory</p>
                    <p className="mt-2 text-2xl font-semibold">{selectedOption.buildingName}</p>
                    <p className="mt-1 text-sm text-white/80">{selectedOption.inventoryType === "room" ? `Room ${selectedOption.roomNumber}` : `Bed ${selectedOption.bedNumber} · Room ${selectedOption.roomNumber}`}</p>
                    <p className="mt-4 text-3xl font-semibold">{formatCurrency(selectedOption.totalAmount)}</p>
                    <p className="mt-1 text-sm text-white/75">Manual booking request · Admin approval required</p>
                  </div>

                  {flowStep !== "guests" ? (
                    <div className="rounded-3xl border p-4" style={{ borderColor: "var(--brand-border)", background: "var(--brand-dim)" }}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--brand-light)" }}>Next step</p>
                      <p className="mt-2 text-base font-semibold">Guest details are ready to fill.</p>
                      <p className="mt-1 text-sm leading-6" style={mutedTextStyle}>
                        Continue to guest selection to choose saved guests or create a new one.
                      </p>
                      <button
                        type="button"
                        onClick={continueToGuestStep}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                        style={brandButtonStyle}
                      >
                        Continue to guest details <FiArrowRight />
                      </button>
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    <div className="rounded-3xl border p-4" style={elevatedCardStyle}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={subtleTextStyle}>Select guests</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                          {selectedGuestIds.length} / {guestCount} selected
                        </p>
                      </div>

                      {isAuthenticated ? (
                        <>
                          <div className="mt-3 space-y-2">
                            {guestPool.map((guest) => {
                              const checked = selectedGuestIds.includes(guest.id);
                              const disabled = !checked && selectedGuestIds.length >= guestCount;
                              return (
                                <div
                                  key={`guest-select-${guest.id}`}
                                  className="group flex items-start justify-between gap-3 rounded-xl border px-3 py-3"
                                  style={{
                                    borderColor: checked ? "var(--brand-border)" : "var(--border)",
                                    background: checked ? "var(--brand-dim)" : "var(--bg-surface)",
                                    opacity: disabled ? 0.55 : 1,
                                  }}
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{guest.fullName}</p>
                                    <p className="text-xs" style={subtleTextStyle}>{guest.mobileNumber || "No mobile"}</p>
                                    <p className="text-[11px] font-semibold" style={{ color: guest.aadhaarAttachmentId ? "var(--positive)" : "var(--danger)" }}>
                                      {guest.aadhaarAttachmentId ? "Aadhaar attached" : isAdminMode ? "Aadhaar optional" : "Aadhaar missing"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={disabled}
                                      onClick={() => toggleGuestSelection(guest.id)}
                                      className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                                      style={checked ? brandButtonStyle : { background: "var(--bg-chip)", color: "var(--text-primary)" }}
                                    >
                                      {checked ? "Selected" : "Select"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeReusableGuest(guest.id)}
                                      className="hidden rounded-lg border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] group-hover:inline-flex"
                                      style={{ borderColor: "rgba(239, 68, 68, 0.25)", color: "var(--danger)", background: "rgba(239, 68, 68, 0.08)" }}
                                      aria-label={`Delete ${guest.fullName}`}
                                    >
                                      <FiTrash2 />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => openAddGuestModal()}
                            className="mt-3 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition"
                            style={{ background: "var(--bg-chip)", color: "var(--text-primary)" }}
                          >
                            Add new guest
                          </button>
                        </>
                      ) : (
                        <p className="mt-2 text-sm" style={mutedTextStyle}>Login to choose or create reusable guest profiles.</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      {guests.map((guest, index) => (
                        <div key={`selected-guest-${index}`} className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={subtleTextStyle}>Guest {index + 1}</p>
                          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{guest.fullName || "Not selected"}</p>
                          <p className="text-xs" style={subtleTextStyle}>{guest.mobileNumber || "No mobile"}</p>
                          <p className="mt-1 text-[11px] font-semibold" style={{ color: guest.aadhaarAttachmentId ? "var(--positive)" : "var(--danger)" }}>
                            {guest.aadhaarAttachmentId ? "Aadhaar attached" : isAdminMode ? "Aadhaar optional" : "Aadhaar missing"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Comment scope
                    <ThemedSelect
                      value={commentScope}
                      onChange={(value) => setCommentScope(value as CommentScope)}
                      options={[
                        { label: "PG only", value: "pg" },
                        { label: "Lodge only", value: "lodge" },
                      ]}
                    />
                    <p className="text-xs" style={subtleTextStyle}>Choose where this comment should apply.</p>
                  </label>

                  <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Comments
                    <textarea
                      value={specialRequest}
                      onChange={(event) => setSpecialRequest(event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border px-4 py-3 outline-none transition"
                      style={inputStyle}
                      placeholder="Share contact preference, timing, payment confirmation note, or any preference"
                    />
                  </label>

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-70"
                    style={actionButtonStyle}
                  >
                    {bookingLoading ? "Sending request..." : "Send manual booking request"}
                    <FiArrowRight />
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed p-6 text-sm leading-6" style={{ borderColor: "var(--border-strong)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                  {flowStep === "inventory"
                    ? "Open any building layout and pick an available room/bed to continue to guest step."
                    : "Open any building layout, pick an available room/bed, then complete guest details and send your request."}
                </div>
              )}
            </div>

            {!isAdminMode && (
            <div className="rounded-[2rem] border p-6 shadow-[0_22px_70px_-50px_rgba(15,23,42,0.5)]" style={surfaceCardStyle}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={subtleTextStyle}>Why book with us?</p>
              <div className="mt-4 space-y-4 text-sm leading-6" style={mutedTextStyle}>
                <div className="flex gap-3">
                  <FiUser className="mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>Browse freely without signing in. Log in only when you're ready to confirm a stay.</span>
                </div>
                <div className="flex gap-3">
                  <FiShield className="mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>Requests are approved by site admin in first-approved order for the same room/bed slot.</span>
                </div>
                <div className="flex gap-3">
                  <FiCalendar className="mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>View all your past and upcoming bookings anytime in your personal dashboard.</span>
                </div>
                <div className="flex gap-3">
                  <FiCheckCircle className="mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>Approved, rejected, and cancelled bookings are visible in your booking timeline.</span>
                </div>
              </div>
              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setShowLoginModal(true)}
                  className="mt-5 w-full rounded-2xl border py-3 text-xs font-semibold uppercase tracking-[0.18em] transition"
                  style={{ borderColor: "var(--brand-border)", background: "var(--brand-dim)", color: "var(--brand)" }}
                >
                  Sign in or create account
                </button>
              ) : (
                <Link
                  href="/my-bookings"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-semibold uppercase tracking-[0.18em] no-underline transition"
                  style={{ borderColor: "rgba(16, 185, 129, 0.28)", background: "rgba(16, 185, 129, 0.12)", color: "var(--positive)" }}
                >
                  View my bookings <FiArrowRight />
                </Link>
              )}
            </div>
            )}
          </aside>
        </div>
      </section>

      {layoutBuilding ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLayoutBuilding(null);
            }
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] p-6 shadow-2xl" style={surfaceCardStyle}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={subtleTextStyle}>Building layout</p>
                <h3 className="mt-1 text-2xl font-semibold">{layoutBuilding.buildingName}</h3>
                <p className="mt-1 text-sm" style={subtleTextStyle}>{layoutBuilding.hmsDisplayName} · {layoutBuilding.cityName}</p>
              </div>
              <button
                type="button"
                onClick={() => setLayoutBuilding(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border transition"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              <div className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--brand-border)", background: "var(--brand-dim)", color: "var(--text-secondary)" }}>
                Layout shows only available and active {layoutBuilding.propertyType === 'lodge' ? 'rooms' : 'beds'}.
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {layoutFloors.map((floor) => {
                  return (
                    <button
                      key={`floor-${floor.key}`}
                      type="button"
                      onClick={() => setLayoutFloor(floor.key)}
                      className="rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition"
                      style={layoutFloor === floor.key ? brandButtonStyle : { background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                    >
                      {floor.label} ({floor.count})
                    </button>
                  );
                })}
              </div>

              {layoutBuilding.propertyType === "pg" ? (
                <div className="mt-5 space-y-3">
                  {layoutPgRooms.map((room) => (
                    <div key={`room-${room.roomKey}`} className="rounded-2xl border p-3" style={elevatedCardStyle}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={subtleTextStyle}>Room</p>
                          <p className="text-base font-semibold">{room.roomNumber}</p>
                        </div>
                        <span className="rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: "var(--bg-surface)", color: "var(--text-secondary)" }}>
                          {room.beds.length} bed{room.beds.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:grid-cols-5 lg:grid-cols-6">
                        {room.beds.map((slot) => {
                          const isSelected =
                            selectedOption?.bookingTargetId === slot.bookingTargetId &&
                            selectedOption?.inventoryType === slot.inventoryType;
                          return (
                            <button
                              key={`${slot.inventoryType}-${slot.bookingTargetId}`}
                              type="button"
                              onClick={() => {
                                setSelectedOption(slot);
                                setLayoutBuilding(null);
                                setFlowStep("inventory");
                              }}
                              className="rounded-lg border px-2.5 py-2 text-left transition"
                              style={isSelected ? { borderColor: "var(--brand)", background: "var(--brand-dim)" } : { borderColor: "var(--border)", background: "var(--bg-surface)" }}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={subtleTextStyle}>Bed</p>
                              <p className="mt-0.5 text-xs font-semibold">{slot.bedNumber}</p>
                              <p className="mt-1 text-[11px] font-semibold" style={{ color: "var(--brand)" }}>{formatCurrency(slot.totalAmount)}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {layoutVisibleSlots.map((slot) => {
                    const isSelected =
                      selectedOption?.bookingTargetId === slot.bookingTargetId &&
                      selectedOption?.inventoryType === slot.inventoryType;
                    return (
                      <button
                        key={`${slot.inventoryType}-${slot.bookingTargetId}`}
                        type="button"
                        onClick={() => {
                          setSelectedOption(slot);
                          setLayoutBuilding(null);
                          setFlowStep("inventory");
                        }}
                        className="rounded-2xl border px-3 py-3 text-left transition"
                        style={isSelected ? { borderColor: "var(--brand)", background: "var(--brand-dim)" } : { borderColor: "var(--border)", background: "var(--bg-surface)" }}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={subtleTextStyle}>Room</p>
                        <p className="mt-1 text-lg font-semibold">{slot.roomNumber}</p>
                        <p className="mt-1 text-xs" style={subtleTextStyle}>{formatRoomTypeLabel(slot.roomType)}</p>
                        <p className="mt-2 text-sm font-semibold" style={{ color: "var(--brand)" }}>{formatCurrency(slot.totalAmount)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
              {layoutVisibleSlots.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed px-4 py-5 text-center text-sm" style={{ borderColor: "var(--border-strong)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                  No available slots on this floor for selected dates.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showAddGuestModal && selectedOption ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeAddGuestModal();
            }
          }}
        >
          <div className="w-full max-w-xl rounded-[2rem] border p-6 shadow-2xl" style={surfaceCardStyle}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={subtleTextStyle}>Add new guest</p>
                <h3 className="mt-1 text-2xl font-semibold">Create reusable guest profile</h3>
              </div>
              <button
                type="button"
                onClick={closeAddGuestModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3">
              <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Full name
                <input
                  type="text"
                  value={newGuestDraft.fullName}
                  onChange={(event) => setNewGuestDraft((current) => ({ ...current, fullName: event.target.value }))}
                  className="h-11 w-full rounded-2xl border px-4 outline-none transition"
                  style={inputStyle}
                  placeholder="Guest full name"
                />
              </label>
              <label className="space-y-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Mobile number
                <input
                  type="tel"
                  value={newGuestDraft.mobileNumber}
                  onChange={(event) => setNewGuestDraft((current) => ({ ...current, mobileNumber: event.target.value }))}
                  className="h-11 w-full rounded-2xl border px-4 outline-none transition"
                  style={inputStyle}
                  placeholder="Optional contact number"
                />
              </label>
              <AttachmentUploader
                entityType="booking_guest_aadhaar"
                entityId={0}
                hmsId={selectedOption.hmsId}
                multiple={false}
                accept="image/*,.pdf"
                label={isAdminMode ? "Upload Aadhaar proof (optional)" : "Upload Aadhaar proof"}
                showUploadedList
                onUploadComplete={handleGuestDraftUpload}
                onUploadError={(message) => setFormError(message)}
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeAddGuestModal}
                className="rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveNewGuestProfile}
                className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                style={brandButtonStyle}
              >
                Save and apply
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showLoginModal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          style={{ animation: 'fadeIn 0.18s ease' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeLoginModal(); }}
        >
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
          <div
            className="w-full max-w-md rounded-[2rem] p-6 shadow-2xl"
            style={{ ...surfaceCardStyle, animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Sign in</h2>
                <p className="mt-0.5 text-sm" style={subtleTextStyle}>Choose how you want to continue</p>
              </div>
              <button
                type="button"
                onClick={closeLoginModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl border transition"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-elevated)" }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <RouteMolecule
              onLogin={handleLoginForModal}
              onError={setLoginModalError}
              loading={loginLoading}
              error={loginModalError}
              onClose={closeLoginModal}
              compact
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}