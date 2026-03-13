# AI Development Guide

This repository uses a **strict layered architecture** for the Next.js App Router.

Architecture flow:

Route → Organism → Molecule → Canonical Components

Goal: **clear separation of routing, logic, and UI.**

---

# Project Structure

frontend/
├── app/                          # Next.js route entry points
│   ├── page.tsx
│   └── <route>/
│       └── page.tsx
│
├── components/                   # Reusable canonical UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── MultiSelect.tsx
│   └── ...
│
└── project_components/
└── <route>/
├── organism/
│   └── route_organism.jsx
│
├── molecule/
│   └── route_molecule.jsx
│
└── graphql/
├── queries.js
└── mutations.js

---

# Architecture Responsibilities

## 1. Route Layer

Location
frontend/app/<route>/page.tsx

Rules

• Route files must remain **minimal**
• Only import and render the organism
• No state management
• No business logic
• No UI composition

Example

```tsx
import RouteOrganism from "../../project_components/test/organism/route_organism";

export default function Page() {
  return <RouteOrganism />;
}
```

---

## 2. Organism Layer

Location
frontend/project_components/<route>/organism/route_organism.jsx

Responsibilities

• State management
• Business logic
• GraphQL communication (Apollo Client)
• Data fetching
• Validation
• Event handling
• Pass props to molecule

Rules

• Use `"use client"` when using hooks
• Do not build UI here
• Only coordinate logic and data

Example

```jsx
"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_USERS } from "../graphql/queries";
import RouteMolecule from "../molecule/route_molecule";

export default function RouteOrganism() {
  const [value, setValue] = useState("");

  const { data, loading } = useQuery(GET_USERS);

  return (
    <RouteMolecule
      value={value}
      onChange={setValue}
      users={data?.users || []}
      loading={loading}
    />
  );
}
```

---

## 3. Molecule Layer

Location
frontend/project_components/<route>/molecule/route_molecule.jsx

Responsibilities

• UI composition
• Layout and presentation
• Use canonical components

Rules

• No business logic
• No API calls
• Prefer server components
• Use `"use client"` only if needed for interactivity

Example

```jsx
import Input from "../../components/Input";

export default function RouteMolecule({ value, onChange, users, loading }) {
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Input value={value} onChange={onChange} />
      {users.map(u => (
        <div key={u.id}>{u.name}</div>
      ))}
    </div>
  );
}
```

---

## 4. Canonical Components

Location
frontend/components/

Rules

• Must be **reusable and generic**
• No route-specific logic
• No page business logic
• Maintain stable props

Examples

Button.tsx
Input.tsx
MultiSelect.tsx
AccordionBasic.tsx

---

# GraphQL Rules

Location
frontend/project_components/<route>/graphql/

Files

queries.js → GraphQL queries
mutations.js → GraphQL mutations

Rules

• Only GraphQL definitions
• No React hooks
• No business logic
• Apollo hooks must be used **only in organism**

Example

```js
import { gql } from "@apollo/client";

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
    }
  }
`;
```

---

# Rules for AI Agents

Always follow these rules when generating code.

DO

• Keep route files minimal
• Put state and logic inside organisms
• Put UI composition inside molecules
• Use Apollo Client only in organisms
• Reuse components from frontend/components
• Follow the exact folder structure

DO NOT

• Add logic inside route files
• Add API calls inside molecules
• Create route-specific components inside components/
• Put UI markup inside organisms
• Use Apollo hooks outside organisms

---

# Adding a New Route

Example: `/test`

Step 1 — Create route entry

frontend/app/test/page.tsx

Step 2 — Create organism

frontend/project_components/test/organism/route_organism.jsx

Step 3 — Create molecule

frontend/project_components/test/molecule/route_molecule.jsx

Step 4 — Add GraphQL (if needed)

frontend/project_components/test/graphql/queries.js
frontend/project_components/test/graphql/mutations.js

Example route file

```tsx
import RouteOrganism from "../../project_components/test/organism/route_organism";

export default function Page() {
  return <RouteOrganism />;
}
```

---

# Mandatory Folder Rules

All route logic must follow this structure:

frontend/app/<route>/page.tsx
frontend/project_components/<route>/organism/route_organism.jsx
frontend/project_components/<route>/molecule/route_molecule.jsx
frontend/project_components/<route>/graphql/queries.js
frontend/project_components/<route>/graphql/mutations.js

Rules

• Do not create alternative structures
• Do not duplicate components
• Always reuse canonical components
