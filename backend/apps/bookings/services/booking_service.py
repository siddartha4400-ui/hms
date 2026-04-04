from datetime import timezone as dt_timezone
from decimal import Decimal, InvalidOperation
from uuid import uuid4

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.bookings.repositories.booking_repository import BookingRepository
from apps.bookings.validators.booking_validator import BookingValidator
from common.exceptions import ApiException


class BookingService:
	VALID_VIEWS = {"pending", "today", "ongoing", "upcoming", "overstay", "noshow", "old", "cancelled", "relieved"}
	ADMIN_GROUPS = {"root_admin", "site_admin", "site_building_manager"}
	APPROVAL_GROUPS = {"root_admin", "site_admin"}

	@staticmethod
	def _has_any_group(actor, groups) -> bool:
		return bool(actor and actor.is_authenticated and actor.groups.filter(name__in=list(groups)).exists())

	@staticmethod
	def _normalize_company_id(company_id):
		if company_id in (None, ""):
			return None
		try:
			return int(company_id)
		except (TypeError, ValueError) as exc:
			raise ApiException("Invalid subsite context", status_code=400) from exc

	@staticmethod
	def _get_actor_hms_scope(actor):
		"""Resolve actor HMS scope from profile for non-root admin operations."""
		if not actor or not getattr(actor, "is_authenticated", False):
			return None
		if BookingService._has_any_group(actor, {"root_admin"}):
			return None

		profile = None
		try:
			profile = getattr(actor, "profile", None)
		except Exception:
			profile = None
		if not profile:
			return None

		raw_scope = getattr(profile, "company_id", None) or getattr(profile, "hms_id", None)
		if raw_scope in (None, ""):
			return None
		try:
			return int(raw_scope)
		except (TypeError, ValueError):
			return None

	@staticmethod
	def _require_booking_console_access(actor, mine: bool, hms_id=None):
		if mine:
			if not actor or not actor.is_authenticated:
				raise ApiException("Login required", status_code=401)
			return
		if not BookingService._has_any_group(actor, BookingService.ADMIN_GROUPS):
			raise ApiException("Permission denied", status_code=403)
		if not BookingService._has_any_group(actor, {"root_admin"}) and hms_id is None:
			raise ApiException("Subsite context required", status_code=403)

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
	def list_recent_guests(*, actor=None, limit: int = 8):
		if not actor or not actor.is_authenticated:
			raise ApiException("Login required", status_code=401)

		try:
			requested_limit = int(limit)
		except (TypeError, ValueError):
			requested_limit = 8
		requested_limit = max(1, min(requested_limit, 20))

		raw_guests = BookingRepository.list_recent_guests_for_user(user_id=actor.id, limit=requested_limit * 4)
		unique = []
		seen_keys = set()
		for guest in raw_guests:
			key = (
				(guest.full_name or "").strip().lower(),
				(guest.mobile_number or "").strip(),
				guest.aadhaar_attachment_id or 0,
			)
			if key in seen_keys:
				continue
			seen_keys.add(key)
			item = BookingService._serialize_guest(guest)
			item["last_booking_reference"] = guest.booking.booking_reference if guest.booking else ""
			unique.append(item)
			if len(unique) >= requested_limit:
				break
		return unique

	@staticmethod
	def _serialize_booking(booking):
		created_at_utc = ""
		if booking.created_at:
			created_at_utc = booking.created_at.astimezone(dt_timezone.utc).isoformat()

		primary_guest = booking.guests.first() if hasattr(booking, "guests") else None
		booked_by_name = ""
		if booking.booked_by:
			full_name = f"{booking.booked_by.first_name or ''} {booking.booked_by.last_name or ''}".strip()
			booked_by_name = full_name or booking.booked_by.username

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
			"property_type": booking.building.property_type if booking.building else "",
			"room_id": booking.room_id,
			"room_number": booking.room.room_number if booking.room else "",
			"bed_id": booking.bed_id,
			"bed_number": booking.bed.bed_number if booking.bed else "",
			"check_in": booking.check_in.isoformat(),
			"check_out": booking.check_out.isoformat(),
			"guest_count": booking.guest_count,
			"total_amount": float(booking.total_amount),
			"special_request": booking.special_request,
			"booked_by_name": booked_by_name,
			"booked_by_email": booking.booked_by.email if booking.booked_by else "",
			"primary_guest_mobile": primary_guest.mobile_number if primary_guest else "",
			"guests": [BookingService._serialize_guest(guest) for guest in booking.guests.all()],
			"created_at": booking.created_at.isoformat() if booking.created_at else "",
			"created_at_utc": created_at_utc,
		}

	@staticmethod
	def list_bookings(*, view: str = "ongoing", mine: bool = False, hms_id=None, actor=None):
		requested_view = (view or "ongoing").strip().lower()
		if requested_view not in BookingService.VALID_VIEWS:
			raise ApiException("view must be one of: pending, today, ongoing, upcoming, overstay, noshow, relieved, old, cancelled")

		if hms_id is None and not mine:
			hms_id = BookingService._get_actor_hms_scope(actor)

		BookingService._require_booking_console_access(actor, mine=mine, hms_id=hms_id)

		user_id = None
		if mine:
			user_id = actor.id

		today = timezone.now().date()
		queryset = BookingRepository.list_bookings(user_id=user_id, hms_id=hms_id)

		if requested_view == "pending":
			queryset = queryset.filter(status="pending")
		elif requested_view == "today":
			queryset = queryset.filter(status="confirmed", check_in=today)
		elif requested_view == "ongoing":
			queryset = queryset.filter(status="checked_in")
		elif requested_view == "upcoming":
			queryset = queryset.filter(status="confirmed", check_in__gt=today)
		elif requested_view == "overstay":
			# Guests physically present who have exceeded their checkout date
			queryset = queryset.filter(status="checked_in", check_out__lte=today)
		elif requested_view == "noshow":
			# Confirmed but never checked in — check-in date has passed
			queryset = queryset.filter(status="confirmed", check_in__lt=today)
		elif requested_view == "cancelled":
			queryset = queryset.filter(status__in=["cancelled", "rejected"])
		elif requested_view == "relieved":
			queryset = queryset.filter(status="completed")
		elif requested_view == "old":
			queryset = queryset.filter(Q(status="completed") | Q(status="confirmed", check_out__lte=today))

		return [BookingService._serialize_booking(item) for item in queryset]

	@staticmethod
	@transaction.atomic
	def expire_pending_bookings(*, actor=None, hms_id=None, allow_system: bool = False):
		if not allow_system and not BookingService._has_any_group(actor, {"root_admin"}):
			raise ApiException("Only root admin can run pending expiry sync", status_code=403)

		normalized_hms_id = BookingService._normalize_company_id(hms_id)
		today = timezone.now().date()

		queryset = BookingRepository.list_bookings(hms_id=normalized_hms_id).filter(
			status="pending",
			check_in__lt=today,
		)
		return queryset.update(status="cancelled")

	@staticmethod
	@transaction.atomic
	def create_booking(payload: dict, actor=None, company_id=None):
		if not actor or not actor.is_authenticated:
			raise ApiException("Login is required to complete the booking", status_code=401)

		normalized_company_id = BookingService._normalize_company_id(company_id)

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
			"status": "pending",
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
			if normalized_company_id is not None and room.building.company_id != normalized_company_id:
				raise ApiException("Selected room is not available for this subsite", status_code=403)
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
		elif inventory_type == "bed":
			if guest_count != 1:
				raise ApiException("PG bed booking currently supports one guest per booking")
			bed_id = payload.get("bed_id")
			bed = BookingRepository.get_bed_for_update(bed_id)
			if not bed or bed.room.building.property_type != "pg" or not bed.is_active or bed.status != "available":
				raise ApiException("Selected bed is not available")
			if normalized_company_id is not None and bed.room.building.company_id != normalized_company_id:
				raise ApiException("Selected bed is not available for this subsite", status_code=403)
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
	def approve_booking(booking_reference: str, actor=None, company_id=None):
		if not BookingService._has_any_group(actor, BookingService.APPROVAL_GROUPS):
			raise ApiException("Only site admins can approve booking requests", status_code=403)

		normalized_company_id = BookingService._normalize_company_id(company_id)
		if normalized_company_id is None:
			normalized_company_id = BookingService._get_actor_hms_scope(actor)
		booking = BookingRepository.get_booking_by_reference_for_update(booking_reference)
		if not booking:
			raise ApiException("Booking not found", status_code=404)
		if booking.status != "pending":
			raise ApiException("Only pending bookings can be approved")
		if not BookingService._has_any_group(actor, {"root_admin"}):
			if normalized_company_id is None or booking.hms_id != normalized_company_id:
				raise ApiException("Booking is outside your subsite", status_code=403)

		if booking.inventory_type == "room":
			room = BookingRepository.get_room_for_update(booking.room_id)
			if not room or not room.is_active or room.status == "maintenance":
				BookingRepository.update_booking(booking, status="cancelled")
				raise ApiException("This room is no longer available. The request was cancelled.")
			if BookingRepository.has_overlapping_room_booking(room.id, booking.check_in, booking.check_out):
				BookingRepository.update_booking(booking, status="cancelled")
				raise ApiException("This room was already confirmed for another guest. The request was cancelled.")
			BookingRepository.update_booking(booking, status="confirmed")
			BookingRepository.list_overlapping_pending_room_bookings(room.id, booking.check_in, booking.check_out, booking.id).update(status="cancelled")
		elif booking.inventory_type == "bed":
			bed = BookingRepository.get_bed_for_update(booking.bed_id)
			if not bed or not bed.is_active or bed.status == "maintenance":
				BookingRepository.update_booking(booking, status="cancelled")
				raise ApiException("This bed is no longer available. The request was cancelled.")
			if BookingRepository.has_overlapping_bed_booking(bed.id, booking.check_in, booking.check_out):
				BookingRepository.update_booking(booking, status="cancelled")
				raise ApiException("This bed was already confirmed for another guest. The request was cancelled.")
			BookingRepository.update_booking(booking, status="confirmed")
			BookingRepository.list_overlapping_pending_bed_bookings(bed.id, booking.check_in, booking.check_out, booking.id).update(status="cancelled")
		else:
			raise ApiException("inventory_type must be either room or bed")

		booking = BookingRepository.get_booking(booking.id)
		return BookingService._serialize_booking(booking)

	@staticmethod
	@transaction.atomic
	def reject_booking(booking_reference: str, actor=None, company_id=None):
		if not BookingService._has_any_group(actor, BookingService.APPROVAL_GROUPS):
			raise ApiException("Only site admins can reject booking requests", status_code=403)

		normalized_company_id = BookingService._normalize_company_id(company_id)
		if normalized_company_id is None:
			normalized_company_id = BookingService._get_actor_hms_scope(actor)
		booking = BookingRepository.get_booking_by_reference_for_update(booking_reference)
		if not booking:
			raise ApiException("Booking not found", status_code=404)
		if booking.status != "pending":
			raise ApiException("Only pending bookings can be rejected")
		if not BookingService._has_any_group(actor, {"root_admin"}):
			if normalized_company_id is None or booking.hms_id != normalized_company_id:
				raise ApiException("Booking is outside your subsite", status_code=403)

		BookingRepository.update_booking(booking, status="rejected")
		booking = BookingRepository.get_booking(booking.id)
		return BookingService._serialize_booking(booking)

	@staticmethod
	@transaction.atomic
	def cancel_booking(booking_reference: str, actor=None, company_id=None):
		if not BookingService._has_any_group(actor, BookingService.APPROVAL_GROUPS):
			raise ApiException("Only site admins can cancel bookings", status_code=403)

		normalized_company_id = BookingService._normalize_company_id(company_id)
		if normalized_company_id is None:
			normalized_company_id = BookingService._get_actor_hms_scope(actor)

		booking = BookingRepository.get_booking_by_reference_for_update(booking_reference)
		if not booking:
			raise ApiException("Booking not found", status_code=404)
		if booking.status in {"cancelled", "rejected", "completed"}:
			raise ApiException("Booking cannot be cancelled in current status")
		if not BookingService._has_any_group(actor, {"root_admin"}):
			if normalized_company_id is None or booking.hms_id != normalized_company_id:
				raise ApiException("Booking is outside your subsite", status_code=403)

		was_confirmed = booking.status in {"confirmed", "checked_in"}
		BookingRepository.update_booking(booking, status="cancelled")

		if was_confirmed and booking.inventory_type == "room" and booking.room_id:
			room = BookingRepository.get_room_for_update(booking.room_id)
			if room and room.status == "occupied":
				BookingRepository.update_room(room, status="available")
		if was_confirmed and booking.inventory_type == "bed" and booking.bed_id:
			bed = BookingRepository.get_bed_for_update(booking.bed_id)
			if bed and bed.status == "occupied":
				BookingRepository.update_bed(bed, status="available")

		booking = BookingRepository.get_booking(booking.id)
		return BookingService._serialize_booking(booking)

	@staticmethod
	@transaction.atomic
	def complete_booking(booking_reference: str, actor=None, company_id=None, checkout_mode: str = "normal", extra_amount=None):
		if not BookingService._has_any_group(actor, BookingService.APPROVAL_GROUPS):
			raise ApiException("Only site admins can relieve bookings", status_code=403)

		normalized_company_id = BookingService._normalize_company_id(company_id)
		if normalized_company_id is None:
			normalized_company_id = BookingService._get_actor_hms_scope(actor)

		booking = BookingRepository.get_booking_by_reference_for_update(booking_reference)
		if not booking:
			raise ApiException("Booking not found", status_code=404)
		if booking.status not in {"confirmed", "checked_in"}:
			raise ApiException("Only confirmed or checked-in bookings can be relieved")
		if not BookingService._has_any_group(actor, {"root_admin"}):
			if normalized_company_id is None or booking.hms_id != normalized_company_id:
				raise ApiException("Booking is outside your subsite", status_code=403)

		mode = (checkout_mode or "normal").strip().lower()
		if mode not in {"normal", "overstay"}:
			raise ApiException("checkout_mode must be normal or overstay")

		extra_charge = Decimal("0")
		if extra_amount not in (None, ""):
			try:
				extra_charge = Decimal(str(extra_amount)).quantize(Decimal("0.01"))
			except (InvalidOperation, TypeError, ValueError) as exc:
				raise ApiException("extra_amount must be a valid number") from exc
			if extra_charge < 0:
				raise ApiException("extra_amount cannot be negative")

		updates = {"status": "completed"}
		if mode == "overstay":
			updates["total_amount"] = (booking.total_amount or Decimal("0")) + extra_charge
			note = f"Overstay checkout applied. Extra amount: INR {extra_charge:.2f}."
			existing_note = (booking.special_request or "").strip()
			updates["special_request"] = f"{existing_note}\n{note}".strip()

		BookingRepository.update_booking(booking, **updates)
		if booking.inventory_type == "room" and booking.room_id:
			room = BookingRepository.get_room_for_update(booking.room_id)
			if room and room.status == "occupied":
				BookingRepository.update_room(room, status="available")
		if booking.inventory_type == "bed" and booking.bed_id:
			bed = BookingRepository.get_bed_for_update(booking.bed_id)
			if bed and bed.status == "occupied":
				BookingRepository.update_bed(bed, status="available")

		booking = BookingRepository.get_booking(booking.id)
		return BookingService._serialize_booking(booking)

	@staticmethod
	@transaction.atomic
	def check_in_booking(booking_reference: str, actor=None, company_id=None):
		if not BookingService._has_any_group(actor, BookingService.APPROVAL_GROUPS):
			raise ApiException("Only site admins can check in guests", status_code=403)

		normalized_company_id = BookingService._normalize_company_id(company_id)
		if normalized_company_id is None:
			normalized_company_id = BookingService._get_actor_hms_scope(actor)

		booking = BookingRepository.get_booking_by_reference_for_update(booking_reference)
		if not booking:
			raise ApiException("Booking not found", status_code=404)
		if booking.status != "confirmed":
			raise ApiException("Only confirmed bookings can be checked in")
		if not BookingService._has_any_group(actor, {"root_admin"}):
			if normalized_company_id is None or booking.hms_id != normalized_company_id:
				raise ApiException("Booking is outside your subsite", status_code=403)

		if booking.inventory_type == "room" and booking.room_id:
			room = BookingRepository.get_room_for_update(booking.room_id)
			if not room or not room.is_active or room.status == "maintenance":
				raise ApiException("This room is not available for check-in")
			BookingRepository.update_room(room, status="occupied")
		if booking.inventory_type == "bed" and booking.bed_id:
			bed = BookingRepository.get_bed_for_update(booking.bed_id)
			if not bed or not bed.is_active or bed.status == "maintenance":
				raise ApiException("This bed is not available for check-in")
			BookingRepository.update_bed(bed, status="occupied")

		BookingRepository.update_booking(booking, status="checked_in")
		booking = BookingRepository.get_booking(booking.id)
		return BookingService._serialize_booking(booking)