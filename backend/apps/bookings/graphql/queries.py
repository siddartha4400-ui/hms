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
	)
	list_bookings = graphene.List(
		BookingType,
		view=graphene.String(required=True),
		mine=graphene.Boolean(),
		hms_id=graphene.Int(),
	)

	def resolve_search_availability(self, info, **kwargs):
		return [AvailabilityOptionType(**item) for item in AvailabilityService.search(kwargs)]

	def resolve_list_bookings(self, info, view, mine=False, hms_id=None):
		actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
		items = BookingService.list_bookings(view=view, mine=mine, hms_id=hms_id, actor=actor)
		return [BookingType(**item) for item in items]