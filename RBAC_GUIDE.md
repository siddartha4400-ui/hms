# RBAC (Role-Based Access Control) Implementation Guide

## Overview

The HMS system now implements a comprehensive role-based access control system using Django's built-in Groups and Permissions framework. This allows for granular control over user access to different features and operations.

---

## Role Hierarchy

### 1. **Root Admin** (Group: `root_admin`)
- ✅ Can create subsites
- ✅ Can access all buildings across all subsites
- ✅ Can view all properties, floors, rooms, beds
- ✅ Full CRUD operations on all entities
- ✅ Can view site-level analytics
- ✅ Access to root admin dashboard

**Permissions:**
```
subsites: create_subsite, update_subsite, delete_subsite, view_all_subsites
buildings: create_building, update_building, delete_building, view_all_buildings
floors: create_floor, update_floor, delete_floor, view_all_floors
rooms: create_room, update_room, delete_room, view_all_rooms, block_room, set_maintenance
beds: create_bed, update_bed, delete_bed, view_all_beds
bookings: create_booking, view_own_bookings, view_all_bookings, cancel_booking, view_booking_details
site_managers: add_site_manager, update_site_manager, remove_site_manager, view_site_managers
dashboard: access_root_dashboard, access_site_dashboard, access_booking_dashboard, view_analytics
```

---

### 2. **Site Admin** (Group: `site_admin`)
- ✅ Can add site managers
- ✅ Can create, edit, delete buildings within their site
- ✅ Can create, edit, delete floors
- ✅ Can create, edit, delete rooms
- ✅ Can create, edit, delete beds
- ✅ Can view all bookings in their site
- ✅ Can block/unblock rooms
- ✅ Can set rooms under maintenance
- ✅ Access to site admin dashboard
- ✅ Can view site-level analytics
- ❌ Cannot create subsites
- ❌ Cannot access buildings outside their site

**Permissions:**
```
buildings: create_building, update_building, delete_building, view_all_buildings
floors: create_floor, update_floor, delete_floor, view_all_floors
rooms: create_room, update_room, delete_room, view_all_rooms, block_room, set_maintenance
beds: create_bed, update_bed, delete_bed, view_all_beds
bookings: view_all_bookings, view_booking_details
site_managers: add_site_manager, update_site_manager, remove_site_manager, view_site_managers
dashboard: access_site_dashboard, view_analytics
```

---

### 3. **Site Building Manager** (Group: `site_building_manager`)
- ✅ Can book rooms
- ✅ Can make rooms under maintenance
- ✅ Can block rooms
- ✅ Can view all bookings
- ✅ Can view booking details
- ✅ Can create bookings
- ❌ Cannot create/edit/delete databases or buildings
- ❌ Cannot manage users or site settings

**Permissions:**
```
rooms: view_all_rooms, block_room, set_maintenance
bookings: create_booking, view_all_bookings, view_booking_details, cancel_booking
dashboard: access_booking_dashboard
```

---

### 4. **Normal User** (Group: `normal_user`)
- ✅ Can login
- ✅ Can browse available rooms at their site
- ✅ Can create bookings
- ✅ Can view their own bookings
- ✅ Can view booking details for their bookings
- ✅ Can view their profile
- ❌ Cannot create/edit/delete anything
- ❌ Cannot access other users' bookings

**Permissions:**
```
bookings: create_booking, view_own_bookings, view_booking_details
rooms: view_all_rooms
```

---

## Setup Instructions

### Step 1: Run the Management Command

The first time you run the system (or after pulling new changes), run this command to set up all groups and permissions:

```bash
# Docker: Run inside backend container
docker exec hms_backend python manage.py setup_groups

# Local development
python manage.py setup_groups
```

**Optional flags:**
```bash
# Reset all groups and recreate them
python manage.py setup_groups --reset
```

### Step 2: Verify Setup

