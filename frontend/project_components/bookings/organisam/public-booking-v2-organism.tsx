"use client";

import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiHome,
  FiLoader,
  FiLogIn,
  FiMapPin,
  FiMoon,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { ThemedDatePicker, ThemedSelect } from "@/components";
import AttachmentUploader, { UploadedAttachment } from "@/components/AttachmentUploader";
import { AUTH_CHANGED_EVENT, getValidAuthToken } from "@/lib/auth-token";
import { normalizeBackendAssetUrl } from "@/lib/backend-url";
import {
  LOGIN_MUTATION,
  VERIFY_LOGIN_OTP_MUTATION,
} from "@/project_components/login/graphql/operations";
import RouteMolecule from "@/project_components/login/molecule/route_molecule";
import { LIST_CITIES_QUERY } from "@/project_components/propertys/graphql/operations";
import { LIST_HMS_QUERY } from "@/project_components/subsites/graphql/operations";
import styles from "./home-v2.module.css";

import {
  CREATE_BOOKING_MUTATION,
  MY_RECENT_GUESTS_QUERY,
  SEARCH_AVAILABILITY_QUERY,
} from "../graphql/operations";
import { formatDateDDMMYYYY } from "../utils/date";

type AvailabilityOption = {
  inventoryType: "room" | "bed";
  bookingTargetId: number;
  hmsId: number;
  hmsName: string;
  hmsDisplayName: string;
  imageUrl?: string | null;
  galleryImages?: string[] | null;
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
  isActive?: boolean | null;
  inventoryStatus?: string | null;
  isBooked?: boolean | null;
  availabilityState?: string | null;
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
  maxPrice: number;
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

type City = {
  id: number;
  cityName: string;
  state?: string;
  country?: string;
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

function getAvailabilityLabel(slot: AvailabilityOption): string {
  const state = (slot.availabilityState || "").toLowerCase();
  if (state === "available") return "Available";
  if (state === "booked") return "Booked";
  if (state === "maintenance") return "Maintenance";
  if (state === "occupied") return "Occupied";
  if (state === "inactive") return "Disabled";

  if (slot.isBooked) return "Booked";
  if (slot.isActive === false) return "Disabled";
  const inventoryStatus = (slot.inventoryStatus || "").toLowerCase();
  if (inventoryStatus === "maintenance") return "Maintenance";
  if (inventoryStatus === "occupied") return "Occupied";
  return slot.available ? "Available" : "Unavailable";
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

export default function PublicBookingV2Organism({ mode = "public", defaultStayDurationMode = "short_period", hideDurationMode = false }: PublicBookingOrganismProps) {
  const router = useRouter();
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
  const [layoutSelectedRoom, setLayoutSelectedRoom] = useState<PgRoomGroup | null>(null);
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
  const resultsRef = useRef<HTMLElement | null>(null);
  const [isResultsInView, setIsResultsInView] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<Array<{ url: string; label: string }>>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !resultsRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsResultsInView(true);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(resultsRef.current);
    return () => observer.disconnect();
  }, []);

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

  function openGallery(items: Array<{ url: string; label: string }>, startIndex: number) {
    const validItems = items.filter((item) => Boolean(item.url));
    if (validItems.length === 0) {
      return;
    }
    setGalleryItems(validItems);
    setGalleryIndex(Math.max(0, Math.min(startIndex, validItems.length - 1)));
    setIsGalleryModalOpen(true);
  }

  function goPrevGallery() {
    if (!galleryItems.length) return;
    setGalleryIndex((current) => (current - 1 + galleryItems.length) % galleryItems.length);
  }

  function goNextGallery() {
    if (!galleryItems.length) return;
    setGalleryIndex((current) => (current + 1) % galleryItems.length);
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
  const cityCount = cityData?.listCities?.length ?? 0;
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
  const searchInventory = availabilityData?.searchAvailability || [];
  const results = searchInventory.filter((item) => item.available);
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
          maxPrice: Number(item.totalAmount || 0),
        });
      } else {
        existing.slots.push(item);
        existing.minPrice = Math.min(existing.minPrice, Number(item.totalAmount || 0));
        existing.maxPrice = Math.max(existing.maxPrice, Number(item.totalAmount || 0));
      }
    }
    return Array.from(map.values()).sort((a, b) => a.minPrice - b.minPrice);
  }, [results]);

  const layoutBuildingsById = useMemo<Map<number, BuildingGroup>>(() => {
    const map = new Map<number, BuildingGroup>();
    for (const item of searchInventory) {
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
          maxPrice: Number(item.totalAmount || 0),
        });
      } else {
        existing.slots.push(item);
        existing.minPrice = Math.min(existing.minPrice, Number(item.totalAmount || 0));
        existing.maxPrice = Math.max(existing.maxPrice, Number(item.totalAmount || 0));
      }
    }
    return map;
  }, [searchInventory]);

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

  function applyDatePreset(preset: "today" | "tomorrow" | "weekend" | "week") {
    const base = new Date(`${today}T00:00:00`);

    if (preset === "weekend") {
      const offsetToSaturday = (6 - base.getDay() + 7) % 7;
      const start = new Date(base);
      start.setDate(base.getDate() + offsetToSaturday);
      const end = new Date(start);
      end.setDate(start.getDate() + 2);
      setCheckIn(formatDateInput(start));
      setCheckOut(formatDateInput(end));
      return;
    }

    if (preset === "week") {
      const end = new Date(base);
      end.setDate(base.getDate() + 7);
      setCheckIn(today);
      setCheckOut(formatDateInput(end));
      return;
    }

    if (preset === "tomorrow") {
      const start = new Date(base);
      start.setDate(base.getDate() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      setCheckIn(formatDateInput(start));
      setCheckOut(formatDateInput(end));
      return;
    }

    if (preset === "today") {
      const end = new Date(base);
      end.setDate(base.getDate() + 1);
      setCheckIn(today);
      setCheckOut(formatDateInput(end));
      return;
    }
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
      // Wait for hero section to unmount and results to paint, then scroll
      setTimeout(() => {
        inventoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      return;
    }
    setFormError("No available rooms or beds for selected filters. Try another date or city.");
    setTimeout(() => {
      inventoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
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

    // Redirect to my-bookings on success
    if (!isAdminMode) {
      router.push("/my-bookings");
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
  const actionButtonStyle = {
    background: "linear-gradient(135deg, var(--brand), var(--action))",
    color: "#ffffff",
    boxShadow: "0 16px 45px -22px rgba(6, 182, 212, 0.55)",
  };
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
    <div className={styles.pageShell}>
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContainer}>
          <div className={styles.heroText}>
            <p className={styles.heroEyebrow}>Premium Hospitality</p>
            <h1 className={styles.heroHeadline}>
              Discover Your<br />
              <span className={styles.heroHeadlineAccent}>Perfect Stay</span>
            </h1>
            <p className={styles.heroSubline}>
              Handpicked properties across the city — seamless bookings, unforgettable experiences.
            </p>
            <div className={styles.heroTrustRow}>
              <span className={styles.trustBadge}><FiCheckCircle className="h-3 w-3" /> Instant confirmation</span>
              <span className={styles.trustBadge}><FiShield className="h-3 w-3" /> Verified properties</span>
              <span className={styles.trustBadge}><FiUsers className="h-3 w-3" /> 10,000+ guests</span>
            </div>
          </div>
          <div className={styles.searchPanel}>
            <div className={styles.panelHeader}>
              <div className={styles.badgeWalkin}>
                <span className={styles.pulseDot} />
                {isAdminMode ? "Walk-in" : "Book a stay"}
              </div>
              <div className={styles.nightsBadge}>
                <FiMoon className={styles.nightsBadgeIcon} />
                <span className={styles.nightsCount}>{Math.max(nights, 0)}</span>
                <span className={styles.nightsText}>night{Math.max(nights, 0) === 1 ? "" : "s"}</span>
              </div>
            </div>

            <div className={styles.toolbarWrap}>
              {/* Row 1 — Filter selects */}
              <div className={styles.toolbarFilterRow}>
                <ThemedSelect
                  value={cityId}
                  onChange={(value) => setCityId(value ? Number(value) : "")}
                  placeholder="City"
                  leftIcon={<FiMapPin className="h-4 w-4" />}
                  ariaLabel="City"
                  options={(cityData?.listCities || []).map((city) => ({
                    label: city.cityName,
                    value: city.id,
                  }))}
                />

                <ThemedSelect
                  value={propertyTypeFilter}
                  onChange={(value) => setPropertyTypeFilter(value as "both" | "pg" | "lodge")}
                  disabled={isSubsiteAutoLocked}
                  leftIcon={<FiHome className="h-4 w-4" />}
                  ariaLabel="Stay type"
                  options={[
                    { label: "Both", value: "both" },
                    { label: "PG", value: "pg" },
                    { label: "Lodge", value: "lodge" },
                  ]}
                />

                {!hideDurationMode ? (
                  <ThemedSelect
                    value={stayDurationMode}
                    onChange={(value) => setStayDurationMode(value as StayDurationMode)}
                    leftIcon={<FiCalendar className="h-4 w-4" />}
                    ariaLabel="Duration mode"
                    options={[
                      { label: "Short stay", value: "short_period" },
                      { label: "Monthly", value: "monthly" },
                    ]}
                  />
                ) : null}

                <ThemedSelect
                  value={roomTypeFilter}
                  onChange={(value) => setRoomTypeFilter(value as RoomTypeFilter)}
                  leftIcon={<FiGrid className="h-4 w-4" />}
                  ariaLabel="Room type"
                  options={[
                    { label: "Any room", value: "any" },
                    { label: "AC room", value: "ac" },
                    { label: "Non-AC", value: "non_ac" },
                  ]}
                />
              </div>

              {/* Divider */}
              <div className={styles.toolbarDivider} />

              {/* Row 2 — Guest counter + Dates */}
              <div className={styles.toolbarDateRow}>
                {/* Guest counter */}
                <div className={styles.guestCounter}>
                  <button
                    type="button"
                    onClick={() => handleGuestCountChange(Math.max(1, guestCount - 1))}
                    disabled={propertyTypeFilter === "pg" || guestCount <= 1}
                    className={styles.guestBtn}
                    aria-label="Decrease guests"
                  >
                    −
                  </button>
                  <div className={styles.guestDisplay}>
                    <FiUsers className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--brand)" }} />
                    <span className={styles.guestCount}>{guestCount}</span>
                    <span className={styles.guestLabel}>{guestCount === 1 ? "guest" : "guests"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGuestCountChange(Math.min(4, guestCount + 1))}
                    disabled={propertyTypeFilter === "pg" || guestCount >= 4}
                    className={styles.guestBtn}
                    aria-label="Increase guests"
                  >
                    +
                  </button>
                </div>

                {/* Date pickers */}
                {stayDurationMode === "monthly" ? (
                  <div className={styles.datePart}>
                    <ThemedDatePicker
                      value={checkIn}
                      minDate={today}
                      yearStart={currentYear}
                      yearEnd={currentYear + 2}
                      onChange={(nextValue) => {
                        const bounded = nextValue < today ? today : nextValue;
                        setCheckIn(bounded);
                      }}
                      placeholder="Check-in date"
                      className="w-full"
                    />
                  </div>
                ) : (
                  <>
                    <div className={styles.datePart}>
                      <ThemedDatePicker
                        value={checkIn}
                        minDate={today}
                        yearStart={currentYear}
                        yearEnd={currentYear + 2}
                        onChange={(nextValue) => {
                          const bounded = nextValue < today ? today : nextValue;
                          setCheckIn(bounded);
                          if (stayLength(bounded, checkOut) <= 0) setCheckOut(addDays(bounded, 1));
                          if (stayLength(bounded, checkOut) > 31) setCheckOut(addDays(bounded, 31));
                        }}
                        placeholder="Check-in"
                        className="w-full"
                      />
                    </div>
                    <div className={styles.dateArrow}>→</div>
                    <div className={styles.datePart}>
                      <ThemedDatePicker
                        value={checkOut}
                        minDate={addDays(checkIn, 1)}
                        yearStart={currentYear}
                        yearEnd={currentYear + 2}
                        onChange={(nextValue) => {
                          if (nextValue <= checkIn) { setCheckOut(addDays(checkIn, 1)); return; }
                          if (stayLength(checkIn, nextValue) > 31) { setCheckOut(addDays(checkIn, 31)); return; }
                          setCheckOut(nextValue);
                        }}
                        placeholder="Check-out"
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className={styles.searchActions}>
              {stayDurationMode !== "monthly" ? (
                <>
                  <button type="button" onClick={() => applyDatePreset("today")} className={styles.quickFilterChip}>Today</button>
                  <button type="button" onClick={() => applyDatePreset("tomorrow")} className={styles.quickFilterChip}>Tomorrow</button>
                  <button type="button" onClick={() => applyDatePreset("weekend")} className={styles.quickFilterChip}>Weekend</button>
                  <button type="button" onClick={() => applyDatePreset("week")} className={styles.quickFilterChip}>Week</button>
                </>
              ) : null}

              <button
                onClick={handleSearch}
                disabled={availabilityLoading}
                className={styles.submitBtn}
              >
                {availabilityLoading ? (
                  <>
                    <FiLoader className="h-3.5 w-3.5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <FiArrowRight className="h-3.5 w-3.5" />
                    Search
                  </>
                )}
              </button>
            </div>

            <div className={styles.metaWrap}>
              <span className={styles.resultMetaChip}><FiCalendar className="h-3 w-3" /> {formatDateDDMMYYYY(effectiveCheckIn)} → {formatDateDDMMYYYY(effectiveCheckOut)}</span>
              <span className={styles.resultMetaChip}><FiMoon className="h-3 w-3" /> {Math.max(nights, 0)} night{Math.max(nights, 0) === 1 ? "" : "s"}</span>
              {isSubsiteAutoLocked ? (
                <span className={styles.resultMetaChip} style={{ borderColor: "var(--action-border)", color: "var(--action-light)" }}><FiShield className="h-3 w-3" /> Subsite locked</span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section 
        id="results-section" 
        ref={resultsRef}
        className={`${styles.revealSection} ${isResultsInView ? styles.revealSectionActive : ""} mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-10`}
      >
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

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-4" ref={inventoryRef} style={{ scrollMarginTop: "1.5rem" }}>
            {flowStep !== "search" ? (
              <div className={styles.metaWrap}>
                <span className={styles.resultMetaChip}><FiMapPin className="h-3 w-3" /> {formatDateDDMMYYYY(effectiveCheckIn)} → {formatDateDDMMYYYY(effectiveCheckOut)}</span>
                <span className={styles.resultMetaChip}><FiHome className="h-3 w-3" /> {propertyTypeFilter === "both" ? "PG + Lodge" : propertyTypeFilter.toUpperCase()}</span>
                <span className={styles.resultMetaChip}><FiMoon className="h-3 w-3" /> {Math.max(nights, 0)} night{Math.max(nights, 0) === 1 ? "" : "s"}</span>
                <span className={styles.resultMetaChip}><FiUsers className="h-3 w-3" /> {guestCount} guest{guestCount === 1 ? "" : "s"}</span>
                {groupedBuildings.length > 0 ? (
                  <span className={styles.resultMetaChip} style={{ marginLeft: "auto", color: "var(--brand-light)", borderColor: "var(--brand-border)" }}>{groupedBuildings.length} building{groupedBuildings.length === 1 ? "" : "s"}</span>
                ) : null}
              </div>
            ) : null}

            {flowStep === "search" ? (
              <div className="booking-empty-state">
                <div className="booking-empty-icon"><FiArrowRight /></div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Set filters above and hit Search</p>
              </div>
            ) : null}

            {flowStep !== "search" && groupedBuildings.length === 0 ? (
              <div className="booking-empty-state">
                <div className="booking-empty-icon"><FiMapPin /></div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>No matches — try different dates or city</p>
              </div>
            ) : flowStep !== "search" ? (
              <div className="grid gap-5">
                {groupedBuildings.map((group) => {
                  const selectedCount = group.slots.filter(
                    (slot) =>
                      slot.bookingTargetId === selectedOption?.bookingTargetId &&
                      slot.inventoryType === selectedOption?.inventoryType,
                  ).length;
                  const mediaItems = uniqueMediaUrls(group);
                  const hasAnyMedia = mediaItems.some((item) => Boolean(item.url));
                  return (
                    <article
                      key={`building-${group.buildingId}`}
                      className={`${styles.buildingCard} ${selectedCount > 0 ? styles.buildingCardSelected : ""}`}
                    >
                      <div className={styles.cardMedia}>
                        <div className="mb-2 grid grid-cols-2 gap-2 rounded-2xl bg-black/15 p-2">
                          {mediaItems.map((item, idx) => (
                            <button
                              key={`${group.buildingId}-media-${idx}`}
                              type="button"
                              onClick={() => {
                                if (item.url) {
                                  openGallery(mediaItems, idx);
                                }
                              }}
                              className="relative h-16 overflow-hidden rounded-xl border border-white/20 text-left"
                              style={{
                                background: item.url ? "transparent" : "rgba(255,255,255,0.08)",
                                cursor: item.url ? "pointer" : "default",
                              }}
                            >
                              {item.url ? (
                                <img
                                  src={item.url}
                                  alt={`${group.buildingName} ${item.label}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70">
                                  No image
                                </div>
                              )}
                              <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>
                        {!hasAnyMedia ? (
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">Upload building/floor/room/bathroom images from Subsite Dashboard</p>
                        ) : null}
                        <div className={styles.cardMediaContent}>
                          <div className={styles.priceBox}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Room price range</p>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.12em] text-white/60">Min</p>
                                <p className="text-xl font-semibold tracking-tight">{formatCurrency(group.minPrice)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.12em] text-white/60">Max</p>
                                <p className="text-xl font-semibold tracking-tight">{formatCurrency(group.maxPrice)}</p>
                              </div>
                            </div>
                            <p className="mt-1 text-[11px] font-medium text-white/80">{group.slots.length} available slot{group.slots.length === 1 ? '' : 's'}</p>
                          </div>
                        </div>
                      </div>

                      <div className={styles.cardBody}>
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              <span className={styles.mediaBadge} style={{ background: 'var(--brand-dim)', color: 'var(--brand-light)', boxShadow: 'none' }}>
                                {group.propertyType === "lodge" ? "Lodge stay" : "PG stay"}
                              </span>
                            </div>

                            <p className="text-xl font-bold tracking-tight">{group.buildingName}</p>
                            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>{group.hmsDisplayName}</p>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="result-meta-chip">{group.propertyType === "pg" ? "PG" : "Lodge"}</span>
                              <span className="result-meta-chip"><FiGrid className="h-3 w-3" /> {group.slots.length} slot{group.slots.length === 1 ? "" : "s"}</span>
                              <span className="result-meta-chip"><FiMapPin className="h-3 w-3" /> {group.location || group.cityName}</span>
                              <span className="result-meta-chip"><FiUsers className="h-3 w-3" /> {group.propertyType === 'pg' ? '1/bed' : `${guestCount} guests`}</span>
                              {selectedCount > 0 ? (
                                <span className="result-meta-chip" style={{ borderColor: "var(--brand-border)", color: "var(--brand-light)", background: "var(--brand-dim)" }}>
                                  <FiCheckCircle className="h-3 w-3" /> {selectedCount} selected
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{group.cityName}</p>
                          </div>

                          <button
                            onClick={() => {
                              const layoutGroup = layoutBuildingsById.get(group.buildingId) || group;
                              setLayoutBuilding(layoutGroup);
                              const sortedFloors = Array.from(new Set(layoutGroup.slots.map((slot) => slot.floorId ?? slot.floorNumber ?? 0))).sort((a, b) => a - b);
                              setLayoutFloor(sortedFloors[0] ?? null);
                            }}
                            className={`${styles.selectBtn} ${selectedCount > 0 ? styles.selectBtnSelected : ""}`}
                          >
                            <FiGrid className="h-4 w-4" />
                            {selectedCount > 0 ? "Change selection" : "View rooms & beds"}
                            <FiArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>

          <aside className="booking-side-rail space-y-4" ref={guestsRef}>
            <div className="booking-checkout-card rounded-[2rem] border p-5 shadow-[0_22px_70px_-50px_rgba(15,23,42,0.5)]" style={surfaceCardStyle}>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="result-meta-chip"><FiCalendar className="h-3 w-3" /> {formatDateDDMMYYYY(effectiveCheckIn)} → {formatDateDDMMYYYY(effectiveCheckOut)}</span>
                <span className="result-meta-chip"><FiUsers className="h-3 w-3" /> {guestCount} guest{guestCount === 1 ? "" : "s"}</span>
                <span className="result-meta-chip"><FiMoon className="h-3 w-3" /> {Math.max(nights, 0)} night{Math.max(nights, 0) === 1 ? "" : "s"}</span>
                {selectedOption ? (
                  <span className="result-meta-chip" style={{ borderColor: "var(--brand-border)", color: "var(--brand-light)" }}>
                    {selectedOption.inventoryType === "room" ? `Room ${selectedOption.roomNumber}` : `Bed ${selectedOption.bedNumber}`}
                  </span>
                ) : null}
              </div>

              {!isAuthenticated ? (
                <div className="rounded-2xl border p-4" style={{ borderColor: "var(--brand-border)", background: "var(--brand-dim)" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={brandButtonStyle}>
                      <FiLogIn className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">Sign in to book</p>
                      <button
                        type="button"
                        onClick={() => setShowLoginModal(true)}
                        className="mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition"
                        style={brandButtonStyle}
                      >
                        <FiLogIn className="h-3.5 w-3.5" />
                        Sign in
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm" style={successPanelStyle}>
                  <FiCheckCircle className="shrink-0" style={{ color: "var(--positive)" }} />
                  <span className="font-semibold" style={{ color: "var(--positive)" }}>Signed in — ready to book</span>
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

                  <div className="space-y-4">
                    <div className="rounded-3xl border p-4" style={elevatedCardStyle}>
                      <div className="guest-header-row flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={subtleTextStyle}>Select guests</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                            {selectedGuestIds.length} / {guestCount} selected
                          </p>
                          {isAuthenticated ? (
                            <button
                              type="button"
                              onClick={() => openAddGuestModal()}
                              className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition"
                              style={{ background: "var(--bg-chip)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                            >
                              Add guest
                            </button>
                          ) : null}
                        </div>
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
                                  className="group flex cursor-pointer items-start justify-between gap-3 rounded-xl border px-3 py-3 transition"
                                  role="button"
                                  tabIndex={disabled ? -1 : 0}
                                  onClick={() => {
                                    if (disabled) return;
                                    toggleGuestSelection(guest.id);
                                  }}
                                  onKeyDown={(event) => {
                                    if (disabled) return;
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      toggleGuestSelection(guest.id);
                                    }
                                  }}
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
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        if (disabled) return;
                                        toggleGuestSelection(guest.id);
                                      }}
                                      className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
                                      style={checked ? brandButtonStyle : { background: "var(--bg-chip)", color: "var(--text-primary)" }}
                                    >
                                      {checked ? "Selected" : "Select"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        removeReusableGuest(guest.id);
                                      }}
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
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-70"
                    style={actionButtonStyle}
                  >
                    {bookingLoading ? "Submitting..." : "Booking request"}
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

            {!isAdminMode && !isAuthenticated ? (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="w-full rounded-2xl border py-3 text-xs font-semibold uppercase tracking-[0.18em] transition"
                style={{ borderColor: "var(--brand-border)", background: "var(--brand-dim)", color: "var(--brand)" }}
              >
                Sign in or create account
              </button>
            ) : null}


          </aside>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BUILDING LAYOUT MODAL — Building → Floor → Room → Bed
      ═══════════════════════════════════════════════════════════ */}
      {layoutBuilding ? (
        <div
          className={styles.layoutOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLayoutBuilding(null);
              setLayoutSelectedRoom(null);
            }
          }}
        >
          <div className={styles.layoutModal}>

            {/* ── Sticky header: breadcrumb + close ── */}
            <div className={styles.layoutHeader}>
              <nav className={styles.layoutBreadcrumb} aria-label="Location">
                {/* Building crumb */}
                <button
                  type="button"
                  className={styles.breadcrumbBtn}
                  onClick={() => setLayoutSelectedRoom(null)}
                  style={!layoutSelectedRoom ? { color: "var(--brand)", fontWeight: 700, pointerEvents: "none" } : undefined}
                >
                  <FiHome className="h-3.5 w-3.5 shrink-0" />
                  <span className={styles.breadcrumbLabel}>{layoutBuilding.buildingName}</span>
                </button>
                {/* Floor crumb */}
                {layoutFloor !== null ? (
                  <>
                    <FiChevronRight className={styles.breadcrumbSep} />
                    <button
                      type="button"
                      className={styles.breadcrumbBtn}
                      onClick={() => setLayoutSelectedRoom(null)}
                      style={layoutSelectedRoom ? undefined : { color: "var(--brand)", fontWeight: 700, pointerEvents: "none" }}
                    >
                      {layoutFloors.find(f => f.key === layoutFloor)?.label ?? `Floor ${layoutFloor}`}
                    </button>
                  </>
                ) : null}
                {/* Room crumb (PG only) */}
                {layoutSelectedRoom ? (
                  <>
                    <FiChevronRight className={styles.breadcrumbSep} />
                    <span className={styles.breadcrumbCurrent}>Room {layoutSelectedRoom.roomNumber}</span>
                  </>
                ) : null}
              </nav>

              <button
                type="button"
                onClick={() => { setLayoutBuilding(null); setLayoutSelectedRoom(null); }}
                className={styles.layoutCloseBtn}
                aria-label="Close"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* ── Property meta strip ── */}
            <div className={styles.layoutMetaStrip}>
              <div className={styles.layoutMetaLeft}>
                <span className={styles.propTypePill}>
                  {layoutBuilding.propertyType === "lodge" ? "🏨 Lodge" : "🏠 PG"}
                </span>
                <span className={styles.layoutMetaText}>{layoutBuilding.hmsDisplayName}</span>
                <span className={styles.layoutMetaDot}>·</span>
                <span className={styles.layoutMetaText}>{layoutBuilding.cityName}</span>
              </div>
              <span className={styles.availCountPill}>
                {layoutBuilding.slots.filter(s => s.available).length} available
              </span>
            </div>

            {/* ── Scrollable body ── */}
            <div className={styles.layoutBody}>
              <div className={styles.layoutColumns}>

                {/* ── Left column: Floor selector (visual building map) ── */}
                <div className={styles.floorCol}>
                  <p className={styles.colLabel}>
                    <FiHome className="h-3 w-3" /> Floors
                  </p>
                  <div className={styles.floorStack}>
                    {[...layoutFloors].reverse().map((floor) => {
                      const floorSlots = layoutBuilding.slots.filter(
                        s => (s.floorId ?? s.floorNumber ?? 0) === floor.key,
                      );
                      const availCount = floorSlots.filter(s => s.available).length;
                      const total      = floorSlots.length;
                      const pct        = total > 0 ? (availCount / total) * 100 : 0;
                      const isActive   = layoutFloor === floor.key;
                      return (
                        <button
                          key={`fl-${floor.key}`}
                          type="button"
                          onClick={() => { setLayoutFloor(floor.key); setLayoutSelectedRoom(null); }}
                          className={`${styles.floorTile} ${isActive ? styles.floorTileActive : ""}`}
                        >
                          <span className={styles.floorTileName}>{floor.label}</span>
                          <span className={styles.floorTileBar}>
                            <span className={styles.floorTileBarFill} style={{ width: `${pct}%` }} />
                          </span>
                          <span className={styles.floorTileCount}>{availCount}<span className={styles.floorTileOf}>/{total}</span></span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Right column: Inventory grid ── */}
                <div className={styles.inventoryCol}>
                  {layoutBuilding.propertyType === "pg" ? (
                    layoutSelectedRoom ? (
                      /* PG → Beds inside selected room */
                      <>
                        <div className={styles.drillHeader}>
                          <button
                            type="button"
                            className={styles.backChip}
                            onClick={() => setLayoutSelectedRoom(null)}
                          >
                            <FiChevronLeft className="h-3.5 w-3.5" /> Rooms
                          </button>
                          <p className={styles.colLabel}>
                            Room {layoutSelectedRoom.roomNumber}
                            {layoutSelectedRoom.roomType ? ` · ${formatRoomTypeLabel(layoutSelectedRoom.roomType)}` : ""}
                          </p>
                        </div>
                        <div className={styles.slotGrid}>
                          {layoutSelectedRoom.beds.map((slot) => {
                            const isSel     = selectedOption?.bookingTargetId === slot.bookingTargetId && selectedOption?.inventoryType === slot.inventoryType;
                            const isUnavail = !slot.available;
                            const statusLabel = getAvailabilityLabel(slot);
                            const dotClass  = isUnavail
                              ? (statusLabel === "Booked" ? styles.dotBooked : statusLabel === "Maintenance" ? styles.dotMaint : styles.dotUnavail)
                              : styles.dotAvail;
                            return (
                              <button
                                key={`bed-${slot.bookingTargetId}`}
                                type="button"
                                disabled={isUnavail}
                                onClick={() => { if (isUnavail) return; setSelectedOption(slot); setLayoutBuilding(null); setLayoutSelectedRoom(null); }}
                                className={`${styles.slotCard} ${isSel ? styles.slotCardSel : ""} ${isUnavail ? styles.slotCardUnavail : styles.slotCardAvail}`}
                              >
                                {isSel ? <FiCheck className={styles.slotCheckIcon} /> : null}
                                <span className={`${styles.slotDot} ${dotClass}`} />
                                <p className={styles.slotPrimary}>Bed {slot.bedNumber}</p>
                                <p className={`${styles.slotStatusLabel} ${isUnavail ? styles.slotStatusOff : styles.slotStatusOn}`}>{statusLabel}</p>
                                {!isUnavail ? <p className={styles.slotPrice}>{formatCurrency(slot.totalAmount)}</p> : null}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      /* PG → Room cards (click to drill into beds) */
                      <>
                        <p className={styles.colLabel}><FiGrid className="h-3 w-3" /> Rooms — tap to see beds</p>
                        <div className={styles.pgRoomGrid}>
                          {layoutPgRooms.map((room) => {
                            const availBeds = room.beds.filter(b => b.available).length;
                            const total     = room.beds.length;
                            return (
                              <button
                                key={`pgr-${room.roomKey}`}
                                type="button"
                                disabled={availBeds === 0}
                                onClick={() => setLayoutSelectedRoom(room)}
                                className={`${styles.pgRoomCard} ${availBeds === 0 ? styles.pgRoomCardFull : ""}`}
                              >
                                <div className={styles.pgRoomCardTop}>
                                  <div>
                                    <p className={styles.pgRoomSubLabel}>Room</p>
                                    <p className={styles.pgRoomNum}>{room.roomNumber}</p>
                                    {room.roomType ? <p className={styles.pgRoomType}>{formatRoomTypeLabel(room.roomType)}</p> : null}
                                  </div>
                                  <span className={`${styles.pgBedBadge} ${availBeds > 0 ? styles.pgBedBadgeAvail : styles.pgBedBadgeFull}`}>
                                    {availBeds}/{total} beds
                                  </span>
                                </div>
                                <div className={styles.pgBedDotRow}>
                                  {room.beds.map((bed) => (
                                    <span
                                      key={`pdot-${bed.bookingTargetId}`}
                                      className={`${styles.pgBedDot} ${bed.available ? styles.pgBedDotAvail : styles.pgBedDotTaken}`}
                                      title={`Bed ${bed.bedNumber}: ${getAvailabilityLabel(bed)}`}
                                    />
                                  ))}
                                </div>
                                {availBeds > 0 ? (
                                  <div className={styles.pgRoomCta}>
                                    Pick a bed <FiChevronRight className="h-3.5 w-3.5" />
                                  </div>
                                ) : (
                                  <p className={styles.pgRoomFullText}>All beds taken</p>
                                )}
                              </button>
                            );
                          })}
                          {layoutPgRooms.length === 0 ? (
                            <div className={styles.emptySlate}>No rooms on this floor.</div>
                          ) : null}
                        </div>
                      </>
                    )
                  ) : (
                    /* Lodge → Room grid */
                    <>
                      <p className={styles.colLabel}><FiGrid className="h-3 w-3" /> Rooms — tap to select</p>
                      <div className={styles.slotGrid}>
                        {layoutVisibleSlots.map((slot) => {
                          const isSel     = selectedOption?.bookingTargetId === slot.bookingTargetId && selectedOption?.inventoryType === slot.inventoryType;
                          const isUnavail = !slot.available;
                          const statusLabel = getAvailabilityLabel(slot);
                          const dotClass  = isUnavail
                            ? (statusLabel === "Booked" ? styles.dotBooked : statusLabel === "Maintenance" ? styles.dotMaint : styles.dotUnavail)
                            : styles.dotAvail;
                          return (
                            <button
                              key={`lr-${slot.bookingTargetId}`}
                              type="button"
                              disabled={isUnavail}
                              onClick={() => { if (isUnavail) return; setSelectedOption(slot); setLayoutBuilding(null); }}
                              className={`${styles.slotCard} ${isSel ? styles.slotCardSel : ""} ${isUnavail ? styles.slotCardUnavail : styles.slotCardAvail}`}
                            >
                              {isSel ? <FiCheck className={styles.slotCheckIcon} /> : null}
                              <span className={`${styles.slotDot} ${dotClass}`} />
                              <p className={styles.slotPrimary}>{slot.roomNumber}</p>
                              <p className={styles.slotSecondary}>{formatRoomTypeLabel(slot.roomType)}</p>
                              <p className={`${styles.slotStatusLabel} ${isUnavail ? styles.slotStatusOff : styles.slotStatusOn}`}>{statusLabel}</p>
                              {!isUnavail ? <p className={styles.slotPrice}>{formatCurrency(slot.totalAmount)}</p> : null}
                            </button>
                          );
                        })}
                        {layoutVisibleSlots.length === 0 ? (
                          <div className={styles.emptySlate}>No rooms on this floor.</div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Legend ── */}
              <div className={styles.layoutLegend}>
                <span className={styles.legendItem}><span className={`${styles.slotDot} ${styles.dotAvail}`} /> Available</span>
                <span className={styles.legendItem}><span className={`${styles.slotDot} ${styles.dotBooked}`} /> Booked</span>
                <span className={styles.legendItem}><span className={`${styles.slotDot} ${styles.dotMaint}`} /> Maintenance</span>
                <span className={styles.legendItem}><span className={`${styles.slotDot} ${styles.dotUnavail}`} /> Unavailable</span>
              </div>
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
          <div className="add-guest-modal-panel w-full max-w-xl rounded-[2rem] border p-6 shadow-2xl" style={surfaceCardStyle}>
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

            <div className="add-guest-modal-form grid gap-3">
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
                compact
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

      {isGalleryModalOpen && galleryItems.length > 0 ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsGalleryModalOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">
                {galleryItems[galleryIndex]?.label || "Image"} preview
              </p>
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(false)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="relative flex items-center justify-center bg-slate-900 p-3">
              <button
                type="button"
                onClick={goPrevGallery}
                className="absolute left-3 z-10 rounded-full border border-slate-600 bg-slate-900/90 p-2 text-slate-100"
                aria-label="Previous image"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>

              <img
                src={galleryItems[galleryIndex]?.url}
                alt={galleryItems[galleryIndex]?.label || "Preview"}
                className="max-h-[72vh] w-auto max-w-full rounded-lg border border-slate-700 bg-black/20 object-contain"
              />

              <button
                type="button"
                onClick={goNextGallery}
                className="absolute right-3 z-10 rounded-full border border-slate-600 bg-slate-900/90 p-2 text-slate-100"
                aria-label="Next image"
              >
                <FiChevronRight className="h-5 w-5" />
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
            className="w-full max-w-md rounded-[2rem] border p-5 shadow-2xl"
            style={{ ...surfaceCardStyle, animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <div className="mb-4 flex items-center justify-end">
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

function uniqueMediaUrls(group: BuildingGroup): Array<{ url: string; label: string }> {
  const bucket: Record<string, string> = {
    Building: "",
    Floor: "",
    Room: "",
    Bathroom: "",
  };
  const collected: string[] = [];
  for (const slot of group.slots) {
    for (const media of slot.galleryImages || []) {
      if (media) collected.push(media);
    }
    if (slot.imageUrl) {
      collected.push(slot.imageUrl);
    }
  }
  const normalized = Array.from(new Set(collected.filter(Boolean))).map((url) => normalizeBackendAssetUrl(url));

  for (const url of normalized) {
    const lower = url.toLowerCase();
    if (!bucket.Building && lower.includes("/building_image/")) bucket.Building = url;
    else if (!bucket.Floor && lower.includes("/floor_image/")) bucket.Floor = url;
    else if (!bucket.Room && lower.includes("/room_image/")) bucket.Room = url;
    else if (!bucket.Bathroom && lower.includes("/bathroom_image/")) bucket.Bathroom = url;
  }

  const fallbackQueue = normalized.filter((url) => !Object.values(bucket).includes(url));
  if (!bucket.Building && fallbackQueue[0]) bucket.Building = fallbackQueue.shift() || "";
  if (!bucket.Floor && fallbackQueue[0]) bucket.Floor = fallbackQueue.shift() || "";
  if (!bucket.Room && fallbackQueue[0]) bucket.Room = fallbackQueue.shift() || "";
  if (!bucket.Bathroom && fallbackQueue[0]) bucket.Bathroom = fallbackQueue.shift() || "";

  return [
    { label: "Building", url: bucket.Building },
    { label: "Floor", url: bucket.Floor },
    { label: "Room", url: bucket.Room },
    { label: "Bathroom", url: bucket.Bathroom },
  ];
}