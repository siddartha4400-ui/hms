from common.exceptions import ApiException


class PropertyValidator:
    @staticmethod
    def require(value, field_name: str):
        if value is None:
            raise ApiException(f"{field_name} is required")
        if isinstance(value, str) and not value.strip():
            raise ApiException(f"{field_name} is required")
        return value

    @staticmethod
    def validate_property_type(value: str):
        normalized = (value or "").strip().lower()
        if normalized not in {"pg", "lodge"}:
            raise ApiException("property_type must be pg or lodge")
        return normalized

    @staticmethod
    def validate_room_type(value: str):
        normalized = (value or "").strip().lower()
        if normalized not in {"ac", "non_ac", "single", "double", "dorm", "deluxe"}:
            raise ApiException("room_type must be ac, non_ac, single, double, dorm, or deluxe")
        return normalized

    @staticmethod
    def validate_room_status(value: str):
        normalized = (value or "").strip().lower()
        if normalized not in {"available", "occupied", "maintenance"}:
            raise ApiException("status must be available, occupied, or maintenance")
        return normalized

    @staticmethod
    def validate_bed_status(value: str):
        normalized = (value or "").strip().lower()
        if normalized not in {"available", "occupied", "maintenance"}:
            raise ApiException("bed status must be available, occupied, or maintenance")
        return normalized

    @staticmethod
    def validate_positive_int(value, field_name: str):
        ivalue = int(value)
        if ivalue <= 0:
            raise ApiException(f"{field_name} must be greater than zero")
        return ivalue
