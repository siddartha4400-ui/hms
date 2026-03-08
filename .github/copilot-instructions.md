# HMS - Hotel Management System AI Coding Guidelines

## Architecture Overview
This is a multi-tenant hotel management system with Django backend and Next.js frontend, fully containerized with Docker.

**Key Components:**
- **Backend**: Django 6.0 with django-tenants for multi-tenancy, PostgreSQL database
- **Frontend**: Next.js 16 with TypeScript, Apollo Client for GraphQL, Socket.io for real-time features
- **Multi-tenancy**: Separate database schemas per tenant using django-tenants
- **APIs**: GraphQL for authentication/mutations, REST API for inventory management

**App Structure:**
- **Shared Apps** (public schema): tenants, django.contrib apps
- **Tenant Apps** (per-tenant schema): users, inventory, bookings

**Data Hierarchy (Inventory):**
```
Location → Building → Floor → Room
```
Each room belongs to a floor in a building at a location.

## Development Workflow
- **Start Development**: `docker compose up --build` (first time) or `docker compose up --build -d` (subsequent)
- **Access Points**: Frontend http://localhost:3000, Backend http://localhost:8000, DB access via `docker exec -it hms_postgres psql -U hms -d hms`
- **Backend Auto-migrations**: Run automatically on container startup
- **Frontend**: Uses Turbopack for fast development

## Code Patterns & Conventions

### Backend (Django)
- **Multi-tenancy**: Use django-tenants middleware for tenant isolation
- **Models**: Define in tenant apps for per-tenant data, shared apps for global data
- **APIs**: 
  - GraphQL mutations for auth (login/register) in `config/schema.py`
  - REST ViewSets for data APIs (see `inventory/api.py` example)
- **Settings**: Environment variables for email config, database connections
- **CORS**: Configured for localhost:3000 frontend communication

### Frontend (Next.js)
- **GraphQL**: Use Apollo Client for queries/mutations
- **Styling**: Tailwind CSS v4
- **Real-time**: Socket.io client for WebSocket connections (ws://localhost:8000)
- **TypeScript**: Strict typing throughout

### Database
- **PostgreSQL**: Primary database with tenant schemas
- **Migrations**: Auto-run on backend startup
- **Access**: Use `docker exec -it hms_postgres psql -U hms -d hms` for direct DB access

## Key Files to Reference
- `backend/config/settings.py`: Multi-tenant configuration, installed apps separation
- `backend/tenants/models.py`: Tenant and Domain models
- `backend/inventory/models.py`: Location → Building → Floor → Room hierarchy
- `backend/config/schema.py`: GraphQL schema for authentication
- `backend/inventory/api.py`: REST API pattern example
- `frontend/package.json`: Next.js dependencies (Apollo, Socket.io, Tailwind)
- `docker-compose.yml`: Service orchestration

## Common Tasks
- **Add new tenant app**: Add to TENANT_APPS in settings, create models in app directory
- **Database changes**: Modify models, migrations run automatically on restart
- **API endpoints**: Use REST ViewSets for CRUD, GraphQL for complex operations
- **Email sending**: Use Django's send_mail with environment variables
- **WebSocket integration**: Configure in ASGI application for real-time features

## Deployment Notes
- **Production**: Use Uvicorn with workers for ASGI, systemd for process management
- **WebSockets**: Configure WSS for secure connections in production
- **Environment**: Separate .env files for different environments