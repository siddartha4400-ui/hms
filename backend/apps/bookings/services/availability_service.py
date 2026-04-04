from apps.bookings.repositories.booking_repository import BookingRepository
from apps.bookings.validators.booking_validator import BookingValidator
from common.exceptions import ApiException


class AvailabilityService:
	@staticmethod
	def _availability_state(*, is_active: bool, inventory_status: str, is_booked: bool):
		status = (inventory_status or "available").lower()
		if not is_active:
			return "inactive"
		if is_booked:
			return "booked"
		if status == "maintenance":
			return "maintenance"
		# For date-range search, non-overlapping requests should remain bookable
		# even if inventory status was left as occupied by older flows.
		if status == "occupied":
			return "available"
		return "available"

	@staticmethod
	def _building_gallery_images(building):
		gallery = [
			building.building_image_attachment.file_url if getattr(building, "building_image_attachment", None) else "",
			building.floor_image_attachment.file_url if getattr(building, "floor_image_attachment", None) else "",
			building.room_image_attachment.file_url if getattr(building, "room_image_attachment", None) else "",
			building.bathroom_image_attachment.file_url if getattr(building, "bathroom_image_attachment", None) else "",
		]
		return [url for url in gallery if url]

	@staticmethod
	def _serialize_room_option(room, check_in, check_out, is_booked=False):
		nights = (check_out - check_in).days
		price_per_day = float(room.price_per_day) if room.price_per_day is not None else 0.0
		gallery_images = AvailabilityService._building_gallery_images(room.building)
		fallback_image = room.building.company.logo_attachment.file_url if room.building.company.logo_attachment else ""
		is_active = bool(
			room.is_active
			and room.floor and room.floor.is_active
			and room.building and room.building.is_active
			and room.building.city and room.building.city.is_active
			and room.building.company and room.building.company.is_active
		)
		inventory_status = (room.status or "available").lower()
		availability_state = AvailabilityService._availability_state(
			is_active=is_active,
			inventory_status=inventory_status,
			is_booked=is_booked,
		)
		return {
			"inventory_type": "room",
			"booking_target_id": room.id,
			"hms_id": room.building.company_id,
			"hms_name": room.building.company.hms_name,
			"hms_display_name": room.building.company.hms_display_name,
			"image_url": gallery_images[0] if gallery_images else fallback_image,
			"gallery_images": gallery_images,
			"city_id": room.building.city_id,
			"city_name": room.building.city.city_name,
			"building_id": room.building_id,
			"building_name": room.building.name,
			"floor_id": room.floor_id,
			"floor_number": room.floor.floor_number if room.floor else None,
			"location": room.building.location,
			"property_type": room.building.property_type,
			"room_id": room.id,
			"room_number": room.room_number,
			"room_type": room.room_type,
			"bed_id": None,
			"bed_number": "",
			"guest_capacity": room.capacity or 1,
			"price_per_day": price_per_day,
			"price_per_month": float(room.price_per_month) if room.price_per_month is not None else None,
			"total_amount": price_per_day * nights,
			"available": availability_state == "available",
			"is_active": is_active,
			"inventory_status": inventory_status,
			"is_booked": is_booked,
			"availability_state": availability_state,
		}

	@staticmethod
	def _serialize_bed_option(bed, check_in, check_out, is_booked=False):
		nights = (check_out - check_in).days
		price_per_day = float(bed.room.price_per_day) if bed.room.price_per_day is not None else 0.0
		gallery_images = AvailabilityService._building_gallery_images(bed.room.building)
		fallback_image = bed.room.building.company.logo_attachment.file_url if bed.room.building.company.logo_attachment else ""
		is_active = bool(
			bed.is_active
			and bed.room and bed.room.is_active
			and bed.room.floor and bed.room.floor.is_active
			and bed.room.building and bed.room.building.is_active
			and bed.room.building.city and bed.room.building.city.is_active
			and bed.room.building.company and bed.room.building.company.is_active
		)
		inventory_status = (bed.status or "available").lower()
		availability_state = AvailabilityService._availability_state(
			is_active=is_active,
			inventory_status=inventory_status,
			is_booked=is_booked,
		)
		return {
			"inventory_type": "bed",
			"booking_target_id": bed.id,
			"hms_id": bed.room.building.company_id,
			"hms_name": bed.room.building.company.hms_name,
			"hms_display_name": bed.room.building.company.hms_display_name,
			"image_url": gallery_images[0] if gallery_images else fallback_image,
			"gallery_images": gallery_images,
			"city_id": bed.room.building.city_id,
			"city_name": bed.room.building.city.city_name,
			"building_id": bed.room.building_id,
			"building_name": bed.room.building.name,
			"floor_id": bed.room.floor_id,
			"floor_number": bed.room.floor.floor_number if bed.room.floor else None,
			"location": bed.room.building.location,
			"property_type": bed.room.building.property_type,
			"room_id": bed.room_id,
			"room_number": bed.room.room_number,
			"room_type": bed.room.room_type,
			"bed_id": bed.id,
			"bed_number": bed.bed_number,
			"guest_capacity": 1,
			"price_per_day": price_per_day,
			"price_per_month": float(bed.room.price_per_month) if bed.room.price_per_month is not None else None,
			"total_amount": price_per_day * nights,
			"available": availability_state == "available",
			"is_active": is_active,
			"inventory_status": inventory_status,
			"is_booked": is_booked,
			"availability_state": availability_state,
		}

	@staticmethod
	def search(payload: dict):
		check_in = BookingValidator.parse_date(payload.get("check_in"), "check_in")
		check_out = BookingValidator.parse_date(payload.get("check_out"), "check_out")
		BookingValidator.validate_stay(check_in, check_out)
		guest_count = BookingValidator.validate_guest_count(payload.get("guest_count") or payload.get("guests") or 1)
		city_id = payload.get("city_id")
		hms_name = (payload.get("hms_name") or "").strip() or None
		property_type = (payload.get("property_type") or "both").strip().lower()
		room_type = (payload.get("room_type") or "any").strip().lower()
		if property_type not in {"both", "pg", "lodge"}:
			raise ApiException("property_type must be one of both, pg, lodge")
		if room_type not in {"any", "ac", "non_ac", "single", "double", "dorm", "deluxe"}:
			raise ApiException("room_type must be one of any, ac, non_ac, single, double, dorm, deluxe")

		results = []

		if property_type in {"both", "pg"} and guest_count == 1:
			for bed in BookingRepository.list_pg_beds_for_availability(city_id=city_id, hms_name=hms_name):
				if room_type != "any" and (bed.room.room_type or "").lower() != room_type:
					continue
				is_booked = BookingRepository.has_overlapping_bed_booking(bed.id, check_in, check_out)
				results.append(AvailabilityService._serialize_bed_option(bed, check_in, check_out, is_booked=is_booked))

		if property_type in {"both", "lodge"}:
			for room in BookingRepository.list_lodge_rooms_for_availability(city_id=city_id, hms_name=hms_name):
				if room_type != "any" and (room.room_type or "").lower() != room_type:
					continue
				if (room.capacity or 0) not in [0, None] and guest_count > room.capacity:
					continue
				is_booked = BookingRepository.has_overlapping_room_booking(room.id, check_in, check_out)
				results.append(AvailabilityService._serialize_room_option(room, check_in, check_out, is_booked=is_booked))

		return results