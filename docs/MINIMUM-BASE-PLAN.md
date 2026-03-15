# Minimum Base Plan for Two Developers

## Goal

Build only the minimum base that allows two developers to work in parallel, module by module, without blocking each other.

This is not a feature roadmap.
This is a collaboration baseline.

---

## Current Reality

The repository already has a strong folder structure, but the practical shared base is still incomplete.

Important gaps:

- No root workspace configuration
- No root `package.json`
- No frontend `package.json`
- Shared packages exist, but the repo is not yet wired as one runnable workspace
- Documentation is more advanced than the actual minimum setup needed for parallel development

Because of that, the first work should be about stability, contracts, and developer independence, not product features.

---

## Minimum Base Only

The base should include only these 7 things:

1. A runnable monorepo
   - Root `package.json`
   - Workspace config
   - Shared scripts for install, dev, build, lint, and test

2. A runnable frontend shell
   - `frontend/package.json`
   - Next.js app starts successfully
   - Basic layout and empty module pages only

3. A stable backend shell
   - Health endpoint
   - Auth skeleton
   - Module registration works
   - Database connection works

4. Shared contracts
   - `packages/shared-types` contains only base domain types
   - API response envelope is agreed once
   - Naming rules for DTOs and API payloads are agreed once

5. Module boundaries
   - Each module owns its backend folder and frontend feature folder
   - No direct edits inside another developer's module without coordination
   - Shared code changes must be small and reviewed first

6. Team workflow
   - Branch naming
   - PR target branch
   - Migration ownership rule
   - Definition of done for each module

7. Basic quality gate
   - Lint runs
   - Build runs
   - One smoke test for backend
   - One smoke test for frontend startup

---

## What To Avoid Right Now

Do not build these in the base phase:

- Reports implementation
- Advanced RBAC flows
- Background jobs
- Redis usage
- Barcode scanning
- PWA/offline mode
- PDF receipts
- Complex dashboard UI
- Performance optimization
- Multi-store support

If it is not required to let both developers start safely, postpone it.

---

## Recommended Module Split

Use a vertical split with one shared-base sprint first.

After the base is ready:

- Developer 1 owns backend-heavy modules
- Developer 2 owns frontend-heavy modules

Shared ownership:

- `packages/shared-types`
- root workspace files
- database schema changes
- docs that affect both sides

This reduces collisions and keeps each developer productive.

---

## Working Rules

### Shared files

These files are shared and should be edited carefully:

- root `package.json`
- workspace config
- `backend/prisma/schema.prisma`
- `packages/shared-types/src/index.ts`
- `frontend/src/lib/api/api-client.ts`
- `docs/`

### Database rule

Only one developer owns a Prisma schema change at a time.

If both developers need DB changes:

- one developer updates `schema.prisma`
- creates the migration
- merges first
- the second developer rebases after that

### API contract rule

Before building a module:

- agree the request DTO
- agree the response DTO
- add shared types first
- then start backend and frontend work in parallel

### Definition of done for a module

A module is done when:

- backend endpoints exist
- frontend screen exists
- shared types are updated
- lint passes
- build passes
- module README or doc note is updated

---

## Sprint Plan

### Sprint 0: Base Setup

Purpose:
Create the minimum shared base so both developers can start working separately.

Developer 1:

- Create root workspace setup
- Add root `package.json`
- Add workspace config
- Add root scripts: `install`, `dev`, `build`, `lint`, `test`
- Make backend start from the workspace
- Verify database connection and health route

Developer 2:

- Create `frontend/package.json`
- Make frontend boot successfully
- Add minimal app shell only
- Add placeholder pages for modules: products, stock, sales, reports, settings
- Verify frontend can consume the shared types package

Shared deliverables:

- Run instructions are correct
- Environment files are aligned
- One short contribution workflow document exists
- Decide branch strategy and migration rule

Exit criteria:

- `backend` runs
- `frontend` runs
- shared packages resolve correctly
- both developers can work on separate branches without touching the same files every day

---

### Sprint 1: Contract First

Purpose:
Prepare the first modules so development can happen independently.

Developer 1:

- Clean and stabilize backend module interfaces for:
  - auth
  - products
  - categories
- Add or refine DTOs
- Expose only minimum endpoints required for the first module
- Add one smoke e2e test for health/auth

Developer 2:

- Create frontend feature structure for:
  - auth
  - products
- Add empty or mock screens wired to typed API calls
- Prepare route protection shell
- Keep UI minimal, no polishing

Shared deliverables:

- Shared auth types
- Shared product types
- Agreed request/response shapes

Exit criteria:

- Auth contract is stable
- Product contract is stable
- frontend and backend can now move in parallel on product-related work

---

### Sprint 2: First Real Parallel Module Work

Purpose:
Start module-by-module delivery with low overlap.

Developer 1:

- Implement backend for `products` and `categories`
- Keep endpoints simple: list, get, create, update
- Add validation and basic tests

Developer 2:

- Implement frontend for `products`
- Product list page
- Product create/edit form
- Category selector

Shared deliverables:

- Product module is usable end-to-end
- Shared types updated only through small reviewed PRs

Exit criteria:

- One complete module is live end-to-end
- Team process works without blocking

---

### Sprint 3: Second Parallel Module Work

Purpose:
Continue with a second module using the same process.

Developer 1:

- Implement backend for `stock`
- Basic stock listing
- Basic stock adjustment

Developer 2:

- Implement frontend for `stock`
- Stock table
- Low-stock and expired placeholders if backend supports them

Exit criteria:

- Second module is live end-to-end
- No major restructuring is needed anymore

---

## Ownership Suggestion

### Developer 1

Best focus:

- workspace setup
- backend modules
- database
- API contracts
- tests

### Developer 2

Best focus:

- frontend shell
- feature pages
- forms
- state management
- API integration on UI side

This is the cleanest split for this repository.

---

## Suggested Module Order

Build in this order:

1. base setup
2. auth
3. products
4. categories
5. stock
6. sales
7. reports

Reason:

- auth unlocks protected work
- products/categories are simpler and stabilize the catalog model
- stock depends on products
- sales depends on products and stock
- reports should come last

---

## Final Recommendation

For now, treat this project as a minimum viable platform base, not as a full product.

If the team stays disciplined, the correct first target is:

"A runnable monorepo with shared contracts, minimal auth, empty module shells, and one completed module flow."

That is enough for two developers to start safely and work independently.
