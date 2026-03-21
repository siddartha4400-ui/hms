# GraphQL RBAC Examples & Test Queries

This file contains example GraphQL queries and mutations for testing the new role-based access control system.

## 1. Authentication & Login

### Login with Password (Returns Role & Routes)

```graphql
mutation LoginUser {
  login(
    method: "password"
    email: "admin@example.com"
    password: "securepassword123"
  ) {
    success
    message
    token
    refreshToken
    userRole          # ← NEW: User's role
    availableRoutes { # ← NEW: Routes based on role
      path
      name
      description
      icon
      requiresPermission
      visible
    }
  }
}

# Response (for site_admin role):
{
  "data": {
    "login": {
      "success": true,
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "userRole": "site_admin",
      "availableRoutes": [
        {
          "path": "/dashboard",
          "name": "Site Admin Dashboard",
          "description": "Access site admin dashboard",
          "icon": "dashboard",
          "requiresPermission": "dashboard.access_site_dashboard",
          "visible": true
        },
        {
          "path": "/buildings",
          "name": "Manage Buildings",
          "description": "Create, edit, and delete buildings",
          "icon": "apartment",
          "requiresPermission": "buildings.view_all_buildings",
          "visible": true
        },
        ...
      ]
    }
  }
}
```

### Verify OTP Login (Also Returns Role & Routes)

```graphql
mutation VerifyOTP {
  verifyLoginOtp(
    identifier: "user@example.com"
    otp: "123456"
    otpType: "email"
  ) {
    success
    message
    token
    refreshToken
    userRole
    availableRoutes {
      path
      name
      icon
    }
  }
}
```

### Signup (Auto-assigns to normal_user group)

```graphql
mutation Signup {
  signup(
    email: "newuser@example.com"
    password: "securepassword123"
    passwordConfirm: "securepassword123"
    mobileNumber: "+1234567890"
    firstName: "John"
    lastName: "Doe"
  ) {
    success
    message
    user
  }
}

# User is automatically added to 'normal_user' group
```

---

## 2. User Role & Permission Queries

### Get Current User's Role Info

```graphql
query GetUserRoleInfo {
  getUserRoleInfo {
    userId
    email
    username
    roleName          # user's primary role
    groups {
      id
      name
      permissions {
        codename
        name
        appLabel
      }
      permissionCount
    }
    permissions {
      codename
      name
      appLabel
    }
    allPermissions    # List of permission strings
  }
}

# Response (for site_admin):
{
  "data": {
    "getUserRoleInfo": {
      "userId": 5,
      "email": "admin@site.com",
      "username": "admin_user",
      "roleName": "site_admin",
      "groups": [
        {
          "id": 3,
          "name": "site_admin",
          "permissions": [
            {
              "codename": "create_building",
              "name": "Can create buildings",
              "appLabel": "buildings"
            },
            {
              "codename": "view_all_buildings",
              "name": "Can view all buildings in subsite",
              "appLabel": "buildings"
            },
            ...
          ],
          "permissionCount": 26
        }
      ],
      "permissions": [...],
      "allPermissions": [
        "buildings.create_building",
        "buildings.update_building",
        "buildings.delete_building",
        "buildings.view_all_buildings",
        "rooms.create_room",
        "rooms.update_room",
        "rooms.delete_room",
        "rooms.view_all_rooms",
        "rooms.block_room",
        "rooms.set_maintenance",
        "bookings.view_all_bookings",
        "bookings.view_booking_details",
        ...
      ]
    }
  }
}
```

### Get Available Routes for Current User

