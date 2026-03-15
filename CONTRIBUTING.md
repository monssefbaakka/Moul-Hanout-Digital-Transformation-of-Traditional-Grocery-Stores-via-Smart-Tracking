# Contributing

## Goal

Keep the base stable so two developers can build modules in parallel with minimal overlap.

## Branch Rules

- Base branch: `develop`
- Feature branches: `feat/backend/<name>`, `feat/frontend/<name>`, `feat/shared/<name>`
- Fix branches: `fix/backend/<name>`, `fix/frontend/<name>`, `fix/shared/<name>`
- Open PRs into `develop`

## Ownership Split

### Developer 1

- root workspace setup
- backend modules
- Prisma schema and migrations
- API contracts
- backend tests

### Developer 2

- frontend shell
- frontend module pages
- client state
- forms and UI integration
- frontend API usage

## Shared Files

Review carefully before changing:

- `package.json`
- `backend/prisma/schema.prisma`
- `packages/shared-types/src/index.ts`
- `packages/shared-utils/src/index.ts`
- `frontend/src/lib/api/api-client.ts`
- `docs/`

## Database Rule

Only one developer owns a schema migration at a time.

Flow:

1. Update `backend/prisma/schema.prisma`
2. Generate the migration
3. Commit both files
4. Merge that PR first
5. Rebase other DB work after that

## Module Workflow

Before starting a module:

1. Agree the backend endpoints
2. Agree the request and response types
3. Update shared types
4. Split backend and frontend work

## Definition Of Done

A module is done when:

- backend endpoints exist
- frontend page exists
- shared contracts are updated
- lint passes
- build passes
- docs note is updated if contracts changed
