'use client';

import React from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { InputBox, PopupToast, ReusableConfirmModal, ReusableFormModal } from '@/components';
import { FiEdit2, FiMapPin, FiPlus, FiSquare, FiTrash2 } from 'react-icons/fi';
import { getUserRole } from '@/lib/auth-token';
import { LIST_HMS_QUERY } from '@/project_components/subsites/graphql/operations';
import {
  CREATE_BED_MUTATION,
  CREATE_BUILDING_MUTATION,
  CREATE_CITY_MUTATION,
  CREATE_FLOOR_MUTATION,
  CREATE_ROOM_MUTATION,
  DELETE_BED_MUTATION,
  DELETE_BUILDING_MUTATION,
  DELETE_FLOOR_MUTATION,
  DELETE_ROOM_MUTATION,
  LIST_BEDS_QUERY,
  LIST_BUILDINGS_QUERY,
  LIST_CITIES_QUERY,
  LIST_FLOORS_QUERY,
  LIST_ROOMS_QUERY,
  UPDATE_BED_MUTATION,
  UPDATE_BUILDING_MUTATION,
  UPDATE_FLOOR_MUTATION,
  UPDATE_ROOM_MUTATION,
} from '../graphql/operations';

type HMSRow = {
  id: number;
  hmsName: string;
  hmsDisplayName: string;
  hmsType: number;
};

type City = { id: number; cityName: string; state?: string; country?: string };
type Building = {
  id: number;
  name: string;
  location?: string;
  cityName?: string;
  propertyType: string;
  isActive: boolean;
};
type Floor = { id: number; floorNumber: number; description?: string; isActive: boolean };
type Room = {
  id: number;
  roomNumber: string;
  roomType: string;
  status: string;
  capacity: number;
  bedCount: number;
  pricePerDay?: number;
  pricePerMonth?: number;
  isActive: boolean;
};
type Bed = { id: number; bedNumber: string; status: string; isActive: boolean };

type Result = { success: boolean; message?: string };

const getMutationResult = (data: unknown): Result | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const firstValue = Object.values(data as Record<string, unknown>)[0];
  if (!firstValue || typeof firstValue !== 'object') {
    return null;
  }

  const maybeResult = firstValue as Partial<Result>;
  if (typeof maybeResult.success !== 'boolean') {
    return null;
  }

  return {
    success: maybeResult.success,
    message: typeof maybeResult.message === 'string' ? maybeResult.message : undefined,
  };
};

