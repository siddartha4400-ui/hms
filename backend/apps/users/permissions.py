"""
Permission and Group definitions for HMS role-based access control.
"""

# Group Names
ROOT_ADMIN_GROUP = "root_admin"
SITE_ADMIN_GROUP = "site_admin"
SITE_BUILDING_MANAGER_GROUP = "site_building_manager"
NORMAL_USER_GROUP = "normal_user"

# All Group Names
ALL_GROUPS = [
    ROOT_ADMIN_GROUP,
    SITE_ADMIN_GROUP,
    SITE_BUILDING_MANAGER_GROUP,
    NORMAL_USER_GROUP,
]

# Permission Codes
PERMISSIONS = {
    # Subsite Permissions (Root Admin)
    "subsites": {
        "create_subsite": "Can create subsites",
        "update_subsite": "Can update subsites",
        "delete_subsite": "Can delete subsites",
        "view_all_subsites": "Can view all subsites",
    },
    # Building Permissions (Site Admin + Root Admin)
    "buildings": {
        "create_building": "Can create buildings",
        "update_building": "Can update buildings",
        "delete_building": "Can delete buildings",
        "view_all_buildings": "Can view all buildings in subsite",
    },
    # Floor Permissions (Site Admin + Root Admin)
    "floors": {
        "create_floor": "Can create floors",
        "update_floor": "Can update floors",
        "delete_floor": "Can delete floors",
        "view_all_floors": "Can view all floors in subsite",
    },
    # Room Permissions (Site Admin + Site Manager)
    "rooms": {
        "create_room": "Can create rooms",
        "update_room": "Can update rooms",
        "delete_room": "Can delete rooms",
        "view_all_rooms": "Can view all rooms in subsite",
        "block_room": "Can block/unblock rooms",
        "set_maintenance": "Can set room under maintenance",
    },
    # Bed Permissions (Site Admin + Room Manager)
    "beds": {
        "create_bed": "Can create beds",
        "update_bed": "Can update beds",
        "delete_bed": "Can delete beds",
        "view_all_beds": "Can view all beds in subsite",
    },
    # Booking Permissions (All authenticated users)
    "bookings": {
        "create_booking": "Can create bookings",
        "view_own_bookings": "Can view own bookings",
        "view_all_bookings": "Can view all bookings in subsite",
        "cancel_booking": "Can cancel bookings",
        "view_booking_details": "Can view booking details",
    },
    # Site Manager Permissions (Site Admin)
    "site_managers": {
        "add_site_manager": "Can add site managers",
        "update_site_manager": "Can update site managers",
        "remove_site_manager": "Can remove site managers",
        "view_site_managers": "Can view site managers",
    },
    # Dashboard Permissions
    "dashboard": {
        "access_root_dashboard": "Can access root admin dashboard",
        "access_site_dashboard": "Can access site admin dashboard",
        "access_booking_dashboard": "Can access booking dashboard",
        "view_analytics": "Can view site analytics",
    },
}

