# AI Development Guide

## 🎯 Latest Implementation: Role-Based Access Control (RBAC)

**Status:** ✅ **COMPLETE AND TESTED**

A comprehensive role-based access control system has been implemented using Django Groups and Permissions. This includes:

### Core Components
- ✅ **4 Roles**: root_admin, site_admin, site_building_manager, normal_user
- ✅ **73 Granular Permissions** across 8 categories (subsites, buildings, rooms, bookings, etc.)
- ✅ **Automatic Group Assignment** on signup and login
- ✅ **GraphQL Integration**: Queries to get user roles, permissions, and available routes
- ✅ **Enhanced Login**: Returns `userRole` and `availableRoutes` for frontend routing
- ✅ **Permission Decorators**: `@require_permission()` for mutation protection
- ✅ **Cross-Site Protection**: Company-based data isolation enforced at multiple levels

### Key Files
- `backend/apps/users/permissions.py` - Permission definitions
- `backend/users/management/commands/setup_groups.py` - Setup command
- `backend/apps/users/graphql/types.py` - GraphQL types
- `backend/project_graphql/permissions.py` - Permission utilities
- `RBAC_GUIDE.md` - Complete documentation
- `IMPLEMENTATION_SUMMARY.md` - Quick reference guide

### Quick Start
```bash
# Initialize groups and permissions (run once)
docker exec hms_backend python manage.py setup_groups

# Test login - returns user role and available routes
mutation {
  login(method: "password", email: "user@example.com", password: "pass") {
    token
    userRole        # "site_admin", "normal_user", etc.
    availableRoutes { path name icon }  # Dynamic routes per role
  }
}
```

### Check Documentation
- **Full Guide**: See `RBAC_GUIDE.md` for detailed implementation
- **Quick Summary**: See `IMPLEMENTATION_SUMMARY.md` for overview
- **Permission Map**: Check `backend/apps/users/permissions.py` for all permissions

---

# AI Development Guide

This repository uses a layered frontend and backend architecture.

## Frontend Rule

Frontend flow:

```text
Route -> Organisam -> Molecule -> Canonical Components
```

Route files must stay minimal.

### Frontend Structure

```text
frontend/
├── app/
│   ├── page.tsx
│   └── <route>/page.tsx
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── AttachmentUploader.tsx
│   └── ...
|
├── icons/
│   ├── EditIcon.tsx
│   ├── DeleteIcon.tsx
│   └── ...
|
└── project_components/
    └── <route>/
        ├── organisam/
        │   └── route_organism.tsx
        ├── molecule/
        │   └── route_molecule.tsx
        └── graphql/
            ├── queries.ts
            └── mutations.ts
```

## Backend Rule

Backend flow:

```text
Client (Next.js)
       |
       v
GraphQL Mutation / Query
       |
       v
apps/<module>/graphql
       |
       v
validators
       |
       v
services
       |
       v
repositories
       |
       v
models
       |
       v
Database
```

### Backend Structure

```text
backend/
├── config/
├── project_graphql/
│   ├── schema.py
│   └── middleware.py
├── apps/
│   ├── auth/
│   ├── users/
│   ├── siteadmin/
│   ├── subsites/
│   ├── bookings/
│   ├── notifications/
│   └── payments/
├── common/
├── core/
└── tests/
```

Use `project_graphql/` instead of `graphql/` at backend root. A top-level Python package named `graphql` can collide with Graphene's dependency imports.

## Layer Responsibilities

### Route

- Only imports and renders the route organism.
- No state.
- No business logic.
- No API calls.

### Organisam

- Client component.
- Owns state and event handling.
- Calls Apollo hooks or direct fetch helpers.
- Passes prepared props to molecule.

### Molecule

- UI composition only.
- No backend calls.
- No business rules.
- Reuses canonical components from `frontend/components`.

### Canonical Components

- Generic and reusable.
- No route-specific behavior.
- Stable props.

### Validators

- Input validation only.
- No persistence.

### Services

- Business logic orchestration.
- Calls repositories.
- Returns domain data.

### Repositories

- Reads and writes models.
- No request parsing.

### Models

- Database structure.
- Query relationships.

## AI Rules

Always follow these rules when generating code.

### Do

- Keep route files minimal.
- Put state and API calls in organisam.
- Put rendering in molecule.
- Reuse canonical components.
- Use validators -> services -> repositories -> models in backend modules.
- If created/altered/turncated table run command inside docker container `python manage.py makemigrations` and `python manage.py migrate` to create migration files and update the database schema.

### Do Not

- Put logic in route files.
- Put API calls in molecules.
- Put persistence logic in validators.
- Put request parsing in repositories.
- Create another root backend package named `graphql`.


subsite architecture


[ Subsite A ]   [ Subsite B ]   [ Subsite C ]
     |               |               |
     | (subsiteKey)  | (subsiteKey) |
     └──────┬────────┴───────┬──────┘
            |
        🌐 API Gateway / Backend
            |
     ------------------------
     |   Middleware Layer   |
     ------------------------
            |
     1. Extract subsiteKey
     2. Validate subsite
     3. Fetch organization (OTG)
     4. Attach:
        - companyId
        - userId (if applicable)
            |
     ------------------------
     |   Application Logic  |
     ------------------------
            |
        🗄️ Database