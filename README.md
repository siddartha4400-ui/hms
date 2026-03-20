# HMS

Hotel Management System built with Django, GraphQL, Next.js, and PostgreSQL.

## Stack

- Backend: Django, Graphene, PostgreSQL
- Frontend: Next.js App Router, Apollo Client, TypeScript
- Infrastructure: Docker, Docker Compose

## Run The Project

```bash
docker compose up --build
```

Frontend runs at `http://localhost:3000`.

Backend runs at `http://localhost:8000`.

GraphQL runs at `http://localhost:8000/graphql/`.

## Target Backend Architecture

The backend is being organized into a layered module structure.

```text
backend/
├── manage.py
├── requirements.txt
├── .env
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── project_graphql/
│   ├── schema.py
│   └── middleware.py
├── apps/
│   ├── auth/
│   │   ├── models/
│   │   │   └── user.py
│   │   ├── repositories/
│   │   │   └── user_repository.py
│   │   ├── services/
│   │   │   └── auth_service.py
│   │   ├── validators/
│   │   │   ├── login_validator.py
│   │   │   └── signup_validator.py
│   │   ├── graphql/
│   │   │   ├── queries.py
│   │   │   ├── mutations.py
│   │   │   └── types.py
│   │   └── apps.py
│   ├── users/
│   ├── siteadmin/
│   ├── subsites/
│   ├── bookings/
│   ├── notifications/
│   └── payments/
├── common/
│   ├── validators/
│   ├── exceptions/
│   ├── permissions/
│   ├── constants/
│   └── utils/
├── core/
│   ├── base_model.py
│   ├── pagination.py
│   └── mixins.py
└── tests/
    ├── auth_tests.py
    ├── booking_tests.py
    └── user_tests.py
```

## Important Note About GraphQL Package Naming

The requested root folder name `graphql/` was implemented as `project_graphql/`.

Reason: a top-level Python package named `graphql` can shadow the external `graphql` library used by Graphene and break imports at runtime.

## Backend Request Flow

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

## Development Notes

- Existing flat modules remain in place while the repo is being moved into the layered structure.