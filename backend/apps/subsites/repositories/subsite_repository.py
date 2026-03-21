from django.contrib.auth.models import User as DjangoUser

from apps.subsites.models import HMS


class SubsiteRepository:
	@staticmethod
	def get_hms_by_id(hms_id: int):
		return HMS.objects.filter(id=hms_id).first()

	@staticmethod
	def get_hms_by_name(hms_name: str):
		return HMS.objects.filter(hms_name=hms_name).first()

	@staticmethod
	def get_hms_by_mobile(mobile_number: str, exclude_hms_id=None):
		queryset = HMS.objects.filter(mobile_number=mobile_number)
		if exclude_hms_id is not None:
			queryset = queryset.exclude(id=exclude_hms_id)
		return queryset.first()

	@staticmethod
	def list_hms(is_active=None, auth_user_id=None):
		queryset = HMS.objects.select_related("auth_user", "logo_attachment")
		if is_active is not None:
			queryset = queryset.filter(is_active=is_active)
		if auth_user_id is not None:
			queryset = queryset.filter(auth_user_id=auth_user_id)
		return queryset.order_by("-created_at")

	@staticmethod
	def create_hms(**kwargs):
		return HMS.objects.create(**kwargs)

	@staticmethod
	def update_hms(hms: HMS, **kwargs):
		for key, value in kwargs.items():
			setattr(hms, key, value)
		hms.full_clean()
		hms.save()
		return hms

	@staticmethod
	def delete_hms(hms: HMS):
		hms.delete()

	@staticmethod
	def get_auth_user_by_id(user_id: int):
		return DjangoUser.objects.filter(id=user_id).first()

	@staticmethod
	def get_auth_user_by_email(email: str):
		return DjangoUser.objects.filter(email=email).first()