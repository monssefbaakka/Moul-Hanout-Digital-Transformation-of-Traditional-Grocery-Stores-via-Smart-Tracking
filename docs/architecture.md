# Architecture

## Repository Shape
```text
/
|- backend/                 NestJS API
|- frontend/                Next.js application
|- packages/
|  |- shared-types/         shared API/domain types
|  |- shared-utils/         shared formatting helpers
|- docs/                    project and task documentation
|- docker-compose.yml       local full-stack runtime
```

## Backend Structure
The backend is a NestJS modular monolith. Global concerns are configured once in `app.module.ts`, then feature modules encapsulate business behavior.

### Core layers
- `src/common/`: decorators, guards, filters, interceptors, enums
- `src/config/`: environment validation and typed config loaders
- `src/database/`: `PrismaService` and global database module
- `src/modules/`: domain modules

### Main backend modules
- `auth`: login, refresh, logout, password reset, owner-created users
- `users`: profile, user listing, activate/deactivate flows
- `categories`: create, update, deactivate, list active categories
- `products`: product CRUD, barcode uniqueness, pricing rules
- `inventory`: stock in/out, movement history, expiry visibility
- `sales`: checkout, payment record creation, receipt data, daily summary
- `alerts`: low-stock and expiry alerts, read state, email scheduling
- `reports`: sales aggregation, inventory report, CSV export
- `health`: readiness endpoint for Docker and monitoring
- `mail`: outbound email for password reset and alert notifications

### Request flow
`Controller -> Service -> Prisma -> PostgreSQL`

Supporting cross-cutting behavior:
- `ValidationPipe` enforces DTO validation
- `TransformInterceptor` wraps successful responses as `{ success, data, timestamp }`
- `HttpExceptionFilter` normalizes error responses
- `JwtAuthGuard` and `RolesGuard` protect private endpoints
- `ThrottlerGuard` rate-limits requests globally

## Frontend Structure
The frontend uses the Next.js App Router and keeps business rules in the backend.

### Main areas
- `src/app/(auth)/`: login, forgot-password, reset-password routes
- `src/app/(authenticated)/`: protected pages wrapped by the app shell
- `src/app/*-workspace.tsx`: feature workspaces for products, inventory, POS, users, alerts, profile, and sales history
- `src/components/`: reusable UI, layout, auth, and alerts components
- `src/lib/api/`: typed API client for backend endpoints
- `src/store/`: Zustand auth store and token hydration
- `src/middleware.ts`: route protection using a lightweight auth cookie

### Frontend interaction pattern
1. Route loads inside the authenticated shell.
2. Workspace calls the typed API client.
3. API client injects the bearer token and refreshes on `401`.
4. Shared types shape the request and response payloads.
5. UI renders backend-derived state without duplicating business logic.

## Data Model Highlights
The Prisma schema is organized around one shop and its operational entities:
- `Shop`, `User`, `UserShopRole`, `Session`
- `Category`, `Product`, `StockMovement`
- `Sale`, `SaleItem`, `Payment`
- `Alert`, `AuditLog`, `PasswordResetToken`

This gives the system a clear source of truth for authentication, catalog, inventory, checkout, and operational reporting.

## Runtime Topology
`frontend -> backend -> PostgreSQL`

`backend -> Redis` for supporting infrastructure such as scheduling and shared runtime services.

Docker Compose starts `postgres`, `redis`, `backend`, and `frontend`, with health checks used to order service startup.
