from django.core.validators import validate_email
from django.core.exceptions import ValidationError


def is_valid_email(value: str) -> bool:
    try:
        validate_email(value)
    except ValidationError:
        return False
    return True