from apps.bookings.repositories.booking_repository import BookingRepository
from apps.bookings.validators.booking_validator import BookingValidator


class AvailabilityService:
	@staticmethod
	def _serialize_room_option(room, check_in, check_out):
		nights = (check_out - check_in).days
		price_per_day = float(room.price_per_day) if room.price_per_day is not None else 0.0
		return {
			"inventory_type": "room",
			"booking_target_id": room.id,
			"hms_id": room.building.company_id,
			"hms_name": room.building.company.hms_name,
			"hms_display_name": room.building.company.hms_display_name,
			"image_url": room.building.company.logo_attachment.file_url if room.building.company.logo_attachment else "",
			"city_id": room.building.city_id,
			"city_name": room.building.city.city_name,
			"building_id": room.building_id,
			"building_name": room.building.name,
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
			"available": True,
		}

	@staticmethod
	def _serialize_bed_option(bed, check_in, check_out):
		nights = (check_out - check_in).days
		price_per_day = float(bed.room.price_per_day) if bed.room.price_per_day is not None else 0.0
		return {
			"inventory_type": "bed",
			"booking_target_id": bed.id,
			"hms_id": bed.room.building.company_id,
			"hms_name": bed.room.building.company.hms_name,
			"hms_display_name": bed.room.building.company.hms_display_name,
			"image_url": bed.room.building.company.logo_attachment.file_url if bed.room.building.company.logo_attachment else "",
			"city_id": bed.room.building.city_id,
			"city_name": bed.room.building.city.city_name,
			"building_id": bed.room.building_id,
			"building_name": bed.room.building.name,
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
			"available": True,
		}

	@staticmethod
	def search(payload: dict):
		check_in = BookingValidator.parse_date(payload.get("check_in"), "check_in")
		check_out = BookingValidator.parse_date(payload.get("check_out"), "check_out")
		BookingValidator.validate_stay(check_in, check_out)
		guest_count = BookingValidator.validate_guest_count(payload.get("guest_count") or payload.get("guests") or 1)
		city_id = payload.get("city_id")
		hms_name = (payload.get("hms_name") or "").strip() or None

		results = []

		if guest_count == 1:
			for bed in BookingRepository.list_available_pg_beds(city_id=city_id, hms_name=hms_name):
				if not BookingRepository.has_overlapping_bed_booking(bed.id, check_in, check_out):
					results.append(AvailabilityService._serialize_bed_option(bed, check_in, check_out))

		for room in BookingRepository.list_available_lodge_rooms(city_id=city_id, hms_name=hms_name):
			if not BookingRepository.has_overlapping_room_booking(room.id, check_in, check_out):
				if (room.capacity or 0) not in [0, None] and guest_count > room.capacity:
					continue
				results.append(AvailabilityService._serialize_room_option(room, check_in, check_out))

		return results