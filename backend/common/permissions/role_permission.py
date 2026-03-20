from typing import Iterable


def has_any_role(user_role: str, allowed_roles: Iterable[str]) -> bool:
    return user_role in set(allowed_roles)