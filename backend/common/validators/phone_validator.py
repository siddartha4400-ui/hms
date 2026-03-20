import re


PHONE_REGEX = re.compile(r"^\+?[0-9]{8,15}$")


def is_valid_phone(value: str) -> bool:
    return bool(PHONE_REGEX.fullmatch(value or ""))