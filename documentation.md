# Moul Hanout — Full Project Documentation

> **Digital Transformation of Traditional Grocery Stores via Smart Tracking**
> Repository: [GitHub](https://github.com/monssefbaakka/Moul-Hanout-Digital-Transformation-of-Traditional-Grocery-Stores-via-Smart-Tracking)
> Current Phase: **Phase 1 — Foundation**

---

## Table of Contents

- [Moul Hanout — Full Project Documentation](#moul-hanout--full-project-documentation)
  - [Table of Contents](#table-of-contents)
  - [1. Project Overview](#1-project-overview)
  - [2. Vision \& Roadmap](#2-vision--roadmap)
  - [3. Repository Structure](#3-repository-structure)
  - [4. Technology Stack](#4-technology-stack)
  - [5. Architecture Overview](#5-architecture-overview)
  - [6. Backend — NestJS API](#6-backend--nestjs-api)
    - [6.1 Auth Module](#61-auth-module)
      - [Endpoints](#endpoints)
      - [Token Strategy](#token-strategy)
      - [Register Request Body](#register-request-body)
      - [Login Request Body](#login-request-body)
      - [Login / Register Response](#login--register-response)
    - [6.2 Users Module](#62-users-module)
      - [Endpoints](#endpoints-1)
    - [6.3 Health Module](#63-health-module)
      - [Response](#response)
    - [6.4 Prisma / Database Schema](#64-prisma--database-schema)
      - [`User` Model (conceptual)](#user-model-conceptual)
      - [`Session` Model (conceptual)](#session-model-conceptual)
      - [Prisma Commands](#prisma-commands)
  - [7. Frontend — Placeholder UI Shell](#7-frontend--placeholder-ui-shell)
  - [8. Shared Packages](#8-shared-packages)
  - [9. Environment Variables](#9-environment-variables)
    - [Generating Secrets](#generating-secrets)
  - [10. Docker \& Infrastructure](#10-docker--infrastructure)
    - [Services](#services)
      - [`postgres`](#postgres)
      - [`redis`](#redis)
      - [`backend`](#backend)
      - [`frontend`](#frontend)
    - [Named Volumes](#named-volumes)
  - [11. Getting Started](#11-getting-started)
    - [11.1 Prerequisites](#111-prerequisites)
    - [11.2 Local Setup (Without Docker)](#112-local-setup-without-docker)
    - [11.3 Docker Compose Setup](#113-docker-compose-setup)
  - [12. Default Seed Data](#12-default-seed-data)
  - [13. Scripts \& Verification](#13-scripts--verification)
    - [Root-level Scripts](#root-level-scripts)
    - [`npm run check:backend`](#npm-run-checkbackend)
    - [Backend-specific Scripts (inside `backend/`)](#backend-specific-scripts-inside-backend)
  - [14. CI/CD Pipeline](#14-cicd-pipeline)
  - [15. Git Hooks](#15-git-hooks)
  - [16. Future Phases (Planned)](#16-future-phases-planned)
  - [17. Contributing](#17-contributing)
  - [18. Security Notes](#18-security-notes)

---

## 1. Project Overview

**Moul Hanout** (Arabic/Darija for "store owner") is an open-source platform designed to bring digital tools to traditional Moroccan grocery stores (*hanouts*). These small neighbourhood shops typically operate without any digital record-keeping, making inventory management, sales tracking, and financial reporting difficult or impossible.

The project aims to provide a lightweight, affordable, and easy-to-use system that enables *hanout* owners to:

- Register and manage store users (owner, cashier roles).
- Track products, categories, and stock levels (planned).
- Record sales transactions in real time (planned).
- Generate actionable reports and low-stock alerts (planned).
- Export data for accounting or regulatory purposes (planned).

**Current status:** Phase 1 delivers a clean, honest backend foundation — authentication, user management, a health endpoint, and a seeded database. All planned future features have been deliberately removed from the codebase at this stage to keep the foundation solid and verifiable.

---

## 2. Vision & Roadmap

| Phase       | Description                                           | Status    |
| ----------- | ----------------------------------------------------- | --------- |
| **Phase 1** | Foundation: Auth, Users, Health, Prisma schema & seed | ✅ Current |
| **Phase 2** | Products & Categories CRUD                            | 🔜 Planned |
| **Phase 3** | Stock management & tracking                           | 🔜 Planned |
| **Phase 4** | Sales recording & POS flow                            | 🔜 Planned |
| **Phase 5** | Reports, alerts & exports                             | 🔜 Planned |
| **Phase 6** | Background jobs & notifications                       | 🔜 Planned |

---

## 3. Repository Structure

```
/
├── .github/
│   └── workflows/          # GitHub Actions CI pipelines
├── .husky/                 # Git hooks (pre-commit, commit-msg, etc.)
├── backend/                # NestJS API application
│   ├── src/
│   │   ├── auth/           # Auth module (register, login, refresh, logout)
│   │   ├── users/          # Users module (owner-only listing)
│   │   ├── health/         # Health/readiness endpoint
│   │   └── prisma/         # Prisma service & schema
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed script (default users)
│   ├── test/               # E2E smoke tests
│   └── Dockerfile          # Backend Docker image
├── frontend/               # Next.js UI shell (placeholder)
│   └── Dockerfile          # Frontend Docker image
├── packages/               # Shared packages (frontend/backend)
├── scripts/                # Utility/check scripts
├── docs/                   # Additional project documentation
├── .env.example            # Environment variable template
├── docker-compose.yml      # Full-stack Docker Compose config
├── package.json            # Root workspace package.json
├── package-lock.json
├── CONTRIBUTING.md
└── README.md
```

---

## 4. Technology Stack

| Layer                 | Technology                    | Notes                                  |
| --------------------- | ----------------------------- | -------------------------------------- |
| **Backend Framework** | NestJS (Node.js / TypeScript) | Modular, decorators-based REST API     |
| **ORM**               | Prisma                        | Type-safe database client & migrations |
| **Database**          | PostgreSQL 16                 | Primary data store                     |
| **Cache / Sessions**  | Redis 7                       | Session store, future background jobs  |
| **Frontend**          | Next.js (TypeScript)          | Placeholder shell in Phase 1           |
| **Auth**              | JWT (Access + Refresh tokens) | Stateless auth with refresh rotation   |
| **Containerization**  | Docker / Docker Compose       | Full stack runs via compose            |
| **CI**                | GitHub Actions                | Automated checks on push/PR            |
| **Git Hooks**         | Husky                         | Pre-commit checks, commit linting      |
| **Language**          | TypeScript (~86%)             | End-to-end type safety                 |

---

## 5. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│                   Next.js Frontend :3000                  │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP (NEXT_PUBLIC_API_URL)
┌────────────────────────▼─────────────────────────────────┐
│                  NestJS REST API :4000                    │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐                │
│  │  Auth   │  │  Users   │  │  Health  │                │
│  │ Module  │  │  Module  │  │  Module  │                │
│  └────┬────┘  └────┬─────┘  └──────────┘                │
│       │             │                                     │
│  ┌────▼─────────────▼──────────────────────────────┐     │
│  │               Prisma Service                     │     │
│  └────────────────────┬────────────────────────────┘     │
└───────────────────────┼──────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐  ┌─────▼──────┐       │
│  PostgreSQL  │  │   Redis    │       │
│  :5432       │  │   :6379    │       │
└──────────────┘  └────────────┘       │
                                       │
                        (Volumes: postgres_data, redis_data, backend_uploads)
```

The backend exposes a REST API under the `/api/v1` prefix. The frontend communicates with it via `NEXT_PUBLIC_API_URL`. In production (Docker Compose), all four services (postgres, redis, backend, frontend) run in the same Docker network.

---

## 6. Backend — NestJS API

The backend lives in `backend/` and is a standard NestJS monolith structured into feature modules.

### 6.1 Auth Module

**Location:** `backend/src/auth/`

The Auth module handles all authentication flows using JWT access tokens and refresh tokens.

#### Endpoints

| Method | Path                    | Description              | Auth Required |
| ------ | ----------------------- | ------------------------ | ------------- |
| `POST` | `/api/v1/auth/register` | Register a new user      | No            |
| `POST` | `/api/v1/auth/login`    | Login and receive tokens | No            |
| `POST` | `/api/v1/auth/refresh`  | Refresh access token     | Refresh token |
| `POST` | `/api/v1/auth/logout`   | Invalidate session       | Access token  |

#### Token Strategy

- **Access Token:** Short-lived JWT signed with `JWT_SECRET`. Sent in the `Authorization: Bearer <token>` header.
- **Refresh Token:** Longer-lived JWT signed with `JWT_REFRESH_SECRET`. Used to obtain new access tokens without re-logging in.
- **Session persistence:** Refresh token sessions are stored in the database (Prisma `Session` model), enabling server-side invalidation on logout.

#### Register Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePassword1!",
  "name": "User Name"
}
```

#### Login Request Body

```json
{
  "email": "user@example.com",
  "password": "SecurePassword1!"
}
```

#### Login / Register Response

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "CASHIER"
  }
}
```

---

### 6.2 Users Module

**Location:** `backend/src/users/`

Provides user management endpoints restricted to the **OWNER** role.

#### Endpoints

| Method | Path            | Description                 | Auth Required |
| ------ | --------------- | --------------------------- | ------------- |
| `GET`  | `/api/v1/users` | List all users in the store | OWNER only    |

Access is enforced via a role guard. Cashiers calling this endpoint will receive a `403 Forbidden` response.

---

### 6.3 Health Module

**Location:** `backend/src/health/`

A simple readiness/liveness endpoint used by Docker healthchecks, load balancers, and CI pipelines.

| Method | Path             | Description            | Auth Required |
| ------ | ---------------- | ---------------------- | ------------- |
| `GET`  | `/api/v1/health` | Returns service status | No            |

#### Response

```json
{
  "status": "ok",
  "timestamp": "2026-04-16T12:00:00.000Z"
}
```

---

### 6.4 Prisma / Database Schema

**Location:** `backend/prisma/schema.prisma`

Phase 1 includes the baseline schema for users and sessions.

#### `User` Model (conceptual)

| Field       | Type            | Description            |
| ----------- | --------------- | ---------------------- |
| `id`        | UUID            | Primary key            |
| `email`     | String (unique) | User email             |
| `password`  | String          | Bcrypt-hashed password |
| `name`      | String          | Display name           |
| `role`      | Enum            | `OWNER` or `CASHIER`   |
| `createdAt` | DateTime        | Creation timestamp     |
| `updatedAt` | DateTime        | Last update timestamp  |

#### `Session` Model (conceptual)

| Field          | Type     | Description           |
| -------------- | -------- | --------------------- |
| `id`           | UUID     | Primary key           |
| `userId`       | UUID     | Foreign key → User    |
| `refreshToken` | String   | Hashed refresh token  |
| `expiresAt`    | DateTime | Token expiry          |
| `createdAt`    | DateTime | Session creation time |

#### Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (development)
npx prisma migrate dev

# Seed the database
npx prisma db seed

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## 7. Frontend — Placeholder UI Shell

**Location:** `frontend/`

The frontend is a **Next.js** application. In Phase 1, it serves as a placeholder shell — it is containerized and wired up to the backend, but does not yet include a full UI. It is built with TypeScript and communicates with the backend via `NEXT_PUBLIC_API_URL`.

The frontend uses **NextAuth.js** for session management on the client side, backed by the custom JWT auth from the NestJS API.

Key environment variables for the frontend:

| Variable              | Description                           |
| --------------------- | ------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL                  |
| `NEXTAUTH_SECRET`     | NextAuth session signing secret       |
| `NEXTAUTH_URL`        | The canonical URL of the frontend app |

---

## 8. Shared Packages

**Location:** `packages/`

This directory is part of the npm workspace and holds packages shared between the frontend and backend (e.g., shared TypeScript types, validation schemas, constants). The content of these packages evolves with each phase.

---

## 9. Environment Variables

Copy `.env.example` to `.env` at the repo root and fill in the required values before starting any service.

```env
# PostgreSQL
POSTGRES_USER=moulhanout
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=moul_hanout
POSTGRES_PORT=5432

# Backend
BACKEND_PORT=4000
DATABASE_URL=postgresql://moulhanout:CHANGE_ME_STRONG_PASSWORD@postgres:5432/moul_hanout?schema=public
JWT_SECRET=CHANGE_ME_USE_OPENSSL_RAND_BASE64_64
JWT_REFRESH_SECRET=CHANGE_ME_DIFFERENT_FROM_JWT_SECRET

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXTAUTH_SECRET=CHANGE_ME_USE_OPENSSL_RAND_BASE64_32
NEXTAUTH_URL=http://localhost:3000
```

> **Security:** Never commit real secrets to version control. Use `openssl rand -base64 64` to generate strong JWT secrets.

### Generating Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 64

# Generate JWT_REFRESH_SECRET (must differ from JWT_SECRET)
openssl rand -base64 64

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## 10. Docker & Infrastructure

The `docker-compose.yml` at the repo root orchestrates four services:

### Services

#### `postgres`
- Image: `postgres:16-alpine`
- Container: `moul_hanout_db`
- Port: `5432` (configurable via `POSTGRES_PORT`)
- Volume: `postgres_data` (persistent)
- Health check: `pg_isready` every 10 seconds

#### `redis`
- Image: `redis:7-alpine`
- Container: `moul_hanout_redis`
- Port: `6380:6379` (host:container, configurable via `REDIS_PORT`)
- Volume: `redis_data` (persistent, append-only mode enabled)

#### `backend`
- Built from `./backend/Dockerfile` (production target)
- Container: `moul_hanout_api`
- Port: `4000` (configurable via `BACKEND_PORT`)
- Depends on: `postgres` (healthy), `redis` (started)
- Volume: `backend_uploads` (for file uploads in future phases)
- Env: `NODE_ENV=production`, `PORT=4000`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `FRONTEND_URL`

#### `frontend`
- Built from `./frontend/Dockerfile` (production target)
- Container: `moul_hanout_web`
- Port: `3000` (configurable via `FRONTEND_PORT`)
- Depends on: `backend`
- Env: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### Named Volumes

| Volume            | Used By  | Purpose                      |
| ----------------- | -------- | ---------------------------- |
| `postgres_data`   | postgres | Database persistence         |
| `redis_data`      | redis    | Cache / session persistence  |
| `backend_uploads` | backend  | File uploads (future phases) |

---

## 11. Getting Started

### 11.1 Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Docker** and **Docker Compose** (for containerized setup)
- **PostgreSQL** (if running locally without Docker)
- **Redis** (if running locally without Docker)

---

### 11.2 Local Setup (Without Docker)

**1. Clone the repository**

```bash
git clone https://github.com/monssefbaakka/Moul-Hanout-Digital-Transformation-of-Traditional-Grocery-Stores-via-Smart-Tracking.git
cd Moul-Hanout-Digital-Transformation-of-Traditional-Grocery-Stores-via-Smart-Tracking
```

**2. Install all dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env
# Edit .env and fill in POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, NEXTAUTH_SECRET
```

You will also need a backend-specific `.env` if the backend folder has its own `.env.example`:

```bash
# Inside backend/
cp .env.example .env
```

**4. Set up the database**

Ensure PostgreSQL is running locally, then:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

**5. Start the backend**

```bash
npm run dev:backend
```

The API will be available at `http://localhost:4000/api/v1`.

**6. (Optional) Start the frontend**

```bash
npm run dev:frontend
```

The frontend will be available at `http://localhost:3000`.

---

### 11.3 Docker Compose Setup

**1. Clone and configure**

```bash
git clone https://github.com/monssefbaakka/Moul-Hanout-Digital-Transformation-of-Traditional-Grocery-Stores-via-Smart-Tracking.git
cd Moul-Hanout-Digital-Transformation-of-Traditional-Grocery-Stores-via-Smart-Tracking
cp .env.example .env
# Fill in the secrets in .env
```

**2. Build and start all services**

```bash
docker compose up --build
```

**3. Run Prisma migrations and seed (first time only)**

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

**4. Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api/v1
- Health check: http://localhost:4000/api/v1/health

**5. Stop all services**

```bash
docker compose down
```

To also remove volumes (wipes the database):

```bash
docker compose down -v
```

---

## 12. Default Seed Data

After running `prisma db seed`, the following users are available:

| Role        | Email                   | Password       |
| ----------- | ----------------------- | -------------- |
| **Owner**   | `owner@moulhanout.ma`   | `Admin@123!`   |
| **Cashier** | `cashier@moulhanout.ma` | `Cashier@123!` |

> **Important:** Change these credentials before deploying to any non-local environment.

The **Owner** account has full access to all endpoints including the user listing. The **Cashier** account has restricted access.

---

## 13. Scripts & Verification

### Root-level Scripts

| Script        | Command                 | Description                          |
| ------------- | ----------------------- | ------------------------------------ |
| Install deps  | `npm install`           | Install all workspace dependencies   |
| Start backend | `npm run dev:backend`   | Start NestJS API in development mode |
| Check backend | `npm run check:backend` | Full backend validation suite        |

### `npm run check:backend`

This script runs a full validation suite on the backend from the repo root. It executes:

1. **Prisma client generation** — ensures the schema compiles cleanly.
2. **Unit tests** — runs all NestJS unit tests via Jest.
3. **E2E smoke tests** — runs end-to-end tests against a test database.
4. **Build** — compiles the TypeScript backend to JavaScript.

All four steps must pass before a PR can be considered ready.

### Backend-specific Scripts (inside `backend/`)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Build
npm run build

# Start in production mode
npm run start:prod
```

---

## 14. CI/CD Pipeline

**Location:** `.github/workflows/`

GitHub Actions pipelines run on every push and pull request. The CI pipeline mirrors what `npm run check:backend` does locally:

1. Checkout the repository.
2. Set up Node.js.
3. Install dependencies (`npm install`).
4. Run `npm run check:backend` — which includes Prisma generate, unit tests, E2E smoke tests, and a production build.

This ensures no broken code reaches the main branch.

---

## 15. Git Hooks

**Location:** `.husky/`

[Husky](https://typicode.github.io/husky/) is configured to run checks automatically before commits and pushes. Typical hooks include:

- **pre-commit:** Lint and format staged files (e.g., ESLint, Prettier).
- **commit-msg:** Enforce conventional commit message format (e.g., `feat:`, `fix:`, `chore:`).

Hooks are installed automatically after `npm install` via the `prepare` script in `package.json`.

---

## 16. Future Phases (Planned)

The following features are architecturally planned but have been intentionally excluded from the Phase 1 codebase:

| Feature                                | Phase   |
| -------------------------------------- | ------- |
| Product catalog (CRUD)                 | Phase 2 |
| Category management                    | Phase 2 |
| Stock tracking (quantities, movements) | Phase 3 |
| Low-stock alerts                       | Phase 3 |
| Sales recording / POS                  | Phase 4 |
| Daily/weekly/monthly reports           | Phase 5 |
| Data exports (CSV, PDF)                | Phase 5 |
| Background jobs (cron, queues)         | Phase 6 |
| Notifications (email, SMS)             | Phase 6 |

---

## 17. Contributing

See `CONTRIBUTING.md` in the repository root for full contribution guidelines. A summary:

1. **Fork** the repository and create a feature branch from `main`.
2. **Follow** conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
3. **Run** `npm run check:backend` locally — all checks must pass.
4. **Open a Pull Request** against `main` with a clear description of the change.
5. **One reviewer** approval is required before merge.

---

## 18. Security Notes

- Never commit `.env` files with real secrets.
- Always use separate, strong random strings for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `NEXTAUTH_SECRET`.
- Change the default seeded passwords (`Admin@123!` / `Cashier@123!`) before any non-local deployment.
- The `POSTGRES_PASSWORD` in `.env.example` is a placeholder — replace it with a strong password.
- The backend validates and hashes passwords using **bcrypt** before storing them.
- Refresh tokens are stored as hashed values in the database, not in plaintext.
- Redis port is mapped to `6380` on the host (not the standard `6379`) to avoid conflicts with any locally running Redis instance.

---

*Documentation generated from the Phase 1 Foundation of the Moul Hanout project.*
*Last updated: April 2026*