export default function SubsiteDashboardOrganism() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedSubsiteId, setSelectedSubsiteId] = React.useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = React.useState<number | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = React.useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = React.useState<number | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = React.useState(false);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = React.useState(false);
  const [isFloorModalOpen, setIsFloorModalOpen] = React.useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = React.useState(false);
  const [isConfirmDeleteBuildingOpen, setIsConfirmDeleteBuildingOpen] = React.useState(false);
  const [isConfirmDeleteEntityOpen, setIsConfirmDeleteEntityOpen] = React.useState(false);
  const [confirmEntityTitle, setConfirmEntityTitle] = React.useState('');
  const [confirmEntityMessage, setConfirmEntityMessage] = React.useState('');
  const [confirmEntityAction, setConfirmEntityAction] = React.useState<null | (() => Promise<void>)>(null);
  const [isBedStatusModalOpen, setIsBedStatusModalOpen] = React.useState(false);
  const [buildingTab, setBuildingTab] = React.useState<'active' | 'disabled'>('active');
  const [floorTab, setFloorTab] = React.useState<'active' | 'disabled'>('active');
  const [roomTab, setRoomTab] = React.useState<'active' | 'disabled'>('active');
  const [bedTab, setBedTab] = React.useState<'active' | 'disabled'>('active');
  const [buildingIdToDelete, setBuildingIdToDelete] = React.useState<number | null>(null);
  const [buildingToEdit, setBuildingToEdit] = React.useState<Building | null>(null);
  const [floorToEdit, setFloorToEdit] = React.useState<Floor | null>(null);
  const [roomToEdit, setRoomToEdit] = React.useState<Room | null>(null);
  const [bedToEdit, setBedToEdit] = React.useState<Bed | null>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [hasAppliedQuerySubsite, setHasAppliedQuerySubsite] = React.useState(false);

  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const [cityForm, setCityForm] = React.useState({ cityName: '', state: '', country: '' });
  const [buildingForm, setBuildingForm] = React.useState({ name: '', location: '', propertyType: 'pg' });
  const [floorForm, setFloorForm] = React.useState({ floorNumber: 1, description: '' });
  const [roomForm, setRoomForm] = React.useState({
    roomNumber: '',
    roomType: 'single',
    status: 'available',
    capacity: 1,
    pricePerDay: '',
    pricePerMonth: '',
  });
  const [bedStatusForm, setBedStatusForm] = React.useState<'available' | 'occupied' | 'maintenance'>('available');

  const { data: hmsData } = useQuery<{ listHms: HMSRow[] }>(LIST_HMS_QUERY);
  const { data: citiesData, refetch: refetchCities } = useQuery<{ listCities: City[] }>(LIST_CITIES_QUERY, {
    variables: { isActive: true },
  });

  const { data: buildingsData, refetch: refetchBuildings } = useQuery<{ listBuildings: Building[] }>(LIST_BUILDINGS_QUERY, {
    variables: { companyId: selectedSubsiteId, cityId: selectedCityId },
    skip: !selectedSubsiteId || !selectedCityId,
  });

  const { data: floorsData, refetch: refetchFloors } = useQuery<{ listFloors: Floor[] }>(LIST_FLOORS_QUERY, {
    variables: { buildingId: selectedBuildingId },
    skip: !selectedBuildingId,
  });

  const { data: roomsData, refetch: refetchRooms } = useQuery<{ listRooms: Room[] }>(LIST_ROOMS_QUERY, {
    variables: { buildingId: selectedBuildingId, floorId: selectedFloorId },
    skip: !selectedBuildingId || !selectedFloorId,
  });

  const { data: bedsData, refetch: refetchBeds } = useQuery<{ listBeds: Bed[] }>(LIST_BEDS_QUERY, {
    variables: { roomId: selectedRoomId },
    skip: !selectedRoomId,
  });

  const [createCity] = useMutation(CREATE_CITY_MUTATION);
  const [createBuilding] = useMutation(CREATE_BUILDING_MUTATION);
  const [updateBuilding] = useMutation(UPDATE_BUILDING_MUTATION);
  const [deleteBuilding] = useMutation(DELETE_BUILDING_MUTATION);

  const [createFloor] = useMutation(CREATE_FLOOR_MUTATION);
  const [updateFloor] = useMutation(UPDATE_FLOOR_MUTATION);
  const [deleteFloor] = useMutation(DELETE_FLOOR_MUTATION);

  const [createRoom] = useMutation(CREATE_ROOM_MUTATION);
  const [updateRoom] = useMutation(UPDATE_ROOM_MUTATION);
  const [deleteRoom] = useMutation(DELETE_ROOM_MUTATION);

  const [createBed] = useMutation(CREATE_BED_MUTATION);
  const [updateBed] = useMutation(UPDATE_BED_MUTATION);
  const [deleteBed] = useMutation(DELETE_BED_MUTATION);

  const querySubsiteId = React.useMemo(() => {
    const raw = searchParams.get('subsiteId');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [searchParams]);

  React.useEffect(() => {
    const role = getUserRole();
    setUserRole(role);
    const allowed = role === 'root_admin' || role === 'site_admin' || role === 'site_building_manager';
    if (!allowed) {
      router.replace('/dashboard');
    }
  }, [router]);

  const showError = (value: unknown) => {
    const text = value instanceof Error ? value.message : 'Operation failed';
    setError(text);
  };

  const resetLevelsBelow = (level: 'subsite' | 'city' | 'building' | 'floor' | 'room') => {
    if (level === 'subsite') {
      setSelectedCityId(null);
      setSelectedBuildingId(null);
      setSelectedFloorId(null);
      setSelectedRoomId(null);
      return;
    }
    if (level === 'city') {
      setSelectedBuildingId(null);
      setSelectedFloorId(null);
      setSelectedRoomId(null);
      return;
    }
    if (level === 'building') {
      setSelectedFloorId(null);
      setSelectedRoomId(null);
      return;
    }
    if (level === 'floor') {
      setSelectedRoomId(null);
    }
  };

  const runAndToast = async (action: Promise<{ data?: unknown }>, successText: string, after?: () => Promise<unknown> | unknown) => {
    setError('');
    setMessage('');
    try {
      const result = await action;
      const payload = getMutationResult(result?.data);
      if (payload && payload.success === false) {
        setError(payload.message || 'Operation failed');
        return;
      }
      setMessage(payload?.message || successText);
      if (after) {
        await after();
      }
    } catch (e) {
      showError(e);
    }
  };

  const onCreateCity = async () => {
    setError('');
    setMessage('');

    if (!cityForm.cityName.trim()) {
      setError('City name is required');
      return;
    }

    try {
      const result = await createCity({
        variables: {
          cityName: cityForm.cityName.trim(),
          state: cityForm.state.trim() || null,
          country: cityForm.country.trim() || null,
          isActive: true,
        },
      });

      const payload = result.data?.createCity;
      if (!payload?.success) {
        setError(payload?.message || 'Operation failed');
        return;
      }

      await refetchCities();
      const newCityId = payload.city?.id;
      if (typeof newCityId === 'number') {
        setSelectedCityId(newCityId);
        resetLevelsBelow('city');
      }
      setCityForm({ cityName: '', state: '', country: '' });
      setIsCityModalOpen(false);
      setMessage(payload.message || 'City created');
    } catch (e) {
      showError(e);
    }
  };

  const onCreateBuilding = async () => {
    if (!selectedSubsiteId || !selectedCityId) {
      setError('Select subsite and city first');
      return;
    }

    if (!buildingForm.name.trim()) {
      setError('Building name is required');
      return;
    }

    setError('');
    setMessage('');
    try {
      const result = await createBuilding({
        variables: {
          companyId: selectedSubsiteId,
          cityId: selectedCityId,
          name: buildingForm.name.trim(),
          location: buildingForm.location.trim() || null,
          propertyType: buildingForm.propertyType,
          isActive: true,
        },
      });

      const payload = result.data?.createBuilding;
      if (!payload?.success) {
        setError(payload?.message || 'Operation failed');
        return;
      }

      await refetchBuildings();
      const newBuildingId = payload.building?.id;
      if (typeof newBuildingId === 'number') {
        setSelectedBuildingId(newBuildingId);
        resetLevelsBelow('building');
      }
      setBuildingForm({ name: '', location: '', propertyType: 'pg' });
      setIsBuildingModalOpen(false);
      setMessage(payload.message || 'Building created');
    } catch (e) {
      showError(e);
    }
  };

  const onSaveBuilding = async () => {
    if (buildingToEdit) {
      await onUpdateBuilding();
      return;
    }
    await onCreateBuilding();
  };

  const onDeleteBuilding = async (buildingId: number) => {
    await runAndToast(deleteBuilding({ variables: { buildingId } }), 'Building deleted', async () => {
      await refetchBuildings();
      resetLevelsBelow('city');
      if (selectedBuildingId === buildingId) {
        setSelectedBuildingId(null);
      }
    });
  };

  const onDisableBuilding = async (buildingId: number) => {
    await runAndToast(updateBuilding({ variables: { buildingId, isActive: false } }), 'Building disabled', async () => {
      await refetchBuildings();
      if (selectedBuildingId === buildingId) {
        setSelectedBuildingId(null);
        resetLevelsBelow('city');
      }
    });
  };

  const onEnableBuilding = async (buildingId: number) => {
    await runAndToast(updateBuilding({ variables: { buildingId, isActive: true } }), 'Building enabled', async () => {
      await refetchBuildings();
    });
  };

  const requestDeleteBuilding = (buildingId: number) => {
    setBuildingIdToDelete(buildingId);
    setIsConfirmDeleteBuildingOpen(true);
  };

  const confirmDeleteBuilding = async () => {
    if (!buildingIdToDelete) {
      setIsConfirmDeleteBuildingOpen(false);
      return;
    }
    await onDeleteBuilding(buildingIdToDelete);
    setBuildingIdToDelete(null);
    setIsConfirmDeleteBuildingOpen(false);
  };

  const onOpenEditBuilding = (building: Building) => {
    setBuildingToEdit(building);
    setBuildingForm({
      name: building.name,
      location: building.location || '',
      propertyType: building.propertyType || 'pg',
    });
    setIsBuildingModalOpen(true);
  };

  const onUpdateBuilding = async () => {
    if (!buildingToEdit) {
      return;
    }
    if (!buildingForm.name.trim()) {
      setError('Building name is required');
      return;
    }

    setError('');
    setMessage('');
    try {
      const result = await updateBuilding({
        variables: {
          buildingId: buildingToEdit.id,
          name: buildingForm.name.trim(),
          location: buildingForm.location.trim() || null,
          propertyType: buildingForm.propertyType,
        },
      });

      const payload = result.data?.updateBuilding;
      if (!payload?.success) {
        setError(payload?.message || 'Operation failed');
        return;
      }

      await refetchBuildings();
      setIsBuildingModalOpen(false);
      setBuildingToEdit(null);
      setBuildingForm({ name: '', location: '', propertyType: 'pg' });
      setMessage(payload.message || 'Building updated');
    } catch (e) {
      showError(e);
    }
  };

  const onCreateFloor = async () => {
    if (!selectedBuildingId) {
      setError('Select building first');
      return;
    }
    await runAndToast(
      createFloor({
        variables: {
          buildingId: selectedBuildingId,
          floorNumber: Number(floorForm.floorNumber),
          description: floorForm.description,
          isActive: true,
        },
      }),
      'Floor created',
      async () => {
        await refetchFloors();
        setFloorForm({ floorNumber: 1, description: '' });
        setIsFloorModalOpen(false);
      },
    );
  };

  const onUpdateFloor = async (floor: Floor) => {
    setFloorToEdit(floor);
    setFloorForm({ floorNumber: floor.floorNumber, description: floor.description || '' });
    setIsFloorModalOpen(true);
  };

  const onSaveFloor = async () => {
    if (!floorToEdit) {
      await onCreateFloor();
      return;
    }

    await runAndToast(
      updateFloor({ variables: { floorId: floorToEdit.id, floorNumber: Number(floorForm.floorNumber), description: floorForm.description } }),
      'Floor updated',
      async () => {
        await refetchFloors();
        setIsFloorModalOpen(false);
        setFloorToEdit(null);
        setFloorForm({ floorNumber: 1, description: '' });
      },
    );
  };

  const onDeleteFloor = async (floorId: number) => {
    await runAndToast(deleteFloor({ variables: { floorId } }), 'Floor deleted', async () => {
      await refetchFloors();
      resetLevelsBelow('building');
    });
  };

  const requestDeleteFloor = (floorId: number) => {
    setConfirmEntityTitle('Delete Floor');
    setConfirmEntityMessage('Are you sure you want to delete this floor?');
    setConfirmEntityAction(() => async () => {
      await onDeleteFloor(floorId);
    });
    setIsConfirmDeleteEntityOpen(true);
  };

  const onDisableFloor = async (floorId: number) => {
    await runAndToast(updateFloor({ variables: { floorId, isActive: false } }), 'Floor disabled', async () => {
      await refetchFloors();
      if (selectedFloorId === floorId) {
        setSelectedFloorId(null);
        resetLevelsBelow('building');
      }
    });
  };

  const onEnableFloor = async (floorId: number) => {
    await runAndToast(updateFloor({ variables: { floorId, isActive: true } }), 'Floor enabled', async () => {
      await refetchFloors();
    });
  };

  const onCreateRoom = async () => {
    if (!selectedBuildingId || !selectedFloorId) {
      setError('Select building and floor first');
      return;
    }

    if (!selectedBuilding) {
      setError('Select building first');
      return;
    }

    if (!roomForm.roomNumber.trim()) {
      setError('Room number is required');
      return;
    }

    const isPg = selectedBuilding.propertyType === 'pg';
    if (isPg && Number(roomForm.capacity) <= 0) {
      setError('Capacity must be greater than zero for PG');
      return;
    }

    await runAndToast(
      createRoom({
        variables: {
          buildingId: selectedBuildingId,
          floorId: selectedFloorId,
          roomNumber: roomForm.roomNumber.trim(),
          roomType: isPg ? 'dorm' : roomForm.roomType,
          status: isPg ? undefined : roomForm.status,
          capacity: isPg ? Number(roomForm.capacity) : 0,
          pricePerDay: roomForm.pricePerDay ? Number(roomForm.pricePerDay) : null,
          pricePerMonth: roomForm.pricePerMonth ? Number(roomForm.pricePerMonth) : null,
          isActive: true,
        },
      }),
      'Room created',
      async () => {
        await refetchRooms();
        setRoomForm({
          roomNumber: '',
          roomType: 'single',
          status: 'available',
          capacity: 1,
          pricePerDay: '',
          pricePerMonth: '',
        });
        setIsRoomModalOpen(false);
      },
    );
  };

  const onUpdateRoom = async (room: Room) => {
    setRoomToEdit(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      status: room.status,
      capacity: room.capacity,
      pricePerDay: room.pricePerDay?.toString() || '',
      pricePerMonth: room.pricePerMonth?.toString() || '',
    });
    setIsRoomModalOpen(true);
  };

  const onSaveRoom = async () => {
    if (!roomToEdit) {
      await onCreateRoom();
      return;
    }
    if (!roomForm.roomNumber.trim()) {
      setError('Room number is required');
      return;
    }

    if (!selectedBuilding) {
      setError('Select building first');
      return;
    }

    const isPg = selectedBuilding.propertyType === 'pg';
    if (isPg && Number(roomForm.capacity) <= 0) {
      setError('Capacity must be greater than zero for PG');
      return;
    }

    await runAndToast(
      updateRoom({
        variables: {
          roomId: roomToEdit.id,
          roomNumber: roomForm.roomNumber.trim(),
          roomType: isPg ? 'dorm' : roomForm.roomType,
          status: isPg ? undefined : roomForm.status,
          capacity: isPg ? Number(roomForm.capacity) : 0,
          pricePerDay: roomForm.pricePerDay ? Number(roomForm.pricePerDay) : null,
          pricePerMonth: roomForm.pricePerMonth ? Number(roomForm.pricePerMonth) : null,
        },
      }),
      'Room updated',
      async () => {
        await refetchRooms();
        setIsRoomModalOpen(false);
        setRoomToEdit(null);
        setRoomForm({
          roomNumber: '',
          roomType: 'single',
          status: 'available',
          capacity: 1,
          pricePerDay: '',
          pricePerMonth: '',
        });
      },
    );
  };

  const onDeleteRoom = async (roomId: number) => {
    await runAndToast(deleteRoom({ variables: { roomId } }), 'Room deleted', async () => {
      await refetchRooms();
      resetLevelsBelow('floor');
    });
  };

  const requestDeleteRoom = (roomId: number) => {
    setConfirmEntityTitle('Delete Room');
    setConfirmEntityMessage('Are you sure you want to delete this room?');
    setConfirmEntityAction(() => async () => {
      await onDeleteRoom(roomId);
    });
    setIsConfirmDeleteEntityOpen(true);
  };

  const onDisableRoom = async (roomId: number) => {
    await runAndToast(updateRoom({ variables: { roomId, isActive: false } }), 'Room disabled', async () => {
      await refetchRooms();
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
      }
    });
  };

  const onEnableRoom = async (roomId: number) => {
    await runAndToast(updateRoom({ variables: { roomId, isActive: true } }), 'Room enabled', async () => {
      await refetchRooms();
    });
  };

  const onCreateBed = async () => {
    if (!selectedRoomId) {
      setError('Select room first');
      return;
    }

    const maxNo = beds.reduce((max, bed) => {
      const parsed = Number((bed.bedNumber || '').replace(/[^0-9]/g, ''));
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);
    const nextBedNumber = `B${maxNo + 1}`;

    await runAndToast(
      createBed({ variables: { roomId: selectedRoomId, bedNumber: nextBedNumber, status: 'available', isActive: true } }),
      'Bed added',
      async () => {
        await refetchBeds();
        await refetchRooms();
      },
    );
  };

  const onOpenBedStatusModal = (bed: Bed) => {
    setBedToEdit(bed);
    setBedStatusForm(bed.status === 'occupied' ? 'occupied' : bed.status === 'maintenance' ? 'maintenance' : 'available');
    setIsBedStatusModalOpen(true);
  };

  const onSaveBedStatus = async () => {
    if (!bedToEdit) {
      return;
    }
    await runAndToast(
      updateBed({ variables: { bedId: bedToEdit.id, status: bedStatusForm } }),
      'Bed updated',
      async () => {
        await refetchBeds();
        setIsBedStatusModalOpen(false);
        setBedToEdit(null);
      },
    );
  };

  const onDisableBed = async (bedId: number) => {
    await runAndToast(updateBed({ variables: { bedId, isActive: false } }), 'Bed disabled', async () => {
      await refetchBeds();
    });
  };

  const onEnableBed = async (bedId: number) => {
    await runAndToast(updateBed({ variables: { bedId, isActive: true } }), 'Bed enabled', async () => {
      await refetchBeds();
    });
  };

  const onDeleteBed = async (bedId: number) => {
    await runAndToast(deleteBed({ variables: { bedId } }), 'Bed deleted', async () => {
      await refetchBeds();
      await refetchRooms();
    });
  };

  const requestDeleteBed = (bedId: number) => {
    setConfirmEntityTitle('Delete Bed');
    setConfirmEntityMessage('Are you sure you want to delete this bed?');
    setConfirmEntityAction(() => async () => {
      await onDeleteBed(bedId);
    });
    setIsConfirmDeleteEntityOpen(true);
  };

  const confirmDeleteEntity = async () => {
    if (!confirmEntityAction) {
      setIsConfirmDeleteEntityOpen(false);
      return;
    }
    await confirmEntityAction();
    setIsConfirmDeleteEntityOpen(false);
    setConfirmEntityAction(null);
  };

  const allBuildings = buildingsData?.listBuildings || [];
  const allFloors = floorsData?.listFloors || [];
  const allRooms = roomsData?.listRooms || [];
  const allBeds = bedsData?.listBeds || [];
  const buildings = allBuildings.filter((item) => item.isActive === (buildingTab === 'active'));
  const floors = allFloors.filter((item) => item.isActive === (floorTab === 'active'));
  const rooms = allRooms.filter((item) => item.isActive === (roomTab === 'active'));
  const beds = allBeds.filter((item) => item.isActive === (bedTab === 'active'));
  const selectedBuilding = allBuildings.find((item) => item.id === selectedBuildingId);
  const isBedSupported = selectedBuilding?.propertyType === 'pg';
  const selectedSubsite = (hmsData?.listHms || []).find((item) => item.id === selectedSubsiteId);
  const availableSubsites = hmsData?.listHms || [];
  const isSingleUserSubsite = availableSubsites.length === 1 && userRole === 'site_admin';
  const isSubsiteAutoLocked = isSingleUserSubsite || (querySubsiteId && selectedSubsiteId === querySubsiteId);
  const hideCityAndBuildingActions = isSubsiteAutoLocked || userRole === 'site_admin';

  React.useEffect(() => {
    if (hasAppliedQuerySubsite) {
      return;
    }

    const subsites = hmsData?.listHms || [];
    const singleSubsite = subsites.length === 1;

    // If only 1 subsite available (site_admin case), auto-select it
    if (singleSubsite && subsites[0]) {
      setSelectedSubsiteId(subsites[0].id);
      resetLevelsBelow('subsite');
      setHasAppliedQuerySubsite(true);
      return;
    }

    // If query param provided (from internal deep link), use it
    if (!querySubsiteId) {
      return;
    }

    const exists = subsites.some((item) => item.id === querySubsiteId);
    if (!exists) {
      return;
    }

    setSelectedSubsiteId(querySubsiteId);
    resetLevelsBelow('subsite');
    setHasAppliedQuerySubsite(true);
  }, [hasAppliedQuerySubsite, hmsData, querySubsiteId]);

  React.useEffect(() => {
    if (selectedBuilding && selectedBuilding.propertyType !== 'pg') {
      setSelectedRoomId(null);
    }
  }, [selectedBuilding]);

  return (
    <div className="min-h-screen p-3 md:p-6" style={{ background: 'var(--bg-base)' }}>
      <PopupToast message={error || message} variant={error ? 'error' : 'success'} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl p-4 md:p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Subsite Property Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Flow: Subsite -&gt; City -&gt; Building -&gt; Floor -&gt; Room -&gt; Bed
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Select Subsite</label>
              <select
                value={selectedSubsiteId || ''}
                disabled={isSubsiteAutoLocked}
                onChange={(e) => {
                  setSelectedSubsiteId(e.target.value ? Number(e.target.value) : null);
                  resetLevelsBelow('subsite');
                }}
                className="w-full h-12 rounded-xl px-3"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', opacity: isSubsiteAutoLocked ? 0.7 : 1 }}
              >
                <option value="">Choose Subsite</option>
                {(hmsData?.listHms || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.hmsDisplayName || item.hmsName}
                  </option>
                ))}
              </select>
              {selectedSubsite ? (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Selected Type: {selectedSubsite.hmsType === 1 ? 'Lodge' : 'PG'}
                </p>
              ) : null}
              {isSubsiteAutoLocked ? (
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isSingleUserSubsite ? 'Your assigned subsite • Selection locked' : 'Subsite locked from deep link'}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Select City</label>
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedCityId || ''}
                  onChange={(e) => {
                    setSelectedCityId(e.target.value ? Number(e.target.value) : null);
                    resetLevelsBelow('city');
                  }}
                  className="w-full h-12 rounded-xl px-3"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">Choose City</option>
                  {(citiesData?.listCities || []).map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.cityName} {city.state ? `(${city.state})` : ''}
                    </option>
                  ))}
                </select>
                {!hideCityAndBuildingActions ? (
                  <button
                    type="button"
                    onClick={() => setIsCityModalOpen(true)}
                    className="h-12 px-3 rounded-xl inline-flex items-center gap-1"
                    style={{ background: 'var(--brand-dim)', color: 'var(--brand-light)', border: '1px solid var(--brand-border)' }}
                    aria-label="Create city"
                  >
                    <FiPlus /> Add City
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                No city yet? Go to{' '}
                <Link href="/cities" className="no-underline" style={{ color: 'var(--brand)' }}>
                  City Management
                </Link>
                {' '}to create one, then refresh this page.
              </p>
            </div>
          </div>

        </div>

        <div className="rounded-2xl p-4 md:p-6 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Buildings</h2>
              <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setBuildingTab('active')} className="px-3 py-1 text-xs" style={{ background: buildingTab === 'active' ? 'var(--brand-dim)' : 'transparent', color: buildingTab === 'active' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Active</button>
                <button type="button" onClick={() => setBuildingTab('disabled')} className="px-3 py-1 text-xs" style={{ background: buildingTab === 'disabled' ? 'var(--brand-dim)' : 'transparent', color: buildingTab === 'disabled' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Disabled</button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedBuildingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBuildingId(null);
                    resetLevelsBelow('city');
                  }}
                  className="h-10 px-3 rounded-xl"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Deselect
                </button>
              ) : null}
              {!hideCityAndBuildingActions ? (
                <button
                  type="button"
                  disabled={buildingTab !== 'active'}
                  onClick={() => {
                    setBuildingToEdit(null);
                    setBuildingForm({ name: '', location: '', propertyType: 'pg' });
                    setIsBuildingModalOpen(true);
                  }}
                  className="h-10 px-3 rounded-xl inline-flex items-center justify-center gap-2"
                  style={{ background: 'var(--brand-dim)', color: 'var(--brand-light)', border: '1px solid var(--brand-border)', opacity: buildingTab !== 'active' ? 0.5 : 1 }}
                >
                  <FiPlus /> Add Building
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {buildings.map((building, index) => (
              <div
                key={building.id}
                className="rounded-xl p-4 cursor-pointer"
                style={{
                  border: selectedBuildingId === building.id ? '1px solid var(--brand-border)' : '1px solid var(--border)',
                  background: selectedBuildingId === building.id ? 'var(--brand-dim)' : 'var(--bg-elevated)',
                }}
                onClick={() => {
                  if (selectedBuildingId === building.id) {
                    setSelectedBuildingId(null);
                    resetLevelsBelow('city');
                    return;
                  }
                  setSelectedBuildingId(building.id);
                  resetLevelsBelow('building');
                }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Building #{index + 1}</p>
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{building.name}</p>
                <p className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <FiMapPin className="w-3 h-3" /> {building.location || 'No location'}
                </p>
                {!hideCityAndBuildingActions ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      disabled={buildingTab !== 'active'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditBuilding(building);
                      }}
                      className="px-2 py-1 rounded-lg text-xs inline-flex items-center gap-1"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', opacity: buildingTab !== 'active' ? 0.5 : 1 }}
                    >
                      <FiEdit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (buildingTab === 'active') {
                          onDisableBuilding(building.id);
                        } else {
                          onEnableBuilding(building.id);
                        }
                      }}
                      className="px-2 py-1 rounded-lg text-xs inline-flex items-center gap-1"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >
                      {buildingTab === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteBuilding(building.id);
                      }}
                      className="px-2 py-1 rounded-lg text-xs inline-flex items-center gap-1"
                      style={{ border: '1px solid rgba(239,68,68,0.35)', color: 'var(--danger)' }}
                    >
                      <FiTrash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            {buildings.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No buildings in this tab.
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-4 md:p-6 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Floors</h2>
                <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <button type="button" onClick={() => setFloorTab('active')} className="px-3 py-1 text-xs" style={{ background: floorTab === 'active' ? 'var(--brand-dim)' : 'transparent', color: floorTab === 'active' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Active</button>
                  <button type="button" onClick={() => setFloorTab('disabled')} className="px-3 py-1 text-xs" style={{ background: floorTab === 'disabled' ? 'var(--brand-dim)' : 'transparent', color: floorTab === 'disabled' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Disabled</button>
                </div>
              </div>
              {selectedFloorId ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFloorId(null);
                    resetLevelsBelow('building');
                  }}
                  className="h-9 px-3 rounded-xl"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Deselect
                </button>
              ) : null}
            </div>

            <button
              type="button"
              disabled={floorTab !== 'active'}
              onClick={() => {
                setFloorToEdit(null);
                setFloorForm({ floorNumber: 1, description: '' });
                setIsFloorModalOpen(true);
              }}
              className="h-10 px-3 rounded-xl inline-flex items-center justify-center gap-2"
              style={{ background: 'var(--brand-dim)', color: 'var(--brand-light)', border: '1px solid var(--brand-border)', opacity: floorTab !== 'active' ? 0.5 : 1 }}
            >
              <FiPlus /> Add Floor
            </button>

            <div className="space-y-2">
              {floors.map((floor) => (
                <div
                  key={floor.id}
                  className="rounded-xl p-3 cursor-pointer flex items-center justify-between"
                  style={{
                    border: selectedFloorId === floor.id ? '1px solid var(--brand-border)' : '1px solid var(--border)',
                    background: selectedFloorId === floor.id ? 'var(--brand-dim)' : 'var(--bg-elevated)',
                  }}
                  onClick={() => {
                    if (selectedFloorId === floor.id) {
                      setSelectedFloorId(null);
                      resetLevelsBelow('building');
                      return;
                    }
                    setSelectedFloorId(floor.id);
                    resetLevelsBelow('floor');
                  }}
                >
                  <div>
                    <p style={{ color: 'var(--text-primary)' }}>Floor {floor.floorNumber}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{floor.description || 'No description'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={floorTab !== 'active'} onClick={(e) => { e.stopPropagation(); onUpdateFloor(floor); }} className="px-2 py-1 rounded-lg text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', opacity: floorTab !== 'active' ? 0.5 : 1 }}>Edit</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); if (floorTab === 'active') { onDisableFloor(floor.id); } else { onEnableFloor(floor.id); } }} className="px-2 py-1 rounded-lg text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{floorTab === 'active' ? 'Disable' : 'Enable'}</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); requestDeleteFloor(floor.id); }} className="px-2 py-1 rounded-lg text-xs" style={{ border: '1px solid rgba(239,68,68,0.35)', color: 'var(--danger)' }}>Delete</button>
                  </div>
                </div>
              ))}
              {floors.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No floors in this tab.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl p-4 md:p-6 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Rooms</h2>
                <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <button type="button" onClick={() => setRoomTab('active')} className="px-3 py-1 text-xs" style={{ background: roomTab === 'active' ? 'var(--brand-dim)' : 'transparent', color: roomTab === 'active' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Active</button>
                  <button type="button" onClick={() => setRoomTab('disabled')} className="px-3 py-1 text-xs" style={{ background: roomTab === 'disabled' ? 'var(--brand-dim)' : 'transparent', color: roomTab === 'disabled' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Disabled</button>
                </div>
              </div>
              {selectedRoomId ? (
                <button
                  type="button"
                  onClick={() => setSelectedRoomId(null)}
                  className="h-9 px-3 rounded-xl"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Deselect
                </button>
              ) : null}
            </div>

            <button
              type="button"
              disabled={roomTab !== 'active'}
              onClick={() => {
                setRoomToEdit(null);
                setRoomForm({
                  roomNumber: '',
                  roomType: 'single',
                  status: 'available',
                  capacity: 1,
                  pricePerDay: '',
                  pricePerMonth: '',
                });
                setIsRoomModalOpen(true);
              }}
              className="w-full h-11 rounded-xl inline-flex items-center justify-center gap-2"
              style={{ background: 'var(--brand-dim)', color: 'var(--brand-light)', border: '1px solid var(--brand-border)', opacity: roomTab !== 'active' ? 0.5 : 1 }}
            >
              <FiPlus /> Add Room
            </button>

            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-xl p-3 cursor-pointer"
                  style={{ border: selectedRoomId === room.id ? '1px solid var(--brand-border)' : '1px solid var(--border)', background: selectedRoomId === room.id ? 'var(--brand-dim)' : 'var(--bg-elevated)' }}
                  onClick={() => {
                    if (selectedRoomId === room.id) {
                      setSelectedRoomId(null);
                      return;
                    }
                    setSelectedRoomId(room.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ color: 'var(--text-primary)' }}>Room {room.roomNumber} ({room.roomType})</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {isBedSupported ? `Capacity ${room.capacity} · Beds ${room.bedCount}` : `${room.status} · ${room.roomType}`}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Day {room.pricePerDay ?? '-'} · Month {room.pricePerMonth ?? '-'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={roomTab !== 'active'} onClick={(e) => { e.stopPropagation(); onUpdateRoom(room); }} className="px-2 py-1 rounded-lg text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', opacity: roomTab !== 'active' ? 0.5 : 1 }}>Edit</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); if (roomTab === 'active') { onDisableRoom(room.id); } else { onEnableRoom(room.id); } }} className="px-2 py-1 rounded-lg text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{roomTab === 'active' ? 'Disable' : 'Enable'}</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); requestDeleteRoom(room.id); }} className="px-2 py-1 rounded-lg text-xs" style={{ border: '1px solid rgba(239,68,68,0.35)', color: 'var(--danger)' }}>Delete</button>
                    </div>
                  </div>
                  {isBedSupported ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Array.from({ length: room.capacity || room.bedCount || 0 }).map((_, idx) => (
                        <span key={`${room.id}-bed-${idx}`} className="inline-flex items-center justify-center w-7 h-7 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}>
                          <FiSquare className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {rooms.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No rooms in this tab.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 md:p-6 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Beds</h2>
              <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setBedTab('active')} className="px-3 py-1 text-xs" style={{ background: bedTab === 'active' ? 'var(--brand-dim)' : 'transparent', color: bedTab === 'active' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Active</button>
                <button type="button" onClick={() => setBedTab('disabled')} className="px-3 py-1 text-xs" style={{ background: bedTab === 'disabled' ? 'var(--brand-dim)' : 'transparent', color: bedTab === 'disabled' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Disabled</button>
              </div>
            </div>
            {isBedSupported && selectedRoomId && bedTab === 'active' ? (
              <button type="button" onClick={onCreateBed} className="h-10 px-3 rounded-xl inline-flex items-center gap-2" style={{ background: 'var(--brand-dim)', color: 'var(--brand-light)', border: '1px solid var(--brand-border)' }}>
                <FiPlus /> Add Bed
              </button>
            ) : null}
          </div>

          {!selectedBuilding ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select a building first to manage beds.</p>
          ) : !isBedSupported ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Beds are not available for Lodge properties. Select a PG building to manage beds.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
                <select
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(e.target.value ? Number(e.target.value) : null)}
                  className="h-12 rounded-xl px-3"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">Select room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} ({room.roomType})
                    </option>
                  ))}
                </select>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  PG flow: admin can add/remove beds based on demand. Room capacity follows active bed count automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {beds.map((bed) => (
                  <div key={bed.id} className="rounded-lg p-2" style={{ border: '1px solid var(--border)', background: bed.status === 'occupied' ? 'rgba(239,68,68,0.12)' : bed.status === 'maintenance' ? 'rgba(245,158,11,0.14)' : 'rgba(16,185,129,0.12)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{bed.bedNumber}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{bed.status}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bedTab === 'active' ? (
                        <>
                          <button type="button" onClick={() => onOpenBedStatusModal(bed)} className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Change Status</button>
                          <button type="button" onClick={() => onDisableBed(bed.id)} className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Disable</button>
                          <button type="button" onClick={() => requestDeleteBed(bed.id)} className="text-[10px]" style={{ color: 'var(--danger)' }}>Delete</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => onEnableBed(bed.id)} className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Enable</button>
                      )}
                    </div>
                  </div>
                ))}
                {beds.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No beds in this tab.
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <ReusableFormModal
        isOpen={isCityModalOpen}
        title="Add City"
        onClose={() => {
          setIsCityModalOpen(false);
          setCityForm({ cityName: '', state: '', country: '' });
        }}
        onSave={onCreateCity}
        saveLabel="Save"
        cancelLabel="Cancel"
      >
        <InputBox placeholder="City name *" value={cityForm.cityName} onChange={(e) => setCityForm((p) => ({ ...p, cityName: e.target.value }))} />
        <InputBox placeholder="State" value={cityForm.state} onChange={(e) => setCityForm((p) => ({ ...p, state: e.target.value }))} />
        <InputBox placeholder="Country" value={cityForm.country} onChange={(e) => setCityForm((p) => ({ ...p, country: e.target.value }))} />
      </ReusableFormModal>

      <ReusableFormModal
        isOpen={isBuildingModalOpen}
        title={buildingToEdit ? 'Edit Building' : 'Add Building'}
        onClose={() => {
          setIsBuildingModalOpen(false);
          setBuildingToEdit(null);
          setBuildingForm({ name: '', location: '', propertyType: 'pg' });
        }}
        onSave={onSaveBuilding}
        saveLabel="Save"
        cancelLabel="Cancel"
      >
        <InputBox placeholder="Building name *" value={buildingForm.name} onChange={(e) => setBuildingForm((p) => ({ ...p, name: e.target.value }))} />
        <InputBox placeholder="GPS location / map link" value={buildingForm.location} onChange={(e) => setBuildingForm((p) => ({ ...p, location: e.target.value }))} />
        <select
          value={buildingForm.propertyType}
          onChange={(e) => setBuildingForm((p) => ({ ...p, propertyType: e.target.value }))}
          className="h-12 rounded-xl px-3 w-full"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="pg">PG</option>
          <option value="lodge">Lodge</option>
        </select>
      </ReusableFormModal>

      <ReusableFormModal
        isOpen={isFloorModalOpen}
        title={floorToEdit ? 'Edit Floor' : 'Add Floor'}
        onClose={() => {
          setIsFloorModalOpen(false);
          setFloorToEdit(null);
          setFloorForm({ floorNumber: 1, description: '' });
        }}
        onSave={onSaveFloor}
        saveLabel="Save"
        cancelLabel="Cancel"
      >
        <InputBox type="number" min={1} placeholder="Floor number" value={floorForm.floorNumber} onChange={(e) => setFloorForm((p) => ({ ...p, floorNumber: Number(e.target.value) }))} />
        <InputBox placeholder="Description" value={floorForm.description} onChange={(e) => setFloorForm((p) => ({ ...p, description: e.target.value }))} />
      </ReusableFormModal>

      <ReusableFormModal
        isOpen={isRoomModalOpen}
        title={roomToEdit ? 'Edit Room' : 'Add Room'}
        onClose={() => {
          setIsRoomModalOpen(false);
          setRoomToEdit(null);
          setRoomForm({
            roomNumber: '',
            roomType: 'single',
            status: 'available',
            capacity: 1,
            pricePerDay: '',
            pricePerMonth: '',
          });
        }}
        onSave={onSaveRoom}
        saveLabel="Save"
        cancelLabel="Cancel"
      >
        <InputBox placeholder="Room no *" value={roomForm.roomNumber} onChange={(e) => setRoomForm((p) => ({ ...p, roomNumber: e.target.value }))} />
        {isBedSupported ? (
          <>
            <InputBox type="number" min={1} placeholder="Capacity (beds)" value={roomForm.capacity} onChange={(e) => setRoomForm((p) => ({ ...p, capacity: Number(e.target.value) }))} />
            <InputBox placeholder="Price/day" value={roomForm.pricePerDay} onChange={(e) => setRoomForm((p) => ({ ...p, pricePerDay: e.target.value }))} />
            <InputBox placeholder="Price/month" value={roomForm.pricePerMonth} onChange={(e) => setRoomForm((p) => ({ ...p, pricePerMonth: e.target.value }))} />
          </>
        ) : (
          <>
            <select value={roomForm.roomType} onChange={(e) => setRoomForm((p) => ({ ...p, roomType: e.target.value }))} className="h-12 rounded-xl px-3 w-full" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="deluxe">Deluxe</option>
            </select>
            <select value={roomForm.status} onChange={(e) => setRoomForm((p) => ({ ...p, status: e.target.value }))} className="h-12 rounded-xl px-3 w-full" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <InputBox placeholder="Price/day" value={roomForm.pricePerDay} onChange={(e) => setRoomForm((p) => ({ ...p, pricePerDay: e.target.value }))} />
            <InputBox placeholder="Price/month" value={roomForm.pricePerMonth} onChange={(e) => setRoomForm((p) => ({ ...p, pricePerMonth: e.target.value }))} />
          </>
        )}
      </ReusableFormModal>

      <ReusableConfirmModal
        isOpen={isConfirmDeleteBuildingOpen}
        title="Delete Building"
        message="Are you sure you want to delete this building? This action cannot be undone."
        onClose={() => {
          setIsConfirmDeleteBuildingOpen(false);
          setBuildingIdToDelete(null);
        }}
        onConfirm={confirmDeleteBuilding}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <ReusableConfirmModal
        isOpen={isConfirmDeleteEntityOpen}
        title={confirmEntityTitle}
        message={confirmEntityMessage}
        onClose={() => {
          setIsConfirmDeleteEntityOpen(false);
          setConfirmEntityAction(null);
        }}
        onConfirm={confirmDeleteEntity}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <ReusableFormModal
        isOpen={isBedStatusModalOpen}
        title="Update Bed Availability"
        onClose={() => {
          setIsBedStatusModalOpen(false);
          setBedToEdit(null);
        }}
        onSave={onSaveBedStatus}
        saveLabel="Save"
        cancelLabel="Cancel"
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {bedToEdit ? `Bed ${bedToEdit.bedNumber}` : 'Selected bed'}
        </p>
        <select
          value={bedStatusForm}
          onChange={(e) => setBedStatusForm(e.target.value === 'occupied' ? 'occupied' : e.target.value === 'maintenance' ? 'maintenance' : 'available')}
          className="h-12 rounded-xl px-3 w-full"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Under Maintenance</option>
        </select>
      </ReusableFormModal>
    </div>
  );
}
