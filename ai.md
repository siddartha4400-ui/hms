# AI Development Guide

This repository uses a **strict layered architecture** for the Next.js App Router.

Architecture flow:

Route → Organism → Molecule → Canonical Components

The goal is to keep routing, business logic, and UI clearly separated.

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
└── project_components/           # Route-specific code
└── <route>/
├── route_organism.tsx
└── route_molecule.tsx

---

# Architecture Responsibilities

## 1. Route Layer

Location
frontend/app/<route>/page.tsx

Rules

* Route files must remain **minimal**
* Only import and render the organism
* No state management
* No business logic
* No UI composition

Example

import RouteOrganism from "../../project_components/test/route_organism";

export default function Page() {
return <RouteOrganism />;
}

---

## 2. Organism Layer

Location
frontend/project_components/<route>/route_organism.tsx

Responsibilities

* State management
* Business logic
* Data fetching / API calls
* Validation
* Event handling
* Pass props to molecule

Rules

* Use `"use client"` when using hooks or browser APIs
* Avoid UI markup when possible
* Only coordinate logic and data

Example

"use client";

import { useState } from "react";
import RouteMolecule from "./route_molecule";

export default function RouteOrganism() {
const [value, setValue] = useState("");

return ( <RouteMolecule
   value={value}
   onChange={setValue}
 />
);
}

---

## 3. Molecule Layer

Location
frontend/project_components/<route>/route_molecule.tsx

Responsibilities

* UI composition
* Layout and presentation
* Use canonical components

Rules

* No business logic
* No API calls
* Prefer server components
* Use `"use client"` only if interactivity is required

Example

import Input from "../../components/Input";

type Props = {
value: string;
onChange: (v: string) => void;
};

export default function RouteMolecule({ value, onChange }: Props) {
return ( <div> <Input value={value} onChange={onChange} /> </div>
);
}

---

## 4. Canonical Components

Location
frontend/components/

Rules

* Must be reusable and generic
* No route-specific logic
* No business logic tied to a page
* Maintain stable props

Examples

Button.tsx
Input.tsx
MultiSelect.tsx
AccordionBasic.tsx

---

# Rules for AI Agents

Always follow these rules when generating code.

DO

* Keep route files minimal
* Put state and logic inside organisms
* Put UI composition inside molecules
* Reuse components from frontend/components
* Follow the exact folder structure

DO NOT

* Add logic inside route files
* Add API calls inside molecules
* Create route-specific components inside components/
* Put UI markup inside organisms unless absolutely necessary

---

# Adding a New Route

Example: `/test`

Step 1 — Create route entry

frontend/app/test/page.tsx

Step 2 — Create organism

frontend/project_components/test/route_organism.tsx

Step 3 — Create molecule

frontend/project_components/test/route_molecule.tsx

Example route file

import RouteOrganism from "../../project_components/test/route_organism";

export default function Page() {
return <RouteOrganism />;
}

---

# Mandatory Folder Rules

All route logic must follow this structure:

frontend/app/<route>/page.tsx
frontend/project_components/<route>/route_organism.tsx
frontend/project_components/<route>/route_molecule.tsx

Do not create alternative structures.
Do not duplicate components.
Always reuse canonical components when possible.