# Group Permission Mapping
GROUP_PERMISSIONS_MAP = {
    ROOT_ADMIN_GROUP: [
        # Full access to subsites
        ("subsites", "create_subsite"),
        ("subsites", "update_subsite"),
        ("subsites", "delete_subsite"),
        ("subsites", "view_all_subsites"),
        # Full access to buildings
        ("buildings", "create_building"),
        ("buildings", "update_building"),
        ("buildings", "delete_building"),
        ("buildings", "view_all_buildings"),
        # Full access to floors
        ("floors", "create_floor"),
        ("floors", "update_floor"),
        ("floors", "delete_floor"),
        ("floors", "view_all_floors"),
        # Full access to rooms
        ("rooms", "create_room"),
        ("rooms", "update_room"),
        ("rooms", "delete_room"),
        ("rooms", "view_all_rooms"),
        ("rooms", "block_room"),
        ("rooms", "set_maintenance"),
        # Full access to beds
        ("beds", "create_bed"),
        ("beds", "update_bed"),
        ("beds", "delete_bed"),
        ("beds", "view_all_beds"),
        # All booking permissions
        ("bookings", "create_booking"),
        ("bookings", "view_own_bookings"),
        ("bookings", "view_all_bookings"),
        ("bookings", "cancel_booking"),
        ("bookings", "view_booking_details"),
        # Site manager management
        ("site_managers", "add_site_manager"),
        ("site_managers", "update_site_manager"),
        ("site_managers", "remove_site_manager"),
        ("site_managers", "view_site_managers"),
        # Dashboard access
        ("dashboard", "access_root_dashboard"),
        ("dashboard", "access_site_dashboard"),
        ("dashboard", "access_booking_dashboard"),
        ("dashboard", "view_analytics"),
    ],
    SITE_ADMIN_GROUP: [
        # Building CRUD within subsite
        ("buildings", "create_building"),
        ("buildings", "update_building"),
        ("buildings", "delete_building"),
        ("buildings", "view_all_buildings"),
        # Floor CRUD
        ("floors", "create_floor"),
        ("floors", "update_floor"),
        ("floors", "delete_floor"),
        ("floors", "view_all_floors"),
        # Room CRUD
        ("rooms", "create_room"),
        ("rooms", "update_room"),
        ("rooms", "delete_room"),
        ("rooms", "view_all_rooms"),
        ("rooms", "block_room"),
        ("rooms", "set_maintenance"),
        # Bed CRUD
        ("beds", "create_bed"),
        ("beds", "update_bed"),
        ("beds", "delete_bed"),
        ("beds", "view_all_beds"),
        # Site manager management
        ("site_managers", "add_site_manager"),
        ("site_managers", "update_site_manager"),
        ("site_managers", "remove_site_manager"),
        ("site_managers", "view_site_managers"),
        # Booking viewing
        ("bookings", "view_all_bookings"),
        ("bookings", "view_booking_details"),
        # Dashboard access
        ("dashboard", "access_site_dashboard"),
        ("dashboard", "view_analytics"),
    ],
    SITE_BUILDING_MANAGER_GROUP: [
        # Room blocking and maintenance
        ("rooms", "view_all_rooms"),
        ("rooms", "block_room"),
        ("rooms", "set_maintenance"),
        # Booking operations
        ("bookings", "create_booking"),
        ("bookings", "view_all_bookings"),
        ("bookings", "view_booking_details"),
        ("bookings", "cancel_booking"),
        # Dashboard
        ("dashboard", "access_booking_dashboard"),
    ],
    NORMAL_USER_GROUP: [
        # View and create bookings
        ("bookings", "create_booking"),
        ("bookings", "view_own_bookings"),
        ("bookings", "view_booking_details"),
        # View rooms available
        ("rooms", "view_all_rooms"),
    ],
}

# Role to Group Mapping (backwards compatibility)
ROLE_TO_GROUP = {
    2: ROOT_ADMIN_GROUP,      # Root Admin
    1: SITE_ADMIN_GROUP,      # Site Admin
    3: SITE_BUILDING_MANAGER_GROUP,  # Site Building Manager
    0: NORMAL_USER_GROUP,     # Normal User
}

# Role Display Names
ROLE_DISPLAY_NAMES = {
    0: "Normal User",
    1: "Site Admin",
    2: "Root Admin",
    3: "Site Building Manager",
}


def get_all_permissions():
    """Get all permissions in (app_label, codename) format."""
    perms = []
    for app_label, perm_dict in PERMISSIONS.items():
        for codename, name in perm_dict.items():
            perms.append((app_label, codename, name))
    return perms


def get_group_permissions(group_name):
    """Get permissions for a specific group."""
    return GROUP_PERMISSIONS_MAP.get(group_name, [])


def get_role_display_name(role):
    """Get display name for a role."""
    return ROLE_DISPLAY_NAMES.get(role, "Unknown Role")


def get_group_from_role(role):
    """Get group name from role integer."""
    return ROLE_TO_GROUP.get(role, NORMAL_USER_GROUP)
