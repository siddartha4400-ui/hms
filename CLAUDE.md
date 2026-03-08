# CLAUDE.md - AI Development Guide for HMS

## Project Overview
Multi-tenant Hotel Management System: Django 6 backend + Next.js 16 frontend + PostgreSQL + GraphQL.

## Quick Commands

```bash
# Backend (from backend/ directory, with venv activated)
DATABASE_URL=postgresql://<user>@localhost:5432/hms python manage.py runserver 8000
DATABASE_URL=postgresql://<user>@localhost:5432/hms python manage.py test
DATABASE_URL=postgresql://<user>@localhost:5432/hms python manage.py makemigrations
DATABASE_URL=postgresql://<user>@localhost:5432/hms python manage.py migrate

# Frontend (from frontend/ directory)
npm run dev
npx tsc --noEmit  # type check
```

## Key Conventions

- GraphQL is the primary API (config/schema.py), REST is secondary
- Apollo Client v4: hooks import from `@apollo/client/react`, gql from `@apollo/client`
- Always use type parameters with useQuery/useMutation
- Role-based permissions via decorators in users/permissions.py
- django-tenants requires a public tenant for localhost to work
- Frontend pages go in app/dashboard/<feature>/page.tsx
- GraphQL queries go in lib/graphql/<domain>.ts
- All "use client" pages - no server components for dashboard