You should see output like:
```
🚀 Starting Groups and Permissions Setup...

📋 Step 1: Setting up ContentTypes and Permissions...
  ✓ Created permission: subsites.create_subsite
  ✓ Created permission: subsites.update_subsite
  ...

👥 Step 2: Setting up Groups...
  ✓ Created group: root_admin
  ✓ Created group: site_admin
  ✓ Created group: site_building_manager
  ✓ Created group: normal_user

🔐 Step 3: Assigning Permissions to Groups...
  ✓ Assigned 33 permissions to root_admin
  ✓ Assigned 19 permissions to site_admin
  ✓ Assigned 6 permissions to site_building_manager
  ✓ Assigned 4 permissions to normal_user

📊 Step 4: Summary...
[Groups Configuration Summary...]

✅ Setup completed successfully!
```

---

## Automatic Group Assignment

### On Signup
When a user signs up via the `signup` mutation, they are automatically assigned to the **`normal_user`** group.

### On Login
When a user logs in:
1. If they have a role set in the User profile (integer 0-3), they are assigned the corresponding group:
   - `role=0` → `normal_user`
   - `role=1` → `site_admin`
   - `role=2` → `root_admin`
   - `role=3` → `site_building_manager`
2. If no role is set, they keep their existing group or default to `normal_user`

### Manual Assignment (Admin)
To manually assign a user to a group via Django admin:

```bash
# Access Django admin
# Navigate to: Django Administration → Auth → Groups
# Select the user and assign to the appropriate group
```

Or via Django shell:

```python
from django.contrib.auth.models import User, Group

# Get user and group
user = User.objects.get(email='user@example.com')
group = Group.objects.get(name='site_admin')

# Add user to group
user.groups.add(group)

# Remove user from group
user.groups.remove(group)

# Clear all groups
user.groups.clear()
```

---

## GraphQL Queries

### Get Current User's Role Info

```graphql
query {
  getUserRoleInfo {
    userId
    email
    username
    roleName
    groups {
      id
      name
      permissionCount
    }
    permissions {
      codename
      name
      appLabel
    }
    allPermissions
  }
}
```

**Response:**
```json
{
  "data": {
    "getUserRoleInfo": {
      "userId": 5,
      "email": "admin@example.com",
      "username": "admin",
      "roleName": "site_admin",
      "groups": [
        {
          "id": 3,
          "name": "site_admin",
          "permissionCount": 19
        }
      ],
      "permissions": [...],
      "allPermissions": [
        "buildings.create_building",
        "buildings.update_building",
        "buildings.delete_building",
        ...
      ]
    }
  }
}
```

---

### Get Available Routes for User

```graphql
query {
  getAvailableRoutes {
    path
    name
    description
    icon
    requiresPermission
    visible
  }
}
```

**Response for Site Admin:**
```json
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
      ...
    ]
  }
}
```

---

### Get User Groups

```graphql
query {
  getUserGroups {
    id
    name
    permissions {
      codename
      name
    }
    permissionCount
  }
}
```

---

### Get User Permissions

```graphql
query {
  getUserPermissions {
    codename
    name
    appLabel
  }
}
```

---

## GraphQL Mutations

### Login (Returns Role & Routes)

```graphql
mutation {
  login(method: "password", email: "user@example.com", password: "password") {
    success
    message
    token
    refreshToken
    userRole
    availableRoutes {
      path
      name
      description
      icon
      visible
    }
  }
}
```

**Response:**
```json
{
  "data": {
    "login": {
      "success": true,
      "message": "Login successful",
      "token": "eyJ...",
      "refreshToken": "eyJ...",
      "userRole": "site_admin",
      "availableRoutes": [
        {
          "path": "/dashboard",
          "name": "Site Admin Dashboard",
          "description": "Access site admin dashboard",
          "icon": "dashboard",
          "visible": true
        },
        ...
      ]
    }
  }
}
```

---

## Permission Checking in Resolvers

### Check User Permission in GraphQL Resolver

