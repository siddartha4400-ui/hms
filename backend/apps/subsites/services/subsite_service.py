from django.conf import settings
from django.contrib.auth.models import User as DjangoUser

from apps.attachments.models import Attachment
from apps.subsites.repositories.subsite_repository import SubsiteRepository
from apps.subsites.validators.subsite_validator import SubsiteValidator
from common.exceptions import ApiException


def _build_subsite_url(hms_name: str) -> str:
	base_domain = getattr(settings, "SUBSITE_BASE_DOMAIN", "ourdomain.com")
	return f"https://{hms_name}.{base_domain}"


def _normalize_mobile_number(value: str) -> str:
	return "".join(ch for ch in (value or "") if ch.isdigit())


class SubsiteService:
	@staticmethod
	def serialize_hms(hms):
		logo_url = ""
		if hms.logo_attachment:
			logo_url = hms.logo_attachment.file_url

		return {
			"id": hms.id,
			"hms_name": hms.hms_name,
			"subsite_url": _build_subsite_url(hms.hms_name),
			"hms_type": hms.hms_type,
			"is_active": hms.is_active,
			"hms_display_name": hms.hms_display_name,
			"auth_user_id": hms.auth_user_id,
			"admin_name": f"{hms.auth_user.first_name} {hms.auth_user.last_name}".strip(),
			"email": hms.auth_user.email,
			"mobile_number": hms.mobile_number,
			"attachment_id": hms.logo_attachment_id,
			"logo": logo_url,
			"about_hms": hms.about_hms,
			"time_period": hms.time_period,
			"created_at": hms.created_at.isoformat() if hms.created_at else "",
			"updated_at": hms.updated_at.isoformat() if hms.updated_at else "",
			"created_by": hms.created_by_id,
			"updated_by": hms.updated_by_id,
		}

	@staticmethod
	def check_name_availability(hms_name: str, exclude_hms_id: int | None = None):
		normalized = SubsiteValidator.normalize_hms_name(hms_name)
		existing = SubsiteRepository.get_hms_by_name(normalized)
		if existing and exclude_hms_id and existing.id == exclude_hms_id:
			existing = None

		return {
			"is_available": existing is None,
			"message": "Available" if existing is None else "Subsite name already exists",
			"normalized_name": normalized,
			"subsite_url": _build_subsite_url(normalized),
		}

	@staticmethod
	def _resolve_admin_user(payload: dict):
		auth_user_id = payload.get("auth_user_id")
		if auth_user_id:
			user = SubsiteRepository.get_auth_user_by_id(auth_user_id)
			if not user:
				raise ApiException("auth_user_id does not exist")
			return user

		email = (payload.get("email") or "").strip().lower()
		password = payload.get("password") or ""
		admin_name = (payload.get("admin_name") or "").strip()

		if not email or not password:
			raise ApiException("Provide auth_user_id or both email and password for admin user")

		existing = SubsiteRepository.get_auth_user_by_email(email)
		if existing:
			raise ApiException("Admin email already exists. Use a different email or provide auth_user_id")

		first_name = admin_name
		last_name = ""
		if " " in admin_name:
			parts = admin_name.split()
			first_name = parts[0]
			last_name = " ".join(parts[1:])

		username = email.split("@")[0]
		candidate = username
		suffix = 1
		while DjangoUser.objects.filter(username=candidate).exists():
			suffix += 1
			candidate = f"{username}{suffix}"

		return DjangoUser.objects.create_user(
			username=candidate,
			email=email,
			password=password,
			first_name=first_name,
			last_name=last_name,
			is_active=True,
		)

	@staticmethod
	def _resolve_attachment(payload: dict):
		logo_attachment_id = payload.get("logo_attachment_id") or payload.get("attachment_id")
		if not logo_attachment_id:
			return None

		attachment = Attachment.objects.filter(id=logo_attachment_id).first()
		if not attachment:
			raise ApiException("logo_attachment_id / attachment_id does not exist")
		return attachment

	@staticmethod
	def _validate_mobile_uniqueness(mobile_number: str, exclude_hms_id=None):
		normalized = _normalize_mobile_number(mobile_number)
		if not normalized:
			return ""

		existing_hms = SubsiteRepository.get_hms_by_mobile(normalized, exclude_hms_id=exclude_hms_id)
		if existing_hms:
			raise ApiException("Mobile number already assigned to another HMS")

		from apps.users.models import User as UserProfile

		existing_profile = UserProfile.objects.filter(mobile_number=normalized).first()
		if existing_profile:
			raise ApiException("Mobile number already exists for another user")

		return normalized

	@staticmethod
	def create_hms(payload: dict, actor=None):
		validated = SubsiteValidator.validate_create_payload(payload)
		availability = SubsiteService.check_name_availability(validated["hms_name"])
		if not availability["is_available"]:
			raise ApiException("Subsite name already exists")

		if validated.get("email"):
			existing_email = SubsiteRepository.get_auth_user_by_email(validated.get("email").strip().lower())
			if existing_email and not validated.get("auth_user_id"):
				raise ApiException("Admin email already exists. Use auth_user_id or a different email")

		normalized_mobile = SubsiteService._validate_mobile_uniqueness(validated.get("mobile_number", ""))

		admin_user = SubsiteService._resolve_admin_user(validated)
		attachment = SubsiteService._resolve_attachment(validated)

		hms = SubsiteRepository.create_hms(
			hms_name=validated["hms_name"],
			hms_type=validated["hms_type"],
			is_active=validated.get("is_active", True),
			hms_display_name=validated["hms_display_name"],
			auth_user=admin_user,
			logo_attachment=attachment,
			about_hms=validated.get("about_hms", ""),
			mobile_number=normalized_mobile,
			time_period=validated.get("time_period", 12),
			created_by=actor,
			updated_by=actor,
		)
		hms.full_clean()
		hms.save()
		return hms

	@staticmethod
	def get_hms(hms_id: int):
		hms = SubsiteRepository.get_hms_by_id(hms_id)
		if not hms:
			raise ApiException("HMS not found", status_code=404)
		return hms

	@staticmethod
	def list_hms(is_active=None, auth_user_id=None):
		return SubsiteRepository.list_hms(is_active=is_active, auth_user_id=auth_user_id)

	@staticmethod
	def update_hms(hms_id: int, payload: dict, actor=None):
		hms = SubsiteService.get_hms(hms_id)
		validated = SubsiteValidator.validate_update_payload(payload)

		if "hms_name" in validated:
			availability = SubsiteService.check_name_availability(validated["hms_name"], exclude_hms_id=hms.id)
			if not availability["is_available"]:
				raise ApiException("Subsite name already exists")

		if "auth_user_id" in validated and validated.get("auth_user_id"):
			admin_user = SubsiteRepository.get_auth_user_by_id(validated["auth_user_id"])
			if not admin_user:
				raise ApiException("auth_user_id does not exist")
			validated["auth_user"] = admin_user
			validated.pop("auth_user_id", None)

		if "mobile_number" in validated:
			validated["mobile_number"] = SubsiteService._validate_mobile_uniqueness(
				validated.get("mobile_number", ""),
				exclude_hms_id=hms.id,
			)

		if "logo_attachment_id" in validated or "attachment_id" in validated:
			validated["logo_attachment"] = SubsiteService._resolve_attachment(validated)
			validated.pop("logo_attachment_id", None)
			validated.pop("attachment_id", None)

		validated["updated_by"] = actor
		return SubsiteRepository.update_hms(hms, **validated)

	@staticmethod
	def delete_hms(hms_id: int):
		hms = SubsiteService.get_hms(hms_id)
		SubsiteRepository.delete_hms(hms)