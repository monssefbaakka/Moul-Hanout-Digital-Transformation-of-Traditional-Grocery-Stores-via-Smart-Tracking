# Moul Hanout Digital Transform

## Production Architecture & Structural Documentation

---

# 1. Project Overview

**Moul Hanout Digital Transform** is a production-grade Point of Sale (POS) Software-as-a-Service (SaaS) platform designed for small-to-medium retail environments.

The system is architected with the following non-negotiable principles:

* Transactional integrity
* Domain isolation
* Type safety across the entire stack
* Horizontal scalability
* Strict separation of concerns
* Deterministic infrastructure

The architecture follows a **modular monorepo strategy**. Frontend and backend are isolated runtime boundaries while sharing canonical type definitions to eliminate typing drift and ensure payload determinism.

---

## Technology Stack

### Backend

* NestJS 11
* Prisma ORM
* PostgreSQL 16
* JWT Authentication
* Domain-driven module architecture

### Frontend

* Next.js 15 (App Router)
* TypeScript
* Zustand (scoped state management)
* TailwindCSS + shadcn/ui

### Infrastructure

* Docker & Docker Compose
* Twelve-Factor configuration model

---

# 2. Monorepo Structure

```
root/
 ├── backend/
 ├── frontend/
 ├── packages/
 │    ├── shared-types/
 │    └── shared-utils/
 ├── docker/
 ├── scripts/
 ├── docs/
 ├── docker-compose.yml
 ├── .env.example
 └── STRUCTURE.md
```

---

## Directory Specifications

---

### `/backend`

Contains the NestJS REST API.

**Responsibilities**

* Business logic
* Authentication
* Database access
* Validation
* Transactions
* Scheduled jobs

**Strict Rules**

* No UI logic
* No frontend dependencies
* No direct filesystem routing

---

### `/frontend`

Contains the Next.js application.

**Responsibilities**

* Rendering UI
* Client-side routing
* State management
* API consumption

**Strict Rules**

* No database access
* No background jobs
* No business rule duplication

---

### `/packages`

Internal shared modules.

---

#### `/packages/shared-types`

Canonical domain contracts.

Contains:

* DTO interface mirrors
* Enums (Role, SaleStatus, PaymentMethod)
* API request/response types

Purpose:

* Enforces strict typing parity
* Eliminates API drift
* Single source of truth for payload contracts

---

#### `/packages/shared-utils`

Pure stateless functions.

Examples:

* Currency formatting
* Tax calculation
* Pagination helpers
* Safe math operations

Constraints:

* No Node-specific APIs
* No Browser-specific APIs
* Must execute in both environments

---

### `/docker`

Infrastructure-only definitions.

Examples:

* Reverse proxy configs
* SSL definitions
* Future container orchestration expansions

---

### `/scripts`

Shell automation layer.

Examples:

* Database migration execution
* Local bootstrap
* Seeding
* CI/CD tasks

---

### `/docs`

Architecture Decision Records (ADR)
System design notes
Evolution logs

Immutable reference documentation.

---

### `docker-compose.yml`

Defines local execution topology:

* PostgreSQL container
* Redis (optional future scaling)
* Health checks
* Network bridges
* Persistent volumes

---

### `.env.example`

Defines required environment topology for container orchestration and service startup.

---

# 3. Backend Architecture

---

## Structure

```
backend/src/
 ├── modules/
 │    ├── auth/
 │    ├── users/
 │    ├── products/
 │    ├── categories/
 │    ├── stock/
 │    ├── sales/
 │    ├── reports/
 │    └── health/
 ├── common/
 ├── config/
 ├── database/
 ├── prisma/
 └── test/
```

---

## Core Principles

* Vertically sliced domains
* No cross-domain DB access
* Services communicate via exported service contracts
* Controllers never access Prisma directly

---

## Domain Modules (`src/modules/`)

Each domain is a **bounded context**.

Each module contains:

```
module/
 ├── dto/
 ├── guards/ (optional)
 ├── jobs/ (optional)
 ├── module.controller.ts
 ├── module.service.ts
 └── module.module.ts
```

---

## Request Lifecycle

```
HTTP Request
   ↓
Controller
   ↓
DTO Validation (class-validator)
   ↓
Service Logic
   ↓
Prisma Client
   ↓
Database
   ↓
Response Serialization
   ↓
HTTP Response
```

---

## Domain Responsibilities

---

### `auth/`

* JWT issuance
* Refresh token rotation
* Password hashing (bcrypt)
* Access control validation

---

### `users/`

* Operator identity management
* Soft delete via `isActive`
* Role assignment

---

### `products/` & `categories/`

* Catalog abstraction
* SKU and barcode indexing
* Metadata governance

---

### `stock/`

* Inventory lifecycle
* Batch tracking
* Expiration logic
* Low stock computation
* Contains scheduled jobs

---

### `sales/`

