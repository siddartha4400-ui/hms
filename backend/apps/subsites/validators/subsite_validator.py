import re

from common.exceptions import ApiException


HMS_NAME_PATTERN = re.compile(r"^[a-z]+$")


class SubsiteValidator:
	@staticmethod
	def normalize_hms_name(value: str) -> str:
		normalized = (value or "").strip().lower()
		if not normalized:
			raise ApiException("hms_name is required")

		if not HMS_NAME_PATTERN.fullmatch(normalized):
			raise ApiException("hms_name must contain only lowercase letters (a-z), no spaces, numbers, or special characters")

		return normalized

	@staticmethod
	def validate_hms_type(value: int) -> int:
		if value not in (1, 2):
			raise ApiException("hms_type must be 1 (Lodge) or 2 (PG)")
		return value

	@staticmethod
	def validate_create_payload(payload: dict) -> dict:
		required_fields = ["hms_name", "hms_type", "hms_display_name"]
		missing = [field for field in required_fields if payload.get(field) in (None, "")]
		if missing:
			raise ApiException(f"Missing required fields: {', '.join(missing)}")

		payload["hms_name"] = SubsiteValidator.normalize_hms_name(payload["hms_name"])
		payload["hms_type"] = SubsiteValidator.validate_hms_type(int(payload["hms_type"]))

		if payload.get("time_period") is not None and int(payload["time_period"]) <= 0:
			raise ApiException("time_period must be a positive number")

		return payload

	@staticmethod
	def validate_update_payload(payload: dict) -> dict:
		if "hms_name" in payload and payload["hms_name"] is not None:
			payload["hms_name"] = SubsiteValidator.normalize_hms_name(payload["hms_name"])

		if "hms_type" in payload and payload["hms_type"] is not None:
			payload["hms_type"] = SubsiteValidator.validate_hms_type(int(payload["hms_type"]))

		if "time_period" in payload and payload["time_period"] is not None:
			if int(payload["time_period"]) <= 0:
				raise ApiException("time_period must be a positive number")

		return payload