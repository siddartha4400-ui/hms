from apps.subsites.models import HMS
from apps.propertys.repositories import PropertyRepository
from apps.propertys.validators import PropertyValidator
from common.exceptions import ApiException


class PropertyService:
    @staticmethod
    def _expected_property_type_for_company(company):
        expected_property_type = PropertyValidator.validate_property_type(company.get_hms_type_display().lower())
        return expected_property_type

    @staticmethod
    def _sync_room_beds_from_capacity(room, target_capacity: int, actor=None):
        target_capacity = max(int(target_capacity or 0), 0)
        existing_beds = list(room.beds.order_by("id"))

        # Do not auto-remove occupied beds when reducing capacity.
        if len(existing_beds) > target_capacity:
            removable = existing_beds[target_capacity:]
            occupied = [bed for bed in removable if bed.status == "occupied"]
            if occupied:
                raise ApiException("Cannot reduce capacity while extra beds are occupied")
            for bed in removable:
                PropertyRepository.delete_bed(bed)

        if len(existing_beds) < target_capacity:
            for idx in range(len(existing_beds) + 1, target_capacity + 1):
                PropertyRepository.create_bed(
                    room=room,
                    bed_number=f"B{idx}",
                    status="available",
                    is_active=True,
                    created_by=actor,
                    updated_by=actor,
                )

        # Normalize numbering order B1..Bn for consistency.
        refreshed = list(room.beds.order_by("id"))
        for idx, bed in enumerate(refreshed, 1):
            expected = f"B{idx}"
            if bed.bed_number != expected:
                PropertyRepository.update_bed(bed, bed_number=expected, updated_by=actor)

    @staticmethod
    def _serialize_city(city):
        return {
            "id": city.id,
            "city_name": city.city_name,
            "state": city.state,
            "country": city.country,
            "is_active": city.is_active,
            "created_at": city.created_at.isoformat() if city.created_at else "",
            "updated_at": city.updated_at.isoformat() if city.updated_at else "",
            "created_by": city.created_by_id,
            "updated_by": city.updated_by_id,
        }

    @staticmethod
    def _serialize_building(building):
        return {
            "id": building.id,
            "company_id": building.company_id,
            "city_id": building.city_id,
            "city_name": building.city.city_name if building.city else "",
            "name": building.name,
            "location": building.location,
            "latitude": float(building.latitude) if building.latitude is not None else None,
            "longitude": float(building.longitude) if building.longitude is not None else None,
            "property_type": building.property_type,
            "is_active": building.is_active,
            "created_at": building.created_at.isoformat() if building.created_at else "",
            "updated_at": building.updated_at.isoformat() if building.updated_at else "",
            "created_by": building.created_by_id,
            "updated_by": building.updated_by_id,
        }

    @staticmethod
    def _serialize_floor(floor):
        return {
            "id": floor.id,
            "building_id": floor.building_id,
            "floor_number": floor.floor_number,
            "description": floor.description,
            "is_active": floor.is_active,
            "created_at": floor.created_at.isoformat() if floor.created_at else "",
            "updated_at": floor.updated_at.isoformat() if floor.updated_at else "",
            "created_by": floor.created_by_id,
            "updated_by": floor.updated_by_id,
        }

    @staticmethod
    def _serialize_room(room):
        return {
            "id": room.id,
            "building_id": room.building_id,
            "floor_id": room.floor_id,
            "room_number": room.room_number,
            "room_type": room.room_type,
            "price_per_day": float(room.price_per_day) if room.price_per_day is not None else None,
            "price_per_month": float(room.price_per_month) if room.price_per_month is not None else None,
            "status": room.status,
            "capacity": room.capacity,
            "bed_count": room.beds.count(),
            "is_active": room.is_active,
            "created_at": room.created_at.isoformat() if room.created_at else "",
            "updated_at": room.updated_at.isoformat() if room.updated_at else "",
            "created_by": room.created_by_id,
            "updated_by": room.updated_by_id,
        }

    @staticmethod
    def _serialize_bed(bed):
        return {
            "id": bed.id,
            "room_id": bed.room_id,
            "bed_number": bed.bed_number,
            "status": bed.status,
            "is_active": bed.is_active,
            "created_at": bed.created_at.isoformat() if bed.created_at else "",
            "updated_at": bed.updated_at.isoformat() if bed.updated_at else "",
            "created_by": bed.created_by_id,
            "updated_by": bed.updated_by_id,
        }

    @staticmethod
    def list_cities(is_active=None):
        return [PropertyService._serialize_city(item) for item in PropertyRepository.list_cities(is_active=is_active)]

    @staticmethod
    def create_city(payload: dict, actor=None):
        city_name = str(PropertyValidator.require(payload.get("city_name"), "city_name")).strip()
        city = PropertyRepository.create_city(
            city_name=city_name,
            state=(payload.get("state") or "").strip(),
            country=(payload.get("country") or "").strip(),
            is_active=payload.get("is_active", True),
            created_by=actor,
            updated_by=actor,
        )
        return PropertyService._serialize_city(city)

    @staticmethod
    def update_city(city_id: int, payload: dict, actor=None):
        city = PropertyRepository.get_city(city_id)
        if not city:
            raise ApiException("City not found")

        if payload.get("is_active") is False and city.buildings.filter(is_active=True).exists():
            raise ApiException("Disable buildings under this city before disabling city")

        update_data = {}
        if "city_name" in payload and payload.get("city_name") is not None:
            update_data["city_name"] = payload.get("city_name").strip()
        if "state" in payload and payload.get("state") is not None:
            update_data["state"] = payload.get("state").strip()
        if "country" in payload and payload.get("country") is not None:
            update_data["country"] = payload.get("country").strip()
        if "is_active" in payload and payload.get("is_active") is not None:
            update_data["is_active"] = payload.get("is_active")
        update_data["updated_by"] = actor

        city = PropertyRepository.update_city(city, **update_data)
        return PropertyService._serialize_city(city)

    @staticmethod
    def delete_city(city_id: int):
        city = PropertyRepository.get_city(city_id)
        if not city:
            raise ApiException("City not found")
        if city.buildings.exists():
            raise ApiException("Cannot delete city with existing buildings")
        PropertyRepository.delete_city(city)

    @staticmethod
    def list_buildings(company_id=None, city_id=None, is_active=None):
        return [
            PropertyService._serialize_building(item)
            for item in PropertyRepository.list_buildings(company_id=company_id, city_id=city_id, is_active=is_active)
        ]

    @staticmethod
    def create_building(payload: dict, actor=None):
        company_id = PropertyValidator.validate_positive_int(PropertyValidator.require(payload.get("company_id"), "company_id"), "company_id")
        city_id = PropertyValidator.validate_positive_int(PropertyValidator.require(payload.get("city_id"), "city_id"), "city_id")

        company = HMS.objects.filter(id=company_id).first()
        if not company:
            raise ApiException("company_id does not exist")

        expected_property_type = PropertyService._expected_property_type_for_company(company)

        city = PropertyRepository.get_city(city_id)
        if not city:
            raise ApiException("city_id does not exist")

        requested_property_type = payload.get("property_type")
        if requested_property_type is None:
            resolved_property_type = expected_property_type
        else:
            resolved_property_type = PropertyValidator.validate_property_type(requested_property_type)
            if resolved_property_type != expected_property_type:
                raise ApiException(
                    f"property_type must be '{expected_property_type}' for this subsite"
                )

        building = PropertyRepository.create_building(
            company=company,
            city=city,
            name=str(PropertyValidator.require(payload.get("name"), "name")).strip(),
            location=(payload.get("location") or "").strip(),
            latitude=payload.get("latitude"),
            longitude=payload.get("longitude"),
            property_type=resolved_property_type,
            is_active=payload.get("is_active", True),
            created_by=actor,
            updated_by=actor,
        )
        return PropertyService._serialize_building(building)

    @staticmethod
    def update_building(building_id: int, payload: dict, actor=None):
        building = PropertyRepository.get_building(building_id)
        if not building:
            raise ApiException("Building not found")

        if payload.get("is_active") is False:
            if building.floors.filter(is_active=True).exists():
                raise ApiException("Disable active floors before disabling building")
            if building.rooms.filter(is_active=True).exists():
                raise ApiException("Disable active rooms before disabling building")

        update_data = {}
        if "city_id" in payload and payload.get("city_id") is not None:
            city = PropertyRepository.get_city(payload.get("city_id"))
            if not city:
                raise ApiException("city_id does not exist")
            update_data["city"] = city
        if "name" in payload and payload.get("name") is not None:
            update_data["name"] = payload.get("name").strip()
        if "location" in payload and payload.get("location") is not None:
            update_data["location"] = payload.get("location").strip()
        if "latitude" in payload and payload.get("latitude") is not None:
            update_data["latitude"] = payload.get("latitude")
        if "longitude" in payload and payload.get("longitude") is not None:
            update_data["longitude"] = payload.get("longitude")
        if "property_type" in payload and payload.get("property_type") is not None:
            expected_property_type = PropertyService._expected_property_type_for_company(building.company)
            requested_property_type = PropertyValidator.validate_property_type(payload.get("property_type"))
            if requested_property_type != expected_property_type:
                raise ApiException(
                    f"property_type must be '{expected_property_type}' for this subsite"
                )
            update_data["property_type"] = requested_property_type
        if "is_active" in payload and payload.get("is_active") is not None:
            update_data["is_active"] = payload.get("is_active")
        update_data["updated_by"] = actor

        building = PropertyRepository.update_building(building, **update_data)
        return PropertyService._serialize_building(building)

    @staticmethod
    def delete_building(building_id: int):
        building = PropertyRepository.get_building(building_id)
        if not building:
            raise ApiException("Building not found")
        occupied_rooms = building.rooms.filter(status="occupied").exists()
        active_beds = building.rooms.filter(beds__status__in=["occupied", "maintenance"]).exists()
        if occupied_rooms or active_beds:
            raise ApiException("Cannot delete building with occupied rooms or non-available beds")
        PropertyRepository.delete_building(building)

    @staticmethod
    def list_floors(building_id=None, is_active=None):
        return [
            PropertyService._serialize_floor(item)
            for item in PropertyRepository.list_floors(building_id=building_id, is_active=is_active)
        ]

    @staticmethod
    def create_floor(payload: dict, actor=None):
        building_id = PropertyValidator.validate_positive_int(PropertyValidator.require(payload.get("building_id"), "building_id"), "building_id")
        floor_number = PropertyValidator.validate_positive_int(PropertyValidator.require(payload.get("floor_number"), "floor_number"), "floor_number")

        building = PropertyRepository.get_building(building_id)
        if not building:
            raise ApiException("building_id does not exist")

        floor = PropertyRepository.create_floor(
            building=building,
            floor_number=floor_number,
            description=(payload.get("description") or "").strip(),
            is_active=payload.get("is_active", True),
            created_by=actor,
            updated_by=actor,
        )
        return PropertyService._serialize_floor(floor)

    @staticmethod
    def update_floor(floor_id: int, payload: dict, actor=None):
        floor = PropertyRepository.get_floor(floor_id)
        if not floor:
            raise ApiException("Floor not found")

        if payload.get("is_active") is False and floor.rooms.filter(is_active=True).exists():
            raise ApiException("Disable active rooms before disabling floor")

        update_data = {}
        if "floor_number" in payload and payload.get("floor_number") is not None:
            update_data["floor_number"] = PropertyValidator.validate_positive_int(payload.get("floor_number"), "floor_number")
        if "description" in payload and payload.get("description") is not None:
            update_data["description"] = payload.get("description").strip()
        if "is_active" in payload and payload.get("is_active") is not None:
            update_data["is_active"] = payload.get("is_active")
        update_data["updated_by"] = actor

        floor = PropertyRepository.update_floor(floor, **update_data)
        return PropertyService._serialize_floor(floor)

    @staticmethod
    def delete_floor(floor_id: int):
        floor = PropertyRepository.get_floor(floor_id)
        if not floor:
            raise ApiException("Floor not found")
        if floor.rooms.exists():
            raise ApiException("Cannot delete floor with existing rooms")
        PropertyRepository.delete_floor(floor)

    @staticmethod
    def list_rooms(building_id=None, floor_id=None, is_active=None):
        return [
            PropertyService._serialize_room(item)
            for item in PropertyRepository.list_rooms(building_id=building_id, floor_id=floor_id, is_active=is_active)
        ]

    @staticmethod
    def create_room(payload: dict, actor=None):
        building_id = PropertyValidator.validate_positive_int(PropertyValidator.require(payload.get("building_id"), "building_id"), "building_id")
        floor_id = PropertyValidator.validate_positive_int(PropertyValidator.require(payload.get("floor_id"), "floor_id"), "floor_id")

        building = PropertyRepository.get_building(building_id)
        if not building:
            raise ApiException("building_id does not exist")

        floor = PropertyRepository.get_floor(floor_id)
        if not floor:
            raise ApiException("floor_id does not exist")

        is_pg = (building.property_type or "").lower() == "pg"
        capacity = max(int(payload.get("capacity") or 0), 0) if is_pg else 0
        if is_pg and capacity <= 0:
            raise ApiException("capacity must be greater than zero for PG rooms")
        room_status = "available" if is_pg else PropertyValidator.validate_room_status(payload.get("status") or "available")

        room = PropertyRepository.create_room(
            building=building,
            floor=floor,
            room_number=str(PropertyValidator.require(payload.get("room_number"), "room_number")).strip(),
            room_type=PropertyValidator.validate_room_type(payload.get("room_type") or ("dorm" if is_pg else "single")),
            price_per_day=payload.get("price_per_day"),
            price_per_month=payload.get("price_per_month"),
            status=room_status,
            capacity=capacity,
            is_active=payload.get("is_active", True),
            created_by=actor,
            updated_by=actor,
        )

        if is_pg:
            PropertyService._sync_room_beds_from_capacity(room, capacity, actor=actor)

        room.refresh_from_db()
        return PropertyService._serialize_room(room)

    @staticmethod
    def update_room(room_id: int, payload: dict, actor=None):
        room = PropertyRepository.get_room(room_id)
        if not room:
            raise ApiException("Room not found")

        update_data = {}
        is_pg = (room.building.property_type or "").lower() == "pg"
        if "room_number" in payload and payload.get("room_number") is not None:
            update_data["room_number"] = payload.get("room_number").strip()
        if "room_type" in payload and payload.get("room_type") is not None:
            update_data["room_type"] = PropertyValidator.validate_room_type(payload.get("room_type"))
        if "price_per_day" in payload and payload.get("price_per_day") is not None:
            update_data["price_per_day"] = payload.get("price_per_day")
        if "price_per_month" in payload and payload.get("price_per_month") is not None:
            update_data["price_per_month"] = payload.get("price_per_month")
        if is_pg:
            update_data["status"] = "available"
        elif "status" in payload and payload.get("status") is not None:
            update_data["status"] = PropertyValidator.validate_room_status(payload.get("status"))
        if is_pg:
            if "capacity" in payload and payload.get("capacity") is not None:
                next_capacity = max(int(payload.get("capacity")), 0)
                if next_capacity <= 0:
                    raise ApiException("capacity must be greater than zero for PG rooms")
                update_data["capacity"] = next_capacity
        else:
            update_data["capacity"] = 0
        if "is_active" in payload and payload.get("is_active") is not None:
            if payload.get("is_active") is False:
                if is_pg and room.beds.filter(status__in=["occupied", "maintenance"], is_active=True).exists():
                    raise ApiException("Cannot disable PG room with occupied or maintenance beds")
                if (not is_pg) and room.status in ["occupied", "maintenance"]:
                    raise ApiException("Cannot disable occupied/maintenance Lodge room")
            update_data["is_active"] = payload.get("is_active")
        update_data["updated_by"] = actor

        room = PropertyRepository.update_room(room, **update_data)
        if is_pg:
            PropertyService._sync_room_beds_from_capacity(room, room.capacity, actor=actor)
        else:
            extra_beds = list(room.beds.order_by("id"))
            non_available = [bed for bed in extra_beds if bed.status != "available"]
            if non_available:
                raise ApiException("Cannot keep occupied or maintenance beds for Lodge rooms")
            for bed in extra_beds:
                PropertyRepository.delete_bed(bed)
        return PropertyService._serialize_room(room)

    @staticmethod
    def delete_room(room_id: int):
        room = PropertyRepository.get_room(room_id)
        if not room:
            raise ApiException("Room not found")
        is_pg = (room.building.property_type or "").lower() == "pg"
        if is_pg and room.beds.filter(status__in=["occupied", "maintenance"]).exists():
            raise ApiException("Cannot delete PG room with occupied or maintenance beds")
        if (not is_pg) and room.status in ["occupied", "maintenance"]:
            raise ApiException("Cannot delete occupied/maintenance Lodge room")
        PropertyRepository.delete_room(room)

    @staticmethod
    def list_beds(room_id=None, is_active=None):
        return [
            PropertyService._serialize_bed(item)
            for item in PropertyRepository.list_beds(room_id=room_id, is_active=is_active)
        ]

    @staticmethod
    def create_bed(payload: dict, actor=None):
        room_id = PropertyValidator.validate_positive_int(PropertyValidator.require(payload.get("room_id"), "room_id"), "room_id")
        room = PropertyRepository.get_room(room_id)
        if not room:
            raise ApiException("room_id does not exist")
        if (room.building.property_type or "").lower() != "pg":
            raise ApiException("Beds can be created only for PG rooms")

        bed = PropertyRepository.create_bed(
            room=room,
            bed_number=str(PropertyValidator.require(payload.get("bed_number"), "bed_number")).strip(),
            status=PropertyValidator.validate_bed_status(payload.get("status") or "available"),
            is_active=payload.get("is_active", True),
            created_by=actor,
            updated_by=actor,
        )
        PropertyRepository.update_room(room, capacity=room.beds.filter(is_active=True).count(), updated_by=actor)
        return PropertyService._serialize_bed(bed)

    @staticmethod
    def update_bed(bed_id: int, payload: dict, actor=None):
        bed = PropertyRepository.get_bed(bed_id)
        if not bed:
            raise ApiException("Bed not found")

        if payload.get("is_active") is False and bed.status in ["occupied", "maintenance"]:
            raise ApiException("Cannot disable occupied or maintenance bed")

        update_data = {}
        if "status" in payload and payload.get("status") is not None:
            update_data["status"] = PropertyValidator.validate_bed_status(payload.get("status"))
        if "is_active" in payload and payload.get("is_active") is not None:
            update_data["is_active"] = payload.get("is_active")
        update_data["updated_by"] = actor

        bed = PropertyRepository.update_bed(bed, **update_data)
        return PropertyService._serialize_bed(bed)

    @staticmethod
    def delete_bed(bed_id: int):
        bed = PropertyRepository.get_bed(bed_id)
        if not bed:
            raise ApiException("Bed not found")
        room = bed.room
        if (room.building.property_type or "").lower() != "pg":
            raise ApiException("Beds can be deleted only for PG rooms")
        if bed.status != "available":
            raise ApiException("Only available beds can be deleted")

        PropertyRepository.delete_bed(bed)
        PropertyRepository.update_room(room, capacity=room.beds.filter(is_active=True).count())
