from datetime import timezone as dt_timezone
from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.bookings.repositories.booking_repository import BookingRepository
from apps.bookings.validators.booking_validator import BookingValidator
from common.exceptions import ApiException


class BookingService:
	VALID_VIEWS = {"today", "ongoing", "upcoming", "old"}

	@staticmethod
	def _booking_reference() -> str:
		return f"BK{uuid4().hex[:10].upper()}"

	@staticmethod
	def _serialize_guest(guest):
		return {
			"id": guest.id,
			"full_name": guest.full_name,
			"mobile_number": guest.mobile_number,
			"aadhaar_attachment_id": guest.aadhaar_attachment_id,
			"aadhaar_attachment_url": guest.aadhaar_attachment.file_url if guest.aadhaar_attachment else "",
		}

	@staticmethod
	def _serialize_booking(booking):
		created_at_utc = ""
		if booking.created_at:
			created_at_utc = booking.created_at.astimezone(dt_timezone.utc).isoformat()

		return {
			"id": booking.id,
			"booking_reference": booking.booking_reference,
			"status": booking.status,
			"payment_method": booking.payment_method,
			"inventory_type": booking.inventory_type,
			"hms_id": booking.hms_id,
			"hms_name": booking.hms.hms_name if booking.hms else "",
			"hms_display_name": booking.hms.hms_display_name if booking.hms else "",
			"city_id": booking.city_id,
			"city_name": booking.city.city_name if booking.city else "",
			"building_id": booking.building_id,
			"building_name": booking.building.name if booking.building else "",
			"room_id": booking.room_id,
			"room_number": booking.room.room_number if booking.room else "",
			"bed_id": booking.bed_id,
			"bed_number": booking.bed.bed_number if booking.bed else "",
			"check_in": booking.check_in.isoformat(),
			"check_out": booking.check_out.isoformat(),
			"guest_count": booking.guest_count,
			"total_amount": float(booking.total_amount),
			"special_request": booking.special_request,
			"guests": [BookingService._serialize_guest(guest) for guest in booking.guests.all()],
			"created_at": booking.created_at.isoformat() if booking.created_at else "",
			"created_at_utc": created_at_utc,
		}

	@staticmethod
	def list_bookings(*, view: str = "ongoing", mine: bool = False, hms_id=None, actor=None):
		requested_view = (view or "ongoing").strip().lower()
		if requested_view not in BookingService.VALID_VIEWS:
			raise ApiException("view must be one of: today, ongoing, upcoming, old")

		user_id = None
		if mine:
			if not actor or not actor.is_authenticated:
				raise ApiException("Login required", status_code=401)
			user_id = actor.id

		today = timezone.now().date()
		queryset = BookingRepository.list_bookings(user_id=user_id, hms_id=hms_id)

		if requested_view == "today":
			queryset = queryset.filter(status="confirmed", check_in=today)
		elif requested_view == "ongoing":
			queryset = queryset.filter(status="confirmed", check_in__lte=today, check_out__gt=today)
		elif requested_view == "upcoming":
			queryset = queryset.filter(status="confirmed", check_in__gt=today)
		elif requested_view == "old":
			queryset = queryset.filter(Q(status__in=["cancelled", "completed"]) | Q(status="confirmed", check_out__lte=today))

		return [BookingService._serialize_booking(item) for item in queryset]

	@staticmethod
	@transaction.atomic
	def create_booking(payload: dict, actor=None):
		if not actor or not actor.is_authenticated:
			raise ApiException("Login is required to complete the booking", status_code=401)

		check_in = BookingValidator.parse_date(payload.get("check_in"), "check_in")
		check_out = BookingValidator.parse_date(payload.get("check_out"), "check_out")
		BookingValidator.validate_stay(check_in, check_out)
		guest_count = BookingValidator.validate_guest_count(payload.get("guest_count"))
		payment_method = BookingValidator.validate_payment_method(payload.get("payment_method"))
		guests, attachment_ids = BookingValidator.validate_guests(payload.get("guests"), guest_count)
		inventory_type = (payload.get("inventory_type") or "").strip().lower()
		special_request = str(payload.get("special_request") or "").strip()

		booking_data = {
			"booking_reference": BookingService._booking_reference(),
			"booked_by": actor,
			"inventory_type": inventory_type,
			"status": "confirmed",
			"payment_method": payment_method,
			"guest_count": guest_count,
			"check_in": check_in,
			"check_out": check_out,
			"special_request": special_request,
		}

		nights = (check_out - check_in).days

		if inventory_type == "room":
			room_id = payload.get("room_id")
			room = BookingRepository.get_room_for_update(room_id)
			if not room or room.building.property_type != "lodge" or not room.is_active or room.status != "available":
				raise ApiException("Selected room is not available")
			if BookingRepository.has_overlapping_room_booking(room.id, check_in, check_out):
				raise ApiException("Selected room is already booked for the chosen dates")
			booking_data.update(
				{
					"hms": room.building.company,
					"city": room.building.city,
					"building": room.building,
					"room": room,
					"bed": None,
					"total_amount": Decimal(str(float(room.price_per_day or 0) * nights)),
				}
			)
			booking = BookingRepository.create_booking(**booking_data)
			BookingRepository.update_room(room, status="occupied")
		elif inventory_type == "bed":
			if guest_count != 1:
				raise ApiException("PG bed booking currently supports one guest per booking")
			bed_id = payload.get("bed_id")
			bed = BookingRepository.get_bed_for_update(bed_id)
			if not bed or bed.room.building.property_type != "pg" or not bed.is_active or bed.status != "available":
				raise ApiException("Selected bed is not available")
			if BookingRepository.has_overlapping_bed_booking(bed.id, check_in, check_out):
				raise ApiException("Selected bed is already booked for the chosen dates")
			booking_data.update(
				{
					"hms": bed.room.building.company,
					"city": bed.room.building.city,
					"building": bed.room.building,
					"room": bed.room,
					"bed": bed,
					"total_amount": Decimal(str(float(bed.room.price_per_day or 0) * nights)),
				}
			)
			booking = BookingRepository.create_booking(**booking_data)
			BookingRepository.update_bed(bed, status="occupied")
		else:
			raise ApiException("inventory_type must be either room or bed")

		for guest in guests:
			attachment = BookingRepository.get_attachment(guest["aadhaar_attachment_id"])
			if not attachment:
				raise ApiException(f"Attachment {guest['aadhaar_attachment_id']} was not found")
			BookingRepository.create_booking_guest(
				booking=booking,
				full_name=guest["full_name"],
				mobile_number=guest["mobile_number"],
				aadhaar_attachment=attachment,
			)

		BookingRepository.assign_attachments_to_booking(attachment_ids, booking.id)
		booking = BookingRepository.get_booking(booking.id)
		return BookingService._serialize_booking(booking)

	@staticmethod
	@transaction.atomic
	def cancel_booking(booking_reference: str):
		booking = BookingRepository.get_booking_by_reference(booking_reference)
		if not booking:
			raise ApiException("Booking not found", status_code=404)
		if booking.status == "cancelled":
			return BookingService._serialize_booking(booking)

		BookingRepository.cancel_booking(booking)
		if booking.inventory_type == "room" and booking.room and booking.room.status == "occupied":
			BookingRepository.update_room(booking.room, status="available")
		if booking.inventory_type == "bed" and booking.bed and booking.bed.status == "occupied":
			BookingRepository.update_bed(booking.bed, status="available")

		booking = BookingRepository.get_booking(booking.id)
		return BookingService._serialize_booking(booking)