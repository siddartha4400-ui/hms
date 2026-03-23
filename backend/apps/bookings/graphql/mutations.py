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
	booked_by_name = graphene.String()
	booked_by_email = graphene.String()
	primary_guest_mobile = graphene.String()
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
		company_id = getattr(info.context, "company_id", None)
		try:
			booking = BookingService.create_booking(kwargs, actor=actor, company_id=company_id)
			return CreateBookingMutation(success=True, message="Booking request sent to site admin", booking=BookingType(**booking))
		except ApiException as exc:
			return CreateBookingMutation(success=False, message=str(exc), booking=None)


class ApproveBookingMutation(graphene.Mutation):
	class Arguments:
		booking_reference = graphene.String(required=True)
		hms_id = graphene.Int()

	success = graphene.Boolean()
	message = graphene.String()
	booking = graphene.Field(BookingType)

	@staticmethod
	def mutate(root, info, booking_reference, hms_id=None):
		actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
		company_id = getattr(info.context, "company_id", None) or hms_id or getattr(info.context, "profile_hms_id", None)
		try:
			booking = BookingService.approve_booking(booking_reference, actor=actor, company_id=company_id)
			return ApproveBookingMutation(success=True, message="Booking approved", booking=BookingType(**booking))
		except ApiException as exc:
			return ApproveBookingMutation(success=False, message=str(exc), booking=None)


class RejectBookingMutation(graphene.Mutation):
	class Arguments:
		booking_reference = graphene.String(required=True)
		hms_id = graphene.Int()

	success = graphene.Boolean()
	message = graphene.String()
	booking = graphene.Field(BookingType)

	@staticmethod
	def mutate(root, info, booking_reference, hms_id=None):
		actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
		company_id = getattr(info.context, "company_id", None) or hms_id or getattr(info.context, "profile_hms_id", None)
		try:
			booking = BookingService.reject_booking(booking_reference, actor=actor, company_id=company_id)
			return RejectBookingMutation(success=True, message="Booking rejected", booking=BookingType(**booking))
		except ApiException as exc:
			return RejectBookingMutation(success=False, message=str(exc), booking=None)


class CancelBookingMutation(graphene.Mutation):
	class Arguments:
		booking_reference = graphene.String(required=True)
		hms_id = graphene.Int()

	success = graphene.Boolean()
	message = graphene.String()
	booking = graphene.Field(BookingType)

	@staticmethod
	def mutate(root, info, booking_reference, hms_id=None):
		actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
		company_id = getattr(info.context, "company_id", None) or hms_id or getattr(info.context, "profile_hms_id", None)
		try:
			booking = BookingService.cancel_booking(booking_reference, actor=actor, company_id=company_id)
			return CancelBookingMutation(success=True, message="Booking cancelled", booking=BookingType(**booking))
		except ApiException as exc:
			return CancelBookingMutation(success=False, message=str(exc), booking=None)


class CompleteBookingMutation(graphene.Mutation):
	class Arguments:
		booking_reference = graphene.String(required=True)
		hms_id = graphene.Int()
		checkout_mode = graphene.String()
		extra_amount = graphene.Float()

	success = graphene.Boolean()
	message = graphene.String()
	booking = graphene.Field(BookingType)

	@staticmethod
	def mutate(root, info, booking_reference, hms_id=None, checkout_mode=None, extra_amount=None):
		actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
		company_id = getattr(info.context, "company_id", None) or hms_id or getattr(info.context, "profile_hms_id", None)
		try:
			booking = BookingService.complete_booking(
				booking_reference,
				actor=actor,
				company_id=company_id,
				checkout_mode=checkout_mode,
				extra_amount=extra_amount,
			)
			message = "Guest relieved and booking completed"
			if (checkout_mode or "").strip().lower() == "overstay":
				message = "Overstay checkout completed"
			return CompleteBookingMutation(success=True, message=message, booking=BookingType(**booking))
		except ApiException as exc:
			return CompleteBookingMutation(success=False, message=str(exc), booking=None)


class CheckInBookingMutation(graphene.Mutation):
	class Arguments:
		booking_reference = graphene.String(required=True)
		hms_id = graphene.Int()

	success = graphene.Boolean()
	message = graphene.String()
	booking = graphene.Field(BookingType)

	@staticmethod
	def mutate(root, info, booking_reference, hms_id=None):
		actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
		company_id = getattr(info.context, "company_id", None) or hms_id or getattr(info.context, "profile_hms_id", None)
		try:
			booking = BookingService.check_in_booking(booking_reference, actor=actor, company_id=company_id)
			return CheckInBookingMutation(success=True, message="Guest checked in successfully", booking=BookingType(**booking))
		except ApiException as exc:
			return CheckInBookingMutation(success=False, message=str(exc), booking=None)


class Mutation(graphene.ObjectType):
	create_booking = CreateBookingMutation.Field()
	approve_booking = ApproveBookingMutation.Field()
	reject_booking = RejectBookingMutation.Field()
	cancel_booking = CancelBookingMutation.Field()
	complete_booking = CompleteBookingMutation.Field()
	check_in_booking = CheckInBookingMutation.Field()