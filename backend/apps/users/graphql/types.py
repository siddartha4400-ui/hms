"""
GraphQL types for permissions and role-based access control.
"""
import graphene
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class PermissionType(graphene.ObjectType):
    """GraphQL type for permissions."""
    id = graphene.Int()
    codename = graphene.String()
    name = graphene.String()
    app_label = graphene.String()
    
    @staticmethod
    def resolve_app_label(obj, info):
        """Get app label from content type."""
        if hasattr(obj, 'content_type') and obj.content_type:
            return obj.content_type.app_label
        return None


class GroupType(graphene.ObjectType):
    """GraphQL type for user groups."""
    id = graphene.Int()
    name = graphene.String()
    permissions = graphene.List(PermissionType)
    permission_count = graphene.Int()
    
    @staticmethod
    def resolve_permission_count(obj, info):
        """Get count of permissions in group."""
        return obj.permissions.count()


class RoleType(graphene.ObjectType):
    """GraphQL type for role information."""
    role_id = graphene.Int()
    role_name = graphene.String()
    group_name = graphene.String()
    display_name = graphene.String()
    description = graphene.String()


class RouteType(graphene.ObjectType):
    """GraphQL type for available routes for a user."""
    path = graphene.String()
    name = graphene.String()
    description = graphene.String()
    icon = graphene.String()
    requires_permission = graphene.String()
    visible = graphene.Boolean()


class UserRoleInfoType(graphene.ObjectType):
    """GraphQL type for user role and permission information."""
    user_id = graphene.Int()
    email = graphene.String()
    username = graphene.String()
    groups = graphene.List(GroupType)
    permissions = graphene.List(PermissionType)
    all_permissions = graphene.List(graphene.String)
    available_routes = graphene.List(RouteType)
    role_name = graphene.String()
    
    @staticmethod
    def resolve_group_count(obj, info):
        """Get count of groups user belongs to."""
        return obj.groups.count()
    
    @staticmethod
    def resolve_all_permissions(obj, info):
        """Get all permissions (including group permissions)."""
        if hasattr(obj, '_perm_cache'):
            return obj._perm_cache
        
        # Get user permissions + group permissions
        user_perms = set(obj.user_permissions.values_list('content_type__app_label', 'codename'))
        
        # Add group permissions
        for group in obj.groups.all():
            group_perms = group.permissions.values_list('content_type__app_label', 'codename')
            user_perms.update(group_perms)
        
        # Convert to string format
        perm_strings = [f'{app}.{perm}' for app, perm in user_perms]
        obj._perm_cache = perm_strings
        return perm_strings


# Routes Configuration based on Roles
ROUTES_BY_ROLE = {
    "root_admin": [
        {
            "path": "/dashboard",
            "name": "Root Admin Dashboard",
            "description": "Access root admin dashboard with subsite management",
            "icon": "dashboard",
            "requires_permission": "dashboard.access_root_dashboard",
            "visible": True,
        },
        {
            "path": "/subsites",
            "name": "Manage Subsites",
            "description": "Create, edit, and manage subsites",
            "icon": "business",
            "requires_permission": "subsites.create_subsite",
            "visible": True,
        },
        {
            "path": "/subsites/:id/buildings",
            "name": "Manage Buildings",
            "description": "Manage all buildings across subsites",
            "icon": "apartment",
            "requires_permission": "buildings.view_all_buildings",
            "visible": True,
        },
        {
            "path": "/analytics",
            "name": "Analytics",
            "description": "View system-wide analytics and reports",
            "icon": "analytics",
            "requires_permission": "dashboard.view_analytics",
            "visible": True,
        },
    ],
    "site_admin": [
        {
            "path": "/dashboard",
            "name": "Site Admin Dashboard",
            "description": "Access site admin dashboard",
            "icon": "dashboard",
            "requires_permission": "dashboard.access_site_dashboard",
            "visible": True,
        },
        {
            "path": "/buildings",
            "name": "Manage Buildings",
            "description": "Create, edit, and delete buildings",
            "icon": "apartment",
            "requires_permission": "buildings.view_all_buildings",
            "visible": True,
        },
        {
            "path": "/buildings/:id/floors",
            "name": "Manage Floors",
            "description": "Manage floors in buildings",
            "icon": "layers",
            "requires_permission": "floors.view_all_floors",
            "visible": True,
        },
        {
            "path": "/buildings/:id/rooms",
            "name": "Manage Rooms",
            "description": "Create, edit, and delete rooms",
            "icon": "home",
            "requires_permission": "rooms.view_all_rooms",
            "visible": True,
        },
        {
            "path": "/buildings/:id/rooms/:room_id/beds",
            "name": "Manage Beds",
            "description": "Create, edit, and delete beds",
            "icon": "event_bed",
            "requires_permission": "beds.view_all_beds",
            "visible": True,
        },
        {
            "path": "/managers",
            "name": "Manage Site Managers",
            "description": "Add and manage site managers",
            "icon": "people",
            "requires_permission": "site_managers.view_site_managers",
            "visible": True,
        },
        {
            "path": "/bookings",
            "name": "View Bookings",
            "description": "View all bookings in site",
            "icon": "calendar_today",
            "requires_permission": "bookings.view_all_bookings",
            "visible": True,
        },
    ],
    "site_building_manager": [
        {
            "path": "/dashboard",
            "name": "Booking Dashboard",
            "description": "Access booking and maintenance dashboard",
            "icon": "dashboard",
            "requires_permission": "dashboard.access_booking_dashboard",
            "visible": True,
        },
        {
            "path": "/rooms",
            "name": "Manage Rooms",
            "description": "View rooms and set maintenance",
            "icon": "home",
            "requires_permission": "rooms.view_all_rooms",
            "visible": True,
        },
        {
            "path": "/rooms/:id/block",
            "name": "Block Rooms",
            "description": "Block or unblock rooms",
            "icon": "block",
            "requires_permission": "rooms.block_room",
            "visible": True,
        },
        {
            "path": "/bookings",
            "name": "View Bookings",
            "description": "View and manage bookings",
            "icon": "calendar_today",
            "requires_permission": "bookings.view_all_bookings",
            "visible": True,
        },
        {
            "path": "/bookings/create",
            "name": "Create Booking",
            "description": "Create new bookings",
            "icon": "add",
            "requires_permission": "bookings.create_booking",
            "visible": True,
        },
    ],
    "normal_user": [
        {
            "path": "/booking",
            "name": "Browse & Book",
            "description": "Browse available rooms and make bookings",
            "icon": "search",
            "requires_permission": "bookings.create_booking",
            "visible": True,
        },
        {
            "path": "/my-bookings",
            "name": "My Bookings",
            "description": "View your bookings and history",
            "icon": "calendar_today",
            "requires_permission": "bookings.view_own_bookings",
            "visible": True,
        },
        {
            "path": "/profile",
            "name": "Profile",
            "description": "View and edit your profile",
            "icon": "person",
            "requires_permission": None,
            "visible": True,
        },
    ],
}
