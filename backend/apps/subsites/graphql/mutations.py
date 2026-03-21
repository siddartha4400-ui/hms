import graphene

from apps.subsites.graphql.queries import HMSType
from apps.subsites.services.subsite_service import SubsiteService
from common.exceptions import ApiException


class CreateHMSMutation(graphene.Mutation):
	class Arguments:
		hms_name = graphene.String(required=True)
		hms_type = graphene.Int(required=True)
		is_active = graphene.Boolean()
		hms_display_name = graphene.String(required=True)
		auth_user_id = graphene.Int()
		attachment_id = graphene.Int()
		logo_attachment_id = graphene.Int()
		about_hms = graphene.String()
		admin_name = graphene.String()
		email = graphene.String()
		mobile_number = graphene.String()
		password = graphene.String()
		time_period = graphene.Int()

	success = graphene.Boolean()
	message = graphene.String()
	hms = graphene.Field(HMSType)

	@staticmethod
	def mutate(root, info, **kwargs):
		try:
			actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
			hms = SubsiteService.create_hms(kwargs, actor=actor)
			return CreateHMSMutation(
				success=True,
				message="HMS created successfully",
				hms=HMSType(**SubsiteService.serialize_hms(hms)),
			)
		except ApiException as exc:
			return CreateHMSMutation(success=False, message=str(exc), hms=None)
		except Exception as exc:
			return CreateHMSMutation(success=False, message=str(exc), hms=None)


class UpdateHMSMutation(graphene.Mutation):
	class Arguments:
		hms_id = graphene.Int(required=True)
		hms_name = graphene.String()
		hms_type = graphene.Int()
		is_active = graphene.Boolean()
		hms_display_name = graphene.String()
		auth_user_id = graphene.Int()
		attachment_id = graphene.Int()
		logo_attachment_id = graphene.Int()
		about_hms = graphene.String()
		mobile_number = graphene.String()
		time_period = graphene.Int()

	success = graphene.Boolean()
	message = graphene.String()
	hms = graphene.Field(HMSType)

	@staticmethod
	def mutate(root, info, hms_id, **kwargs):
		try:
			actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
			hms = SubsiteService.update_hms(hms_id, kwargs, actor=actor)
			return UpdateHMSMutation(
				success=True,
				message="HMS updated successfully",
				hms=HMSType(**SubsiteService.serialize_hms(hms)),
			)
		except ApiException as exc:
			return UpdateHMSMutation(success=False, message=str(exc), hms=None)
		except Exception as exc:
			return UpdateHMSMutation(success=False, message=str(exc), hms=None)


class DeleteHMSMutation(graphene.Mutation):
	class Arguments:
		hms_id = graphene.Int(required=True)

	success = graphene.Boolean()
	message = graphene.String()

	@staticmethod
	def mutate(root, info, hms_id):
		try:
			SubsiteService.delete_hms(hms_id)
			return DeleteHMSMutation(success=True, message="HMS deleted successfully")
		except ApiException as exc:
			return DeleteHMSMutation(success=False, message=str(exc))
		except Exception as exc:
			return DeleteHMSMutation(success=False, message=str(exc))


class Mutation(graphene.ObjectType):
	create_hms = CreateHMSMutation.Field()
	update_hms = UpdateHMSMutation.Field()
	delete_hms = DeleteHMSMutation.Field()