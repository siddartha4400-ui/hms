import graphene

from apps.bookings.services.booking_service import BookingService
from common.exceptions import ApiException


class BookingGuestInput(graphene.InputObjectType):
	full_name = graphene.String(required=True)
	mobile_number = graphene.String()
	aadhaar_attachment_id = graphene.Int(required=True)


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


class CreateBookingMutation(graphene.Mutation):
	class Arguments:
		inventory_type = graphene.String(required=True)
		room_id = graphene.Int()
		bed_id = graphene.Int()
		check_in = graphene.String(required=True)
		check_out = graphene.String(required=True)
		guest_count = graphene.Int(required=True)
		payment_method = graphene.String(required=True)
		special_request = graphene.String()
		guests = graphene.List(BookingGuestInput, required=True)

	success = graphene.Boolean()
	message = graphene.String()
	booking = graphene.Field(BookingType)

	@staticmethod
	def mutate(root, info, **kwargs):
		actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
		try:
			booking = BookingService.create_booking(kwargs, actor=actor)
			return CreateBookingMutation(success=True, message="Booking confirmed", booking=BookingType(**booking))
		except ApiException as exc:
			return CreateBookingMutation(success=False, message=str(exc), booking=None)


class CancelBookingMutation(graphene.Mutation):
	class Arguments:
		booking_reference = graphene.String(required=True)

	success = graphene.Boolean()
	message = graphene.String()
	booking = graphene.Field(BookingType)

	@staticmethod
	def mutate(root, info, booking_reference):
		try:
			booking = BookingService.cancel_booking(booking_reference)
			return CancelBookingMutation(success=True, message="Booking cancelled", booking=BookingType(**booking))
		except ApiException as exc:
			return CancelBookingMutation(success=False, message=str(exc), booking=None)


class Mutation(graphene.ObjectType):
	create_booking = CreateBookingMutation.Field()
	cancel_booking = CancelBookingMutation.Field()