```python
from project_graphql.permissions import require_permission, has_permission

class CreateBuildingMutation(graphene.Mutation):
    """Create a building."""
    
    class Arguments:
        name = graphene.String(required=True)
        site_id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    @require_permission('buildings.create_building')
    @staticmethod
    def mutate(root, info, name, site_id):
        # User has 'buildings.create_building' permission
        # ... create building logic
        pass
```

### Multiple Permission Check (Any)

```python
@require_permission('buildings.create_building', 'buildings.update_building')
@staticmethod
def mutate(root, info, ...):
    # User must have ANY of these permissions
    pass
```

### Group Check

```python
@require_permission('group.site_admin', 'group.root_admin')
@staticmethod
def mutate(root, info, ...):
    # User must be in ANY of these groups
    pass
```

### Manual Check

```python
def resolve_something(self, info):
    if not has_permission(info.context.user, 'bookings.view_all_bookings'):
        raise Exception('Permission denied')
    # ... logic
```

---

## Frontend Integration

### Display Routes Based on Role

After login, the frontend receives `availableRoutes` and `userRole`:

```typescript
// After login
const response = await loginMutation({
  method: 'password',
  email,
  password,
});

const { userRole, availableRoutes } = response.data.login;

// Build sidebar/navigation from availableRoutes
const navItems = availableRoutes.map(route => ({
  label: route.name,
  href: route.path,
  icon: route.icon,
}));

// Store userRole for conditional rendering
store.setUserRole(userRole);
```

### Route Protection

```typescript
// pages/dashboard/root/index.tsx
export default function RootDashboard() {
  const { user } = useAuth();
  
  if (!user.hasPermission('dashboard.access_root_dashboard')) {
    return <AccessDenied />;
  }
  
  return <RootDashboardContent />;
}

// Hook to check permission
function usePermission(permission: string) {
  const { user } = useAuth();
  return user?.permissions?.includes(permission) || false;
}

// Usage
if (usePermission('buildings.create_building')) {
  // Show create building button
}
```

---

## Cross-Site Data Protection

### Automatic Enforcement

All queries and mutations automatically enforce the following rules:

1. **Subsite Context Middleware**: Every request includes the subsite_key from the host header
2. **Company Ownership Validation**: Bookings service validates that rooms belong to the user's company
3. **Permission Checks**: Resolvers check user's permissions before returning data

### Example: Booking Creation

```graphql
mutation {
  createBooking(
    roomId: 1,
    checkinDate: "2024-01-15",
    checkoutDate: "2024-01-20"
  ) {
    success
    message
  }
}
```

**What happens internally:**
1. Middleware extracts subsite_key from request host (e.g., `alpha.hms.local` → `alpha`)
2. Middleware validates user's company_id matches the subsite
3. Resolver checks if user has `bookings.create_booking` permission
4. BookingService validates that the room belongs to the user's company
5. If all checks pass, booking is created
6. If any check fails, a 403 Forbidden or 404 error is returned

---

## Example Workflows

### Workflow 1: User Signs Up and Logs In

1. User signs up via GraphQL mutation `signup`
   - User created in database
   - Automatically added to `normal_user` group
   - Sent welcome email

2. User logs in via `login` mutation
   - Credentials verified
   - User retrieved from database
   - Group assigned based on role
   - Available routes returned
   - Frontend uses routes to build navigation

3. User can now:
   - Browse rooms at their site (permission: `rooms.view_all_rooms`)
   - Create bookings (permission: `bookings.create_booking`)
   - View their own bookings (permission: `bookings.view_own_bookings`)

---

### Workflow 2: Admin Creates Site Admin User

1. Root admin creates a new user and assigns role=1

2. During setup/next login:
   - User's Auth model gets related to `site_admin` group
   - `site_admin` group has 19 permissions

3. Site Admin can now:
   - Create buildings, floors, rooms, beds at their site
   - Add site managers
   - View all bookings
   - Access site dashboard

---

### Workflow 3: Permission-Based Feature Flag

