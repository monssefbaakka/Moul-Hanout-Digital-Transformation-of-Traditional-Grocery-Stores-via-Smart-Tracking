# Moul Hanout Phase 1 Foundation

This repository is intentionally reset to a small, honest backend foundation.

Current backend scope:

- auth: register, login, refresh, logout
- users: owner-only user listing
- health: readiness/health endpoint
- prisma: user/session baseline schema and seed data

Everything from later phases such as products, categories, stock, sales, reports,
alerts, exports, and background jobs has been removed from the NestJS app surface.

## Workspace

- `backend/`: NestJS API
- `frontend/`: placeholder UI shell
- `packages/`: shared frontend/backend packages

## Backend quick start

1. Install dependencies from the repo root with `npm install`.
2. Copy env files from the examples.
3. Run Prisma generate, migrate, and seed in `backend/`.
4. Start the backend with `npm run dev:backend`.

## Default seeded users

- Owner: `owner@moulhanout.ma` / `Admin@123!`
- Cashier: `cashier@moulhanout.ma` / `Cashier@123!`

## Verification

From the repo root:

- `npm run check:backend`

This now validates the backend with:

- Prisma client generation
- backend unit tests
- backend e2e smoke tests
- backend build
