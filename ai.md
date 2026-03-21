AI Development Guide
This repository uses a layered frontend and backend architecture.

Frontend Rule
Frontend flow:

Route -> Organisam -> Molecule -> Canonical Components
Route files must stay minimal.

Frontend Structure
frontend/
├── app/
│   ├── page.tsx
│   └── <route>/page.tsx
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── AttachmentUploader.tsx
│   └── ...
└── project_components/
    └── <route>/
        ├── organisam/
        │   └── route_organism.tsx
        ├── molecule/
        │   └── route_molecule.tsx
        └── graphql/
            ├── queries.ts
            └── mutations.ts
Backend Rule
Backend flow:

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
Backend Structure
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
Use project_graphql/ instead of graphql/ at backend root. A top-level Python package named graphql can collide with Graphene's dependency imports.

Layer Responsibilities
Route
Only imports and renders the route organism.
No state.
No business logic.
No API calls.
Organisam
Client component.
Owns state and event handling.
Calls Apollo hooks or direct fetch helpers.
Passes prepared props to molecule.
Molecule
UI composition only.
No backend calls.
No business rules.
Reuses canonical components from frontend/components.
Canonical Components
Generic and reusable.
No route-specific behavior.
Stable props.
Validators
Input validation only.
No persistence.
Services
Business logic orchestration.
Calls repositories.
Returns domain data.
Repositories
Reads and writes models.
No request parsing.
Models
Database structure.
Query relationships.
AI Rules
Always follow these rules when generating code.

Do
Keep route files minimal.
Put state and API calls in organisam.
Put rendering in molecule.
Reuse canonical components.
Use validators -> services -> repositories -> models in backend modules.
Do Not
Put logic in route files.
Put API calls in molecules.
Put persistence logic in validators.
Put request parsing in repositories.
Create another root backend package named graphql.