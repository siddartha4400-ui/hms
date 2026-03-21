import graphene
from django.conf import settings

from apps.subsites.services.subsite_service import SubsiteService
from common.exceptions import ApiException


class HMSType(graphene.ObjectType):
	id = graphene.Int()
	hms_name = graphene.String()
	subsite_url = graphene.String()
	hms_type = graphene.Int()
	is_active = graphene.Boolean()
	hms_display_name = graphene.String()
	auth_user_id = graphene.Int()
	attachment_id = graphene.Int()
	about_hms = graphene.String()
	admin_name = graphene.String()
	email = graphene.String()
	mobile_number = graphene.String()
	time_period = graphene.Int()
	logo = graphene.String()
	created_at = graphene.String()
	updated_at = graphene.String()
	created_by = graphene.Int()
	updated_by = graphene.Int()


class HMSNameAvailabilityType(graphene.ObjectType):
	is_available = graphene.Boolean()
	message = graphene.String()
	normalized_name = graphene.String()
	subsite_url = graphene.String()


class Query(graphene.ObjectType):
	subsite_base_domain = graphene.String()
	get_hms = graphene.Field(HMSType, hms_id=graphene.Int(required=True))
	list_hms = graphene.List(
		HMSType,
		is_active=graphene.Boolean(),
		auth_user_id=graphene.Int(),
	)
	check_hms_name_availability = graphene.Field(
		HMSNameAvailabilityType,
		hms_name=graphene.String(required=True),
		exclude_hms_id=graphene.Int(),
	)

	def resolve_get_hms(self, info, hms_id):
		try:
			hms = SubsiteService.get_hms(hms_id)
			return HMSType(**SubsiteService.serialize_hms(hms))
		except ApiException as exc:
			raise Exception(str(exc))

	def resolve_subsite_base_domain(self, info):
		return getattr(settings, 'SUBSITE_BASE_DOMAIN', 'ourdomain.com')

	def resolve_list_hms(self, info, is_active=None, auth_user_id=None):
		records = SubsiteService.list_hms(is_active=is_active, auth_user_id=auth_user_id)
		return [HMSType(**SubsiteService.serialize_hms(item)) for item in records]

	def resolve_check_hms_name_availability(self, info, hms_name, exclude_hms_id=None):
		try:
			data = SubsiteService.check_name_availability(hms_name, exclude_hms_id=exclude_hms_id)
			return HMSNameAvailabilityType(**data)
		except ApiException as exc:
			return HMSNameAvailabilityType(
				is_available=False,
				message=str(exc),
				normalized_name="",
				subsite_url="",
			)