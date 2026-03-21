from datetime import date

from common.exceptions import ApiException


class BookingValidator:
	@staticmethod
	def parse_date(value, field_name: str) -> date:
		if not value:
			raise ApiException(f"{field_name} is required")
		try:
			return date.fromisoformat(str(value))
		except ValueError as exc:
			raise ApiException(f"{field_name} must be in YYYY-MM-DD format") from exc

	@staticmethod
	def validate_stay(check_in: date, check_out: date):
		if check_out <= check_in:
			raise ApiException("check_out must be after check_in")
		if (check_out - check_in).days > 31:
			raise ApiException("Stay must be less than or equal to 31 days")

	@staticmethod
	def validate_guest_count(value) -> int:
		try:
			parsed = int(value)
		except (TypeError, ValueError) as exc:
			raise ApiException("guest_count must be a valid integer") from exc
		if parsed <= 0:
			raise ApiException("guest_count must be greater than zero")
		return parsed

	@staticmethod
	def validate_payment_method(value: str) -> str:
		normalized = (value or "cod").strip().lower()
		if normalized != "cod":
			raise ApiException("Only cash on delivery is supported right now")
		return normalized

	@staticmethod
	def validate_guests(guests, expected_count: int):
		if not guests or not isinstance(guests, list):
			raise ApiException("At least one guest is required")
		if len(guests) != expected_count:
			raise ApiException("Guest details count must match guest_count")
		normalized = []
		attachment_ids = []
		for index, guest in enumerate(guests, start=1):
			full_name = str((guest or {}).get("full_name") or "").strip()
			if not full_name:
				raise ApiException(f"Guest {index} full_name is required")
			aadhaar_attachment_id = (guest or {}).get("aadhaar_attachment_id")
			if aadhaar_attachment_id is None:
				raise ApiException(f"Guest {index} Aadhaar upload is required")
			try:
				parsed_attachment_id = int(aadhaar_attachment_id)
			except (TypeError, ValueError) as exc:
				raise ApiException(f"Guest {index} Aadhaar attachment id is invalid") from exc
			mobile_number = str((guest or {}).get("mobile_number") or "").strip()
			normalized.append(
				{
					"full_name": full_name,
					"mobile_number": mobile_number,
					"aadhaar_attachment_id": parsed_attachment_id,
				}
			)
			attachment_ids.append(parsed_attachment_id)
		return normalized, attachment_ids