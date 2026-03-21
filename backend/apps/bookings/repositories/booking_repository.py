from django.db.models import Q

from apps.attachments.models import Attachment
from apps.bookings.models import Booking, BookingGuest
from apps.propertys.models import Bed, Room


class BookingRepository:
	@staticmethod
	def list_bookings(*, user_id=None, hms_id=None):
		queryset = Booking.objects.select_related(
			"hms",
			"city",
			"building",
			"room",
			"bed",
			"booked_by",
		).prefetch_related("guests", "guests__aadhaar_attachment")
		if user_id is not None:
			queryset = queryset.filter(booked_by_id=user_id)
		if hms_id is not None:
			queryset = queryset.filter(hms_id=hms_id)
		return queryset.order_by("-created_at")

	@staticmethod
	def list_available_lodge_rooms(*, city_id=None, hms_name=None):
		queryset = Room.objects.select_related("building", "floor", "building__company", "building__city")
		queryset = queryset.filter(
			is_active=True,
			building__is_active=True,
			floor__is_active=True,
			building__city__is_active=True,
			building__company__is_active=True,
			building__property_type="lodge",
			status="available",
		)
		if city_id is not None:
			queryset = queryset.filter(building__city_id=city_id)
		if hms_name:
			queryset = queryset.filter(building__company__hms_name=hms_name)
		return queryset.order_by("building__name", "room_number", "id")

	@staticmethod
	def list_available_pg_beds(*, city_id=None, hms_name=None):
		queryset = Bed.objects.select_related("room", "room__building", "room__floor", "room__building__company", "room__building__city")
		queryset = queryset.filter(
			is_active=True,
			status="available",
			room__is_active=True,
			room__floor__is_active=True,
			room__building__is_active=True,
			room__building__city__is_active=True,
			room__building__company__is_active=True,
			room__building__property_type="pg",
		)
		if city_id is not None:
			queryset = queryset.filter(room__building__city_id=city_id)
		if hms_name:
			queryset = queryset.filter(room__building__company__hms_name=hms_name)
		return queryset.order_by("room__building__name", "room__room_number", "id")

	@staticmethod
	def has_overlapping_room_booking(room_id: int, check_in, check_out):
		return Booking.objects.filter(
			room_id=room_id,
			status="confirmed",
		).filter(
			Q(check_in__lt=check_out) & Q(check_out__gt=check_in)
		).exists()

	@staticmethod
	def has_overlapping_bed_booking(bed_id: int, check_in, check_out):
		return Booking.objects.filter(
			bed_id=bed_id,
			status="confirmed",
		).filter(
			Q(check_in__lt=check_out) & Q(check_out__gt=check_in)
		).exists()

	@staticmethod
	def get_room_for_update(room_id: int):
		return Room.objects.select_for_update().select_related("building", "floor", "building__company", "building__city").filter(id=room_id).first()

	@staticmethod
	def get_bed_for_update(bed_id: int):
		return Bed.objects.select_for_update().select_related(
			"room",
			"room__building",
			"room__floor",
			"room__building__company",
			"room__building__city",
		).filter(id=bed_id).first()

	@staticmethod
	def create_booking(**kwargs):
		return Booking.objects.create(**kwargs)

	@staticmethod
	def create_booking_guest(**kwargs):
		return BookingGuest.objects.create(**kwargs)

	@staticmethod
	def get_attachment(attachment_id: int):
		return Attachment.objects.filter(id=attachment_id).first()

	@staticmethod
	def assign_attachments_to_booking(attachment_ids, booking_id: int):
		Attachment.objects.filter(id__in=attachment_ids).update(entity_id=booking_id)

	@staticmethod
	def update_room(room, **kwargs):
		for key, value in kwargs.items():
			setattr(room, key, value)
		room.save()
		return room

	@staticmethod
	def update_bed(bed, **kwargs):
		for key, value in kwargs.items():
			setattr(bed, key, value)
		bed.save()
		return bed

	@staticmethod
	def get_booking(booking_id: int):
		return Booking.objects.select_related(
			"hms",
			"city",
			"building",
			"room",
			"bed",
			"booked_by",
		).prefetch_related("guests", "guests__aadhaar_attachment").filter(id=booking_id).first()

	@staticmethod
	def get_booking_by_reference(booking_reference: str):
		return Booking.objects.select_related(
			"hms",
			"city",
			"building",
			"room",
			"bed",
			"booked_by",
		).prefetch_related("guests", "guests__aadhaar_attachment").filter(booking_reference=booking_reference).first()

	@staticmethod
	def cancel_booking(booking):
		booking.status = "cancelled"
		booking.save(update_fields=["status", "updated_at"])
		return booking