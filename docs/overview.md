# Moul Hanout Overview

## What It Is
Moul Hanout is a single-store retail operations platform for traditional grocery shops. It replaces paper-based tracking with a digital workflow for authentication, stock control, sales, alerts, and simple reporting.

## Current Product Scope
- Secure authentication with JWT sessions, rate limiting, and password reset
- Owner and cashier roles with protected routes and role-based actions
- Category and product management
- Manual inventory updates with stock movement history
- POS checkout with receipt generation
- Low-stock and near-expiry alerts
- Sales and inventory reporting, including CSV export
- Owner-managed user accounts

## Who Uses It
- `OWNER`: manages catalog, stock, users, alerts, reports, and store settings
- `CASHIER`: logs in, checks stock visibility, creates sales, and prints receipts

## Tech Stack
- Backend: NestJS, Prisma, PostgreSQL, Redis
- Frontend: Next.js App Router, React 19, Zustand, Recharts
- Shared contract: `packages/shared-types` and `packages/shared-utils`
- Delivery: Docker Compose workspace with backend, frontend, Postgres, and Redis

## How The System Works
1. The frontend authenticates against the NestJS API and stores access and refresh tokens in Zustand.
2. Backend controllers stay thin and delegate business rules to domain services.
3. Services persist data through Prisma models such as `Product`, `Sale`, `StockMovement`, `Alert`, and `AuditLog`.
4. Shared types keep API payloads aligned between frontend and backend.
5. Alerts and reports are derived from operational data already stored in the main domain tables.

## Current State
The repository is beyond a backend foundation: most MVP business modules already exist and are wired end to end. The main remaining work is product hardening, real-environment validation, and scope cleanup rather than greenfield feature creation.