```graphql
query GetAvailableRoutes {
  getAvailableRoutes {
    path
    name
    description
    icon
    requiresPermission
    visible
  }
}

# Response (for site_admin):
{
  "data": {
    "getAvailableRoutes": [
      {
        "path": "/dashboard",
        "name": "Site Admin Dashboard",
        "description": "Access site admin dashboard",
        "icon": "dashboard",
        "requiresPermission": "dashboard.access_site_dashboard",
        "visible": true
      },
      {
        "path": "/buildings",
        "name": "Manage Buildings",
        "description": "Create, edit, and delete buildings",
        "icon": "apartment",
        "requiresPermission": "buildings.view_all_buildings",
        "visible": true
      },
      {
        "path": "/buildings/:id/floors",
        "name": "Manage Floors",
        "description": "Manage floors in buildings",
        "icon": "layers",
        "requiresPermission": "floors.view_all_floors",
        "visible": true
      },
      {
        "path": "/buildings/:id/rooms",
        "name": "Manage Rooms",
        "description": "Create, edit, and delete rooms",
        "icon": "home",
        "requiresPermission": "rooms.view_all_rooms",
        "visible": true
      },
      ...
    ]
  }
}
```

### Get Current User's Groups

```graphql
query GetUserGroups {
  getUserGroups {
    id
    name
    permissions {
      id
      codename
      name
      appLabel
    }
    permissionCount
  }
}

# Response:
{
  "data": {
    "getUserGroups": [
      {
        "id": 3,
        "name": "site_admin",
        "permissions": [
          {
            "id": 45,
            "codename": "create_building",
            "name": "Can create buildings",
            "appLabel": "buildings"
          },
          {
            "id": 46,
            "codename": "update_building",
            "name": "Can update buildings",
            "appLabel": "buildings"
          },
          ...
        ],
        "permissionCount": 26
      }
    ]
  }
}
```

### Get Current User's Permissions

```graphql
query GetUserPermissions {
  getUserPermissions {
    id
    codename
    name
    appLabel
  }
}

# Response (showing sample permissions):
{
  "data": {
    "getUserPermissions": [
      {
        "id": 1,
        "codename": "create_building",
        "name": "Can create buildings",
        "appLabel": "buildings"
      },
      {
        "id": 2,
        "codename": "update_building",
        "name": "Can update buildings",
        "appLabel": "buildings"
      },
      {
        "id": 3,
        "codename": "delete_building",
        "name": "Can delete buildings",
        "appLabel": "buildings"
      },
      {
        "id": 4,
        "codename": "view_all_buildings",
        "name": "Can view all buildings in subsite",
        "appLabel": "buildings"
      },
      ...
    ]
  }
}
```

---

## 3. Testing Different Roles

### Test Root Admin Login

```graphql
mutation RootAdminLogin {
  login(
    method: "password"
    email: "root@example.com"
    password: "rootpassword"
  ) {
    success
    userRole
    availableRoutes {
      path
      name
    }
  }
}

# Expected response:
# userRole: "root_admin"
# availableRoutes: [
#   { path: "/dashboard", name: "Root Admin Dashboard" },
#   { path: "/subsites", name: "Manage Subsites" },
#   { path: "/subsites/:id/buildings", name: "Manage Buildings" },
#   { path: "/analytics", name: "Analytics" }
# ]
```

### Test Site Admin Login

```graphql
mutation SiteAdminLogin {
  login(
    method: "password"
    email: "siteadmin@example.com"
    password: "siteadminpass"
  ) {
    success
    userRole
    availableRoutes { path name }
  }
}

# Expected response:
# userRole: "site_admin"
# availableRoutes: [
#   { path: "/dashboard", name: "Site Admin Dashboard" },
#   { path: "/buildings", name: "Manage Buildings" },
#   ...
# ]
```

### Test Site Building Manager Login

```graphql
mutation ManagerLogin {
  login(
    method: "password"
    email: "manager@example.com"
    password: "managerpass"
  ) {
    success
    userRole
    availableRoutes { path name }
  }
}

# Expected response:
# userRole: "site_building_manager"
# availableRoutes: [
#   { path: "/dashboard", name: "Booking Dashboard" },
#   { path: "/rooms", name: "Manage Rooms" },
#   { path: "/bookings", name: "View Bookings" },
#   ...
# ]
```

### Test Normal User Login

