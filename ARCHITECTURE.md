# RBAC Architecture Diagram & System Design

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React/Next.js)                         │
│                                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Root Admin   │  │ Site Admin   │  │   Manager   │  │ Normal User  │ │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard  │  │  Dashboard   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │         │
│         └─────────────────┼─────────────────┼─────────────────┘         │
│                           │                 │                           │
│                     GraphQL Queries:                                      │
│         - getAvailableRoutes()  (returns filtered routes per role)       │
│         - getUserRoleInfo()     (returns role & permissions)             │
│         - getUserGroups()       (returns user's groups)                  │
│         - getUserPermissions()  (returns all permissions)                │
│                                                                            │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ HTTPS/GraphQL
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    GRAPHQL API (Django + Graphene)                        │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        Query Resolvers                               │ │
│  │                                                                      │ │
│  │  getUserRoleInfo: Get user's role and all permissions              │ │
│  │  getAvailableRoutes: Filter routes by user's role  ◄──┐            │ │
│  │  getUserGroups: Get user's Django groups                          │ │
│  │  getUserPermissions: Get combined direct + group perms            │ │
│  │                                                       │            │ │
│  └───────────────────────────────────────────────────────┼────────────┘ │
│                                                            │               │
│  ┌────────────────────────────────────────────────────────▼────────────┐ │
│  │                    Mutation Resolvers                               │ │
│  │   (with @require_permission decorators)                            │ │
│  │                                                                      │ │
│  │  login/verifyLoginOtp: Returns token + userRole + availableRoutes  │ │
│  │  signup: Auto-assigns user to normal_user group                    │ │
│  │  createBuilding: @require_permission('buildings.create_building')  │ │
│  │  createBooking: @require_permission('bookings.create_booking')     │ │
│  │  ... other mutations with permission checks                         │ │
│  │                                                                      │ │
│  └──────────────────────────┬──────────────────────────────────────────┘ │
│                             │                                              │
│  ┌──────────────────────────▼──────────────────────────────────────────┐ │
│  │              BusinessLogic Layer (Services)                          │ │
│  │                                                                      │ │
│  │  BookingService: Creates bookings (validates company context)      │ │
│  │  BuildingService: Creates/edits buildings (validates subsite)      │ │
│  │  AuthService: Handles signup/login (assigns groups automatically)  │ │
│  │  ... other service classes                                          │ │
│  │                                                                      │ │
│  └──────────────────────────┬──────────────────────────────────────────┘ │
│                             │                                              │
│  ┌──────────────────────────▼──────────────────────────────────────────┐ │
│  │            Middleware (Request Processing)                           │ │
│  │                                                                      │ │
│  │  SubsiteContextMiddleware:                                          │ │
│  │    1. Extract host header (e.g., "alpha.hms.local")               │ │
│  │    2. Derive subsite_key from subdomain ("alpha")                 │ │
│  │    3. Query HMS table for is_active=True                          │ │
│  │    4. Attach company_id to request object                         │ │
│  │    5. Block unknown subsites with 403 error                       │ │
│  │                                                                      │ │
│  │  RequestContextMiddleware:                                          │ │
│  │    - Attach user_id and company_id to GraphQL info.context        │ │
│  │    - Enable automatic company filtering in resolvers              │ │
│  │                                                                      │ │
│  └──────────────────────────┬──────────────────────────────────────────┘ │
│                             │                                              │
│  ┌──────────────────────────▼──────────────────────────────────────────┐ │
│  │                  Django ORM Layer                                    │ │
│  │                                                                      │ │
│  │  - Query filtering by company_id/subsite                           │ │
│  │  - User queryset filtered by auth                                  │ │
│  │  - Group/Permission lookups from auth.models                       │ │
│  │                                                                      │ │
│  └──────────────────────────┬──────────────────────────────────────────┘ │
│                             │                                              │
└─────────────────────────────┼────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                                   │
│                                                                            │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────────────────┐   │
│  │  auth_user       │  │  auth_group    │  │  auth_permission       │   │
│  ├──────────────────┤  ├────────────────┤  ├────────────────────────┤   │
│  │ id               │  │ id             │  │ id                     │   │
│  │ email            │  │ name           │  │ content_type_id        │   │
│  │ password_hash    │  │                │  │ codename               │   │
│  │ is_active        │  │                │  │ name                   │   │
│  │ is_staff         │  │                │  │                        │   │
│  │ is_superuser     │  │                │  │ Examples:              │   │
│  └──────────────────┘  └────────────────┘  │ - buildings.create     │   │
│         │                      │           │ - rooms.block_room     │   │
│         │                      │           │ - bookings.create      │   │
│  ┌──────▼──────────┐  ┌───────▼──────┐    │ - site_admin.*        │   │
│  │ user_profile     │  │ auth_user_   │    └────────────────────────┘   │
│  │ (HMS extended)   │  │ groups       │                                  │
│  ├──────────────────┤  ├─────────────┬┤    ┌────────────────────────┐   │
│  │ id               │  │ user_id  │g│    │ auth_group_           │   │
│  │ auth_user_id     │  │ group_id │r│    │ permissions            │   │
│  │ role (0-3)       │  └────────────┘    ├────────────────────────┤   │
│  │ company_id       │                    │ group_id               │   │
│  │ mobile_number    │                    │ permission_id          │   │
│  │ is_verified      │                    │                        │   │
│  │ is_active        │                    │ For each group:        │   │
│  └──────────────────┘                    │ - root_admin: 35 perms │   │
│                                          │ - site_admin: 26 perms │   │
│  ┌──────────────────────────────────┐   │ - manager: 8 perms     │   │
│  │ HMS (subsites table)             │   │ - normal_user: 4 perms │   │
│  ├──────────────────────────────────┤   └────────────────────────┘   │
│  │ id                               │                                  │
│  │ hms_name (e.g., "alpha")         │   ┌────────────────────────┐   │
│  │ is_active                        │   │ ContentType            │   │
│  │ auth_user_id (site admin)        │   ├────────────────────────┤   │
│  │ ...                              │   │ app_label              │   │
│  │                                  │   │ model                  │   │
│  │ Groups each site admin to their  │   │                        │   │
│  │ company_id                       │   │ For permissions:       │   │
│  └──────────────────────────────────┘   │ - buildings            │   │
│                                          │ - rooms                │   │
│  ┌──────────────────────────────────┐   │ - bookings             │   │
│  │ All other models                 │   │ - dashboard            │   │
│  │ (Booking, Building, Room, etc.)  │   │ - site_managers        │   │
│  │                                  │   │ - subsites             │   │
│  │ Auto-filtered by company_id      │   └────────────────────────┘   │
│  │ from SubsiteContextMiddleware     │                                 │
│  └──────────────────────────────────┘                                 │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Example: User Login

```
1. Frontend sends login mutation
   ┌─────────────────────────────────────────────┐
   │ mutation { login(...) { token userRole ... } │
   └────────────────────┬────────────────────────┘
                        │
                        ▼
2. Django receives request → SubsiteContextMiddleware
   ┌─────────────────────────────────────────────┐
   │ Extract host: "alpha.hms.local"            │
   │ Derive subsite_key: "alpha"                │
   │ Query HMS.objects.get(hms_name="alpha")    │
   │ Attach company_id to request               │
   └────────────────────┬────────────────────────┘
                        │
                        ▼
3. GraphQL resolves mutation: LoginMutation.mutate()
   ┌─────────────────────────────────────────────┐
   │ user, django_user = AuthService.login()   │
   │ ✓ Credentials verified                     │
   │ ✓ User assignments to group determined     │
   └────────────────────┬────────────────────────┘
                        │
                        ▼
4. AuthService.login_with_password()
   ┌─────────────────────────────────────────────┐
   │ _assign_user_group(django_user, user)     │
   │ ✓ Get user's role (0-3)                    │
   │ ✓ Map to group (root_admin, site_admin...) │
   │ ✓ Add user to group if not already         │
   └────────────────────┬────────────────────────┘
                        │
                        ▼
5. Return login response with role & routes
   ┌─────────────────────────────────────────────┐
   │ {                                            │
   │   success: true                             │
   │   token: "eyJ..."                          │
   │   userRole: "site_admin"                   │
   │   availableRoutes: [                        │
   │     { path: "/dashboard", ... }            │
   │     { path: "/buildings", ... }            │
   │     ...                                      │
   │   ]                                          │
   │ }                                            │
   └────────────────────┬────────────────────────┘
                        │
                        ▼
6. Frontend receives response
   ┌─────────────────────────────────────────────┐
   │ ✓ Store token in localStorage              │
   │ ✓ Store userRole in context                │
   │ ✓ Build navigation from availableRoutes    │
   │ ✓ Show site_admin dashboard                │
   └─────────────────────────────────────────────┘
```

---

## 🔐 Permission Check Flow: Create Building

```
1. Frontend sends mutation
   ┌──────────────────────────────────────────────┐
   │ mutation {                                    │
   │   createBuilding(name: "Main", siteId: 1) { │
   │     success                                  │
   │   }                                           │
   │ }                                             │
   └────────────────────┬─────────────────────────┘
                        │
                        ▼
2. Django middleware attaches subsite context
   ┌──────────────────────────────────────────────┐
   │ SubsiteContextMiddleware:                     │
   │ - Extract host: "alpha.hms.local"           │
   │ - Query HMS: company_id = 2                 │
   │ - Attach to request: request.company_id = 2 │
   └────────────────────┬─────────────────────────┘
                        │
                        ▼
3. GraphQL resolver: CreateBuildingMutation
   ┌──────────────────────────────────────────────┐
   │ @require_permission('buildings.create')     │
   │ def mutate(root, info, name, siteId):       │
   │   ✓ Check user has permission               │
   │   ✗ Permission denied if missing            │
   └────────────────────┬─────────────────────────┘
                        │
                        ▼
4. Permission check in decorator
   ┌──────────────────────────────────────────────┐
   │ require_permission decorator:                 │
   │ - Get user from info.context                │
   │ - Check: user.has_perm('buildings.create')  │
   │ - Resolution:                                │
   │   - Check direct permissions                │
   │   - Check group permissions                 │
   │   - Allow if found, deny if not             │
   └────────────────────┬─────────────────────────┘
                        │
                    Has Perm?
                   /             \
                  ▼               ▼
            ✓ Yes              ✗ No
            │                  │
            ▼                  ▼
5. Pass to service       Raise Exception
   ┌──────────────────────────────────┐
   │ BuildingService.create()         │
   │ - Validate building data         │
   │ - Check company ownership        │ ┌─────────────────┐
   │ - Save to DB                     │ │ Exception:      │
   │                                  │ │ "Permission    │
   │ Response: {                      │ │ denied. Need:  │
   │   success: true,                 │ │ buildings.     │
   │   building: { id, name... }      │ │ create"        │
   │ }                                 │ └─────────────────┘
   └──────────────────────────────────┘
            │
            ▼
   Send to Database
   └────────────────────────────────────┐
                                         │
                                         ▼
                        Frontend receives response
```

---

## 👥 User Groups & Permissions Structure

```
┌────────────────────────────────────────────────────────────────────┐
│                       DJANGO GROUPS                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ GROUP: root_admin (35 permissions)                                  │
│ ├─ subsites: create, update, delete, view_all                      │
│ ├─ buildings: create, update, delete, view_all                     │
│ ├─ floors: create, update, delete, view_all                        │
│ ├─ rooms: create, update, delete, view_all, block, maintenance     │
│ ├─ beds: create, update, delete, view_all                          │
│ ├─ bookings: create, view_own, view_all, cancel, view_details      │
│ ├─ site_managers: add, update, remove, view                        │
│ └─ dashboard: access_root, access_site, access_booking, analytics  │
│                                                                      │
│ GROUP: site_admin (26 permissions)                                  │
│ ├─ buildings: create, update, delete, view_all                     │
│ ├─ floors: create, update, delete, view_all                        │
│ ├─ rooms: create, update, delete, view_all, block, maintenance     │
│ ├─ beds: create, update, delete, view_all                          │
│ ├─ bookings: view_all, view_details                                │
│ ├─ site_managers: add, update, remove, view                        │
│ └─ dashboard: access_site, analytics                               │
│                                                                      │
│ GROUP: site_building_manager (8 permissions)                        │
│ ├─ rooms: view_all, block, maintenance                             │
│ ├─ bookings: create, view_all, view_details, cancel                │
│ └─ dashboard: access_booking                                       │
│                                                                      │
│ GROUP: normal_user (4 permissions)                                  │
│ ├─ rooms: view_all                                                 │
│ └─ bookings: create, view_own, view_details                        │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘

Each Permission linked to:
- ContentType (app_label: buildings, rooms, bookings, etc.)
- codename (create, update, delete, etc.)
- name (human-readable description)
```

---

## 🔀 Data Isolation by Company

```
┌─────────────────────────────────────────────────────────────┐
│           MULTI-TENANT DATA ISOLATION                        │
│                                                               │
│ User logs in from: alpha.hms.local                           │
│ ├─ Middleware extracts: subsite_key = "alpha"              │
│ ├─ Query HMS: company_id = 2                               │
│ ├─ Attach to request: request.company_id = 2               │
│ │                                                            │
│ └─ User can now access:                                     │
│    ├─ Buildings where company_id = 2 ✓                    │
│    ├─ Rooms where building.company_id = 2 ✓               │
│    ├─ Bookings where room.company_id = 2                  │
│    └─ Bookings where user_id = current_user               │
│                                                              │
│ User CANNOT access:                                         │
│    ├─ Buildings from beta.hms.local (company_id = 3) ✗    │
│    ├─ Rooms from other companies ✗                        │
│    ├─ Bookings from other companies ✗                     │
│    └─ Other users' data ✗                                 │
│                                                              │
│ Enforcement layers:                                         │
│ 1. Middleware: Block requests with wrong host             │
│ 2. Queries: Filter by company_id in WHERE clause          │
│ 3. Permissions: Check mutations against user role         │
│ 4. Business Logic: Validate ownership in service layer    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Setup & Initialization Flow

```
┌──────────────────────────────────────────────┐
│ $ python manage.py setup_groups             │
│                                              │
│ [Step 1] Create permissions                 │
│   └─ For each app_label in PERMISSIONS:     │
│      ├─ Get/create ContentType              │
│      └─ Create Permission with codename     │
│                                              │
│ [Step 2] Create groups                      │
│   ├─ Group: root_admin                     │
│   ├─ Group: site_admin                     │
│   ├─ Group: site_building_manager           │
│   └─ Group: normal_user                     │
│                                              │
│ [Step 3] Assign permissions to groups       │
│   ├─ root_admin: 35 permissions auto-added  │
│   ├─ site_admin: 26 permissions auto-added  │
│   ├─ manager: 8 permissions auto-added      │
│   └─ normal_user: 4 permissions auto-added  │
│                                              │
│ [Step 4] Display summary                    │
│   └─ Show all groups and permission counts  │
│                                              │
└──────────────────────────────────────────────┘
         ✅ SETUP COMPLETE
    Ready for signup/login flows
```

---

## 🎯 Frontend Route Determination

```
┌─────────────────────────────────────┐
│ Login Response                       │
├─────────────────────────────────────┤
│ {                                    │
│   token: "...",                     │
│   userRole: "site_admin",           │
│   availableRoutes: [                │
│     { path: "/dashboard",... },     │
│     { path: "/buildings", ... },    │
│     { path: "/buildings/:id/...",..},│
│     ...                              │
│   ]                                 │
│ }                                    │
│                                     │
├─────────────────────────────────────┤
│ Frontend builds from routes:         │
│                                     │
│ Sidebar Menu:                       │
│ ├─ 📊 Dashboard                     │
│ ├─ 🏢 Buildings                    │
│ ├─ 🏠 Rooms                        │
│ ├─ 🛏️  Beds                         │
│ ├─ 👥 Managers                      │
│ ├─ 📋 Bookings                     │
│ └─ ...                              │
│                                     │
│ Each route's visibility determined  │
│ by requiresPermission field         │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔗 Integration Points

### 1. Signup Process
```
signup() mutation
    ↓
UserRepository.create_user()
    ↓
AuthService.signup()
    ↓
_assign_user_group(django_user=new_user, group="normal_user")
    ↓
User added to Django Group
    ↓
User can now use system with normal_user permissions
```

### 2. Login Process
```
login() mutation
    ↓
AuthService.login_with_password()
    ↓
_assign_user_group() (if not already assigned)
    ↓
Get available routes based on role
    ↓
Return token + userRole + availableRoutes
```

### 3. Mutation Protection
```
@require_permission('app.codename')
def mutate(root, info, ...):
    ↓
Decorator checks: user.has_perm('app.codename')
    ↓
Permission resolved from user's groups
    ↓
Allow or raise exception
```

---

## ✨ Key Design Principles

1. **Django Native** - Uses built-in Groups & Permissions model
2. **Automatic Assignment** - Groups assigned on signup/login
3. **GraphQL-First** - Full GraphQL integration with types
4. **Multi-Layer Protection** - Middleware, permissions, services, DB
5. **Company Isolation** - All queries filtered by company context
6. **Easy Extension** - Add new groups/permissions in central config
7. **Frontend-Ready** - Login returns everything needed for routing