```typescript
// components/BookingCard.tsx
export function BookingCard({ booking }: Props) {
  const { user } = useAuth();
  
  return (
    <Card>
      <BookingInfo booking={booking} />
      
      {/* Only show cancel button if user can cancel bookings */}
      {user.permissions?.includes('bookings.cancel_booking') && (
        <CancelButton bookingId={booking.id} />
      )}
      
      {/* Only show admin notes if user is site admin or root admin */}
      {user.permissions?.includes('bookings.view_all_bookings') && (
        <AdminNotes booking={booking} />
      )}
    </Card>
  );
}
```

---

## Troubleshooting

### Issue: Users Not Getting Permissions After Login

**Solution:**
1. Verify `setup_groups` command has been run
2. Check that user's role is set (0-3)
3. Run `setup_groups --reset` to recreate groups
4. Check user's groups in Django admin

### Issue: Permission Check Failing

**Solution:**
1. Verify permission string format: `app_label.codename`
2. Verify group has been assigned the permission
3. Check Django admin: Auth → Groups → Select group → Verify permissions

### Issue: Routes Not Showing in Frontend

**Solution:**
1. Ensure login mutation includes `availableRoutes` in response
2. Verify user's permissions match route requirements
3. Check browser console for GraphQL errors
4. Verify that permissions exist in database

---

## API Documentation

### File Structure

```
backend/
├── apps/
│   └── users/
│       ├── permissions.py          # Permission & group definitions
│       ├── services/
│       │   └── user_service.py     # Updated with group assignment
│       ├── graphql/
│       │   ├── types.py            # New: Permission types & route config
│       │   ├── queries.py          # Updated: New role/route queries
│       │   └── mutations.py        # Updated: Returns role & routes
│       └── management/
│           └── commands/
│               └── setup_groups.py # Management command
└── project_graphql/
    ├── permissions.py             # New: Permission utilities
    └── schema.py                  # Uses new types
```

### Key Files Modified

1. **`apps/users/permissions.py`** - NEW
   - Defines all permission codes
   - Group-to-permission mapping
   - Role-to-group mapping

2. **`apps/users/graphql/types.py`** - NEW
   - GraphQL types for roles/permissions
   - Route definitions by role

3. **`apps/users/graphql/queries.py`** - UPDATED
   - Added `getAvailableRoutes`
   - Added `getUserRoleInfo`
   - Added `getUserGroups`
   - Added `getUserPermissions`

4. **`apps/users/graphql/mutations.py`** - UPDATED
   - `LoginMutation` returns `userRole` and `availableRoutes`
   - `VerifyLoginOTPMutation` returns `userRole` and `availableRoutes`

5. **`apps/users/services/user_service.py`** - UPDATED
   - `signup()` assigns user to `normal_user` group
   - `login_with_password()` assigns role-based group
   - `verify_login_otp()` assigns role-based group

6. **`project_graphql/permissions.py`** - NEW
   - `@require_permission()` decorator
   - `has_permission()` utility
   - `get_user_permissions()` utility
   - `user_has_group()` utility

---

## Next Steps

1. **Run the setup command:**
   ```bash
   docker exec hms_backend python manage.py setup_groups
   ```

2. **Test login with different roles:**
   - Create test users with role=0, 1, 2, 3
   - Login and verify available routes differ

3. **Implement frontend role-based routing:**
   - Use `getAvailableRoutes` to build navigation
   - Protect pages with permission checks

4. **Add permission checks to resolvers:**
   - Use `@require_permission()` decorator on mutations
   - Manually check permissions in complex queries

5. **Set up role assignment UI** (Optional):
   - Create admin panel to assign roles to users
   - Auto-update user groups when role changes

---

## Questions?

For implementation details or clarification on specific permissions, refer to:
- `apps/users/permissions.py` - Complete permission map
- `apps/users/graphql/types.py` - Route definitions by role
- Django Groups & Permissions docs: https://docs.djangoproject.com/en/stable/topics/auth/

