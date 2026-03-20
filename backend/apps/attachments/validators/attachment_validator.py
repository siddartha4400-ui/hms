from common.exceptions.api_exception import ApiException


def _parse_int(value, field_name: str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ApiException(f"{field_name} must be a valid integer.") from exc


def validate_attachment_payload(*, file, entity_type, entity_id, hms_id) -> dict[str, int | str]:
    if not file:
        raise ApiException("file is required.")
    if not entity_type:
        raise ApiException("entity_type is required.")

    normalized_entity_type = str(entity_type).strip()
    if not normalized_entity_type:
        raise ApiException("entity_type is required.")

    return {
        "entity_type": normalized_entity_type,
        "entity_id": _parse_int(entity_id, "entity_id"),
        "hms_id": _parse_int(hms_id, "hms_id"),
    }