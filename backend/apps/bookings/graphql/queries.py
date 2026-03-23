import graphene

from apps.bookings.services.availability_service import AvailabilityService
from apps.bookings.services.booking_service import BookingService


class AvailabilityOptionType(graphene.ObjectType):
	inventory_type = graphene.String()
	booking_target_id = graphene.Int()
	hms_id = graphene.Int()
	hms_name = graphene.String()
	hms_display_name = graphene.String()
	image_url = graphene.String()
	city_id = graphene.Int()
	city_name = graphene.String()
	building_id = graphene.Int()
	building_name = graphene.String()
	floor_id = graphene.Int()
	floor_number = graphene.Int()
	location = graphene.String()
	property_type = graphene.String()
	room_id = graphene.Int()
	room_number = graphene.String()
	room_type = graphene.String()
	bed_id = graphene.Int()
	bed_number = graphene.String()
	guest_capacity = graphene.Int()
	price_per_day = graphene.Float()
	price_per_month = graphene.Float()
	total_amount = graphene.Float()
	available = graphene.Boolean()


class BookingGuestType(graphene.ObjectType):
	id = graphene.Int()
	full_name = graphene.String()
	mobile_number = graphene.String()
	aadhaar_attachment_id = graphene.Int()
	aadhaar_attachment_url = graphene.String()
	last_booking_reference = graphene.String()


class BookingType(graphene.ObjectType):
	id = graphene.Int()
	booking_reference = graphene.String()
	status = graphene.String()
	payment_method = graphene.String()
	inventory_type = graphene.String()
	hms_id = graphene.Int()
	hms_name = graphene.String()
	hms_display_name = graphene.String()
	city_id = graphene.Int()
	city_name = graphene.String()
	building_id = graphene.Int()
	building_name = graphene.String()
	room_id = graphene.Int()
	room_number = graphene.String()
	bed_id = graphene.Int()
	bed_number = graphene.String()
	check_in = graphene.String()
	check_out = graphene.String()
	guest_count = graphene.Int()
	total_amount = graphene.Float()
	special_request = graphene.String()
	booked_by_name = graphene.String()
	booked_by_email = graphene.String()
	primary_guest_mobile = graphene.String()
	guests = graphene.List(BookingGuestType)
	created_at = graphene.String()
	created_at_utc = graphene.String()


class Query(graphene.ObjectType):
	search_availability = graphene.List(
		AvailabilityOptionType,
		city_id=graphene.Int(),
		check_in=graphene.String(required=True),
		check_out=graphene.String(required=True),
		guest_count=graphene.Int(required=True),
		hms_name=graphene.String(),
		property_type=graphene.String(),
	)
	list_bookings = graphene.List(
		BookingType,
		view=graphene.String(required=True),
		mine=graphene.Boolean(),
		hms_id=graphene.Int(),  # explicit override from frontend
	)
	my_recent_guests = graphene.List(BookingGuestType, limit=graphene.Int())

	def resolve_search_availability(self, info, **kwargs):
		subsite_key = getattr(info.context, "subsite_key", None)
		if subsite_key:
			kwargs["hms_name"] = subsite_key
		return [AvailabilityOptionType(**item) for item in AvailabilityService.search(kwargs)]

	def resolve_list_bookings(self, info, view, mine=False, hms_id=None):
		actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
		if hms_id is None:
			# Prefer host-based subsite context (set when request comes via subsite domain).
			hms_id = getattr(info.context, "company_id", None)
		if hms_id is None and not mine:
			# For admin views (mine=False) with no host context, scope to the admin's own HMS
			# (profile_hms_id is set by RequestContextMiddleware from the user profile).
			# Do NOT apply this for mine=True - users should see all their bookings.
			hms_id = getattr(info.context, "profile_hms_id", None)
		items = BookingService.list_bookings(view=view, mine=mine, hms_id=hms_id, actor=actor)
		return [BookingType(**item) for item in items]

	def resolve_my_recent_guests(self, info, limit=8):
		actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
		items = BookingService.list_recent_guests(actor=actor, limit=limit)
		return [BookingGuestType(**item) for item in items]