```graphql
mutation UserLogin {
  login(
    method: "password"
    email: "user@example.com"
    password: "userpass"
  ) {
    success
    userRole
    availableRoutes { path name }
  }
}

# Expected response:
# userRole: "normal_user"
# availableRoutes: [
#   { path: "/booking", name: "Browse & Book" },
#   { path: "/my-bookings", name: "My Bookings" },
#   { path: "/profile", name: "Profile" }
# ]
```

---

## 4. Protected Mutations (with Permission Checks)

### Create Building (Requires Permission)

```graphql
mutation CreateBuilding {
  createBuilding(
    name: "Main Building"
    address: "123 Main St"
    siteId: 1
    description: "Our main property"
  ) {
    success
    message
    building {
      id
      name
    }
  }
}

# Site Admin ✅ CAN create
# Site Manager ❌ CANNOT (no permission)
# Normal User ❌ CANNOT (no permission)
# Root Admin ✅ CAN create
```

### Create Booking (Restricted)

```graphql
mutation CreateBooking {
  createBooking(
    roomId: 5
    checkinDate: "2024-01-15"
    checkoutDate: "2024-01-20"
    guestName: "John Doe"
    contactNumber: "1234567890"
  ) {
    success
    message
    booking {
      id
      roomId
      status
    }
  }
}

# Anyone ✅ CAN create (if authenticated)
# Unless booking.create_booking permission is checked
```

---

## 5. Conditional UI Logic Based on Routes

### Frontend Usage Example

```typescript
// After login, use the availableRoutes to build navigation

const { userRole, availableRoutes } = loginResponse;

// Build sidebar
function Sidebar() {
  return (
    <nav className="sidebar">
      {availableRoutes.map(route => (
        <Link key={route.path} href={route.path}>
          <Icon name={route.icon} />
          <span>{route.name}</span>
        </Link>
      ))}
    </nav>
  );
}

// Show role-specific dashboard
function Dashboard() {
  if (userRole === 'root_admin') {
    return <RootAdminDashboard />;
  } else if (userRole === 'site_admin') {
    return <SiteAdminDashboard />;
  } else if (userRole === 'site_building_manager') {
    return <ManagerDashboard />;
  } else {
    return <UserDashboard />;
  }
}
```

---

## 6. Permission Check Patterns

### Check Permission in Component

```typescript
// Get all permissions after login
const allPermissions = loginResponse.availableRoutes
  .map(r => r.requiresPermission)
  .filter(Boolean);

// Check specific permission
const canCreateBuilding = allPermissions.includes('buildings.create_building');

// Render conditionally
{canCreateBuilding && <CreateBuildingButton />}
```

---

## Testing Checklist

- [ ] Signup creates user in `normal_user` group
- [ ] Login returns `userRole` and `availableRoutes`
- [ ] Different roles see different routes
- [ ] `getUserRoleInfo` returns all permissions
- [ ] `getAvailableRoutes` filters by user role
- [ ] `getUserGroups` shows correct group
- [ ] `getUserPermissions` lists all permissions
- [ ] Mutations fail without required permissions
- [ ] Cross-site data is not accessible

---

## Debugging

### Check Groups in Database

```bash
docker exec -it hms_backend python manage.py shell

>>> from django.contrib.auth.models import Group
>>> for g in Group.objects.all():
...     print(f"\n{g.name}: {g.permissions.count()} perms")
...     for p in g.permissions.all():
...         print(f"  - {p.content_type.app_label}.{p.codename}")
```

### Check User's Groups

```bash
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(email='admin@example.com')
>>> list(user.groups.values_list('name', flat=True))
['site_admin']
```

### Run Setup Command

```bash
docker exec hms_backend python manage.py setup_groups
# or
docker exec hms_backend python manage.py setup_groups --reset
```

---

## Common Issues & Solutions

### Issue: User not in any group after login

**Solution:** Run `python manage.py setup_groups` to create groups

### Issue: Routes not showing in frontend

**Solution:** Verify login response includes `availableRoutes`

### Issue: Permission denied on mutation

**Solution:** Check user's groups and permissions in Django admin

### Issue: Different permissions for same role

**Solution:** Ensure `setup_groups` was run and groups are assigned correctly

