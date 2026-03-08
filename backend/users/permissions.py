from functools import wraps
from graphql import GraphQLError


def role_required(allowed_roles):
    """GraphQL decorator to restrict access by user role."""
    def decorator(func):
        @wraps(func)
        def wrapper(root, info, *args, **kwargs):
            user = info.context.user
            if not user.is_authenticated:
                raise GraphQLError("Authentication required")
            if user.role not in allowed_roles:
                raise GraphQLError(
                    f"Permission denied. Required role: {', '.join(allowed_roles)}"
                )
            return func(root, info, *args, **kwargs)
        return wrapper
    return decorator


def admin_required(func):
    """Only admin users can access."""
    return role_required(["admin"])(func)


def manager_required(func):
    """Admin or manager users can access."""
    return role_required(["admin", "manager"])(func)


def staff_required(func):
    """Admin, manager, or staff users can access."""
    return role_required(["admin", "manager", "staff"])(func)
