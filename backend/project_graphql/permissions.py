"""
GraphQL permission checking utilities and decorators.
"""
from functools import wraps
from common.exceptions import ApiException


def require_permission(*permissions):
    """
    Decorator to check if user has required permission.
    Can check for specific permissions (authenticated, specific.permission)
    or groups (group.admin, group.manager)
    
    Usage:
        @require_permission('authenticated')  # Just need to be logged in
        @require_permission('bookings.create_booking')  # Need specific permission
        @require_permission('bookings.create_booking', 'bookings.view_all_bookings')  # Any of these
        @require_permission('admin')  # Check for group
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, info, *args, **kwargs):
            user = info.context.user
            
            # Check if authenticated
            if not user or not user.is_authenticated:
                raise Exception('Authentication required')
            
            # If no specific permissions, just need to be authenticated
            if not permissions:
                return func(self, info, *args, **kwargs)
            
            # Check permissions
            has_permission = False
            for perm in permissions:
                # Check for group
                if perm.startswith('group.'):
                    group_name = perm.split('group.')[1]
                    if user.groups.filter(name=group_name).exists():
                        has_permission = True
                        break
                # Check for specific permission
                elif '.' in perm:
                    if user.has_perm(perm):
                        has_permission = True
                        break
                # Check for super admin
                elif perm == 'admin':
                    if user.is_superuser or user.is_staff:
                        has_permission = True
                        break
            
            if not has_permission:
                raise Exception(
                    f'Permission denied. Required one of: {", ".join(permissions)}'
                )
            
            return func(self, info, *args, **kwargs)
        
        return wrapper
    return decorator


def has_permission(user, permission):
    """Check if user has specific permission.
    
    Args:
        user: Django user object
        permission: Permission string (e.g., 'bookings.create_booking')
    
    Returns:
        bool: True if user has permission
    """
    if not user or not user.is_authenticated:
        return False
    
    return user.has_perm(permission)


def get_user_permissions(user):
    """Get all permissions for a user (direct + group).
    
    Args:
        user: Django user object
    
    Returns:
        set: Set of permission strings (app_label.codename)
    """
    if not user:
        return set()
    
    perms = set()
    
    # Add direct user permissions
    for perm in user.user_permissions.all():
        perms.add(f'{perm.content_type.app_label}.{perm.codename}')
    
    # Add group permissions
    for group in user.groups.all():
        for perm in group.permissions.all():
            perms.add(f'{perm.content_type.app_label}.{perm.codename}')
    
    return perms


def user_has_group(user, group_name):
    """Check if user belongs to a group.
    
    Args:
        user: Django user object
        group_name: Name of the group
    
    Returns:
        bool: True if user in group
    """
    if not user:
        return False
    
    return user.groups.filter(name=group_name).exists()


def get_user_groups(user):
    """Get all groups a user belongs to.
    
    Args:
        user: Django user object
    
    Returns:
        list: List of group names
    """
    if not user:
        return []
    
    return list(user.groups.values_list('name', flat=True))