* Financial transaction engine
* Atomic Prisma `$transaction` usage
* Ledger immutability
* Inventory deduction consistency

---

### `reports/`

* Analytical multi-table aggregation
* Statistical endpoints
* High-performance read operations

---

### `health/`

* Readiness probes
* DB connectivity verification
* Memory health

---

## Infrastructure Directories

---

### `src/common/`

Contains:

* Guards
* Interceptors
* Exception filters
* Custom decorators
* Pipes

Contains **no business logic**.

---

### `src/config/`

Maps environment variables into strongly typed configuration objects.

Uses NestJS ConfigModule factories.

---

### `src/database/`

Contains global `PrismaService`.

Purpose:

* Singleton DB connection
* Connection pooling
* Centralized transaction management

---

### `/prisma`

Single source of truth for database structure.

Contains:

* `schema.prisma`
* Migration history
* Seed definitions

Migration history must remain linear and immutable.

---

# 4. Database Architecture

---

## Core Entities

### Identity

* `User`
* `Session`

### Catalog

* `Product`
* `Category`

### Inventory

* `StockItem`

  * Supports multiple batches per product
  * Allows expiration tracking

### Ledger

* `Sale`
* `SaleItem`

Sales are immutable.

Deletion is prohibited at constraint level.

---

## Data Integrity Strategy

* Foreign key enforcement
* Soft deletion for Users and Products
* Transaction blocks for checkout routines

---

## Indexing Strategy

* Unique B-Tree indexes on:

  * `sku`
  * `barcode`
  * `saleNumber`

Optimized for:

* Barcode scanning
* Receipt retrieval
* POS speed

---

## Transaction Safety

All checkout flows use:

```
prisma.$transaction()
```

Guarantees:

* No partial inventory deduction
* No orphan ledger entries
* Rollback on failure

---

# 5. Frontend Architecture

---

## Structure

```
frontend/src/
 ├── app/
 ├── features/
 ├── components/
 ├── lib/
 ├── store/
 ├── hooks/
 ├── types/
 └── utils/
```

---

## `/app`

File-system routing.

Route groups:

```
(auth)
(dashboard)
```

Prevents unnecessary layout re-renders.

---

## `/features`

Feature-collocated domains.

Each feature contains:

* UI
* Hooks
* Formatting logic
* Business orchestration

Prevents flat component chaos.

---

## `/components`

Primitive UI elements only.

Examples:

* Button
* Card
* Input

No data fetching.
No domain logic.

---

## `/lib/api`

Centralized HTTP client.

Responsibilities:

* Inject Authorization headers
* Handle 401 refresh flow
* Normalize responses
* Enforce typed contracts

---

## `/store`

Zustand externalized state.

Examples:

`auth.store.ts`

* Persistent identity context

`cart.store.ts`

* Volatile POS state
* In-memory only

---

## `/hooks`

Reusable React lifecycle abstractions.

Examples:

* `useDebounce`
* `useLocalStorage`

No domain coupling.

---

## `middleware.ts`

Edge-level protection.

* Validates JWT signature
* Checks route roles
* Prevents FOUC (Flash Of Unauthenticated Content)

---

# 6. Environment Configuration

Follows Twelve-Factor principles.

---

## `root/.env.example`

Container orchestration variables.

---

## `backend/.env.example`

JWT secrets
Database URL
Port mapping

---

## `frontend/.env.example`

Public API URL
Client-facing configs

All secrets live in backend only.

---

# 7. Docker & Dev Setup

---

* PostgreSQL 16 Alpine container
* Persistent named volume
* Health checks (`pg_isready`)
* Backend waits for DB readiness
* Deterministic local parity with production

---

# 8. Developer Workflow

---

## Branch Strategy

```
type/domain/purpose
feat/auth/refresh-rotation
fix/sales/transaction-bug
```

No direct commits to main.

---

## Database Change Lifecycle

1. Update branch
2. Modify `schema.prisma`
3. Run migration script
4. Commit migration
5. Never manually edit migration SQL
6. Resolve conflicts by rebasing, not editing history

---

# 9. Extension Guidelines

---

## Add New Database Model

1. Modify `schema.prisma`
2. Generate migration
3. Add types to shared-types
4. Update DTOs
5. Update services

---

## Add New Backend Module

1. Generate via Nest CLI
2. Encapsulate DB in service
3. Use DTO validation
4. Protect with guards

---

## Add New Frontend Feature

1. Add route in `/app/(dashboard)/`
2. Add domain logic in `/features/`
3. Add types from shared-types
4. Use centralized API client
5. Protect via middleware if needed

---

# Architectural Guarantees

This structure ensures:

* Strict domain isolation
* Type parity across stack
* Transactional safety
* Scalable feature growth
* Predictable developer onboarding
* Production readiness foundation

---

If you want, I can now generate:

* `CONTRIBUTING.md`
* `DATABASE.md`
* `SECURITY.md`
* Or a simplified version for junior developers
