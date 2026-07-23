# Moul Hanout — Buyer Handover

Everything a new owner needs to run, understand, deploy, and extend this platform. Read alongside [README.md](README.md) (feature tour + quick start) and [docs/](docs/) (architecture and audits).

---

## 1. What you are buying

A full-stack retail operations platform for traditional grocery stores ("Moul Hanout" = shopkeeper). It replaces paper tracking with digital auth, catalog, inventory, POS checkout, alerts, reporting, and team admin.

- **Monorepo** (npm workspaces): `backend`, `frontend`, `packages/shared-types`, `packages/shared-utils`
- **Backend**: NestJS 11, Prisma 7, PostgreSQL 16, Redis 7, JWT auth, Nodemailer
- **Frontend**: Next.js 15 (App Router), React 19, Zustand, Recharts, Tailwind 4
- **10 backend domain modules**: auth, users, categories, products, inventory, sales, alerts, reports, health, mail
- **14 Prisma models**: Shop, User, UserShopRole, Session, PasswordResetToken, Category, Product, Sale, Payment, Alert, SaleItem, StockBatch, StockMovement, AuditLog
- **UI language**: French (built for local operators). Engineering docs in English.

---

## 2. Run it locally (fastest path)

### Option A — Docker Compose (everything in containers)
```bash
cp .env.example .env      # then edit secrets (see section 4)
docker compose up --build
```
Brings up PostgreSQL, Redis, backend, frontend with healthchecks. Ports below.

### Option B — Node directly
```bash
npm install
cp .env.example .env      # edit secrets
npm run generate:prisma
# ensure PostgreSQL + Redis are running and DATABASE_URL points to them
npm run seed
npm run dev               # backend + frontend together
```

### Endpoints
| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Swagger (non-prod only) | http://localhost:4000/api/docs |
| Health check | http://localhost:4000/api/v1/health |

### Seeded demo accounts
| Role | Email | Password |
| --- | --- | --- |
| Owner | `owner@moulhanout.ma` | `Admin@123!` |
| Cashier | `cashier@moulhanout.ma` | `Cashier@123!` |

Seed also creates a baseline shop, sample categories, and products so POS/inventory/alerts/reports have realistic data.

---

## 3. Verify health after clone

```bash
npm install
npm run generate:prisma
npm run test --workspace backend    # 35 unit tests, 8 suites — expect all green
npm run build                       # builds shared, backend, frontend
```
Full gate (needs a running PostgreSQL for e2e):
```bash
npm run verify                      # shared + backend (unit+e2e+build) + frontend (lint+build)
```

Current state at handover: **backend unit tests 35/35 pass**. Frontend has **no automated tests yet** (see section 8).

---

## 4. Environment variables

Copy `.env.example` → `.env`. Never commit `.env`.

### Required
| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access-token signing secret (`openssl rand -base64 64`) |
| `JWT_REFRESH_SECRET` | Refresh-token secret — must differ from `JWT_SECRET` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Compose DB provisioning |

### Optional
| Var | Purpose |
| --- | --- |
| `REDIS_URL` | Redis connection (defaults to `redis://redis:6379` in Compose) |
| `FRONTEND_URL` | CORS + password-reset links |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `AUTH_PASSWORD_RESET_EXPIRES_IN_MINUTES` | Reset-token TTL (default 30) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Owner email alerts (configure the full set or none) |
| `GEMINI_API_KEY` | AI image/text generation feature (optional) |
| `NEXT_PUBLIC_API_URL` | Frontend → API base URL |
| `NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS` / `NEXT_PUBLIC_DEMO_EMAIL` / `NEXT_PUBLIC_DEMO_PASSWORD` | Prefill demo login (disable in production) |

### ⚠️ Rotate before going live
A Gemini API key was committed to git history earlier in this project's life. **Revoke the old key in Google Cloud Console and issue a fresh one.** Generate new `JWT_SECRET` / `JWT_REFRESH_SECRET` and a new DB password for your own deployment — do not reuse any value that shipped in the repo or its history.

---

## 5. Data & migrations

- Schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- 9 migrations under `backend/prisma/migrations/` (auth foundation → CDC schema → inventory/sales → expiration → password reset → indexes → alert delivery → sale-item totals)

```bash
npm run db:migrate:deploy --workspace backend   # apply migrations in prod
npm run db:migrate:dev     --workspace backend   # create/apply in dev
npm run db:studio          --workspace backend   # Prisma Studio GUI
```
Uploads (product media) persist to `backend/uploads/` (mounted as a volume in Compose). Point this at durable storage in production.

---

## 6. Architecture notes

- Routes under `/api/v1`; responses normalized by a global transform interceptor
- Global `ValidationPipe` (class-validator DTOs), centralized HTTP exception filter, app-wide throttling
- Thin controllers → services own business logic → Prisma owns persistence
- Shared DTOs/types live in `packages/shared-types`; helpers in `packages/shared-utils` — frontend and backend both consume them
- Swagger served only outside production
- Roles: **owner** and **cashier**, enforced by a roles guard on protected routes

---

## 7. Deploy to production

Recommended low-cost path:
1. **Database**: managed PostgreSQL (Railway, Render, Neon, Supabase). Set `DATABASE_URL`.
2. **Redis**: managed Redis (Railway/Upstash). Set `REDIS_URL`.
3. **Backend**: deploy `backend/Dockerfile` (target `production`) to Railway/Render/Fly. Set all required env vars. Run `db:migrate:deploy`, then `db:seed` once.
4. **Frontend**: deploy `frontend/Dockerfile` (or Vercel). Set `NEXT_PUBLIC_API_URL` to the public API URL at build time.
5. Set `NODE_ENV=production` (disables Swagger). Turn off demo-credential prefill.
6. Put HTTPS + a domain in front; confirm `/api/v1/health` returns OK.

Both Dockerfiles are multi-stage with a `production` target already wired in `docker-compose.yml`.

---

## 8. Known limitations / roadmap (honest state)

- **Frontend has no automated tests.** Backend has 35 unit tests; frontend relies on `next build` + ESLint only. Add a test runner (Vitest + Testing Library) and smoke-test the dashboard and POS cart.
- **Single-store-first.** Data model supports multiple shops (`Shop`, `UserShopRole`), but the UI is oriented to one store/owner. Multi-store switching UI is a growth area.
- **French-only UI.** No i18n layer yet — strings are inline. Adding `next-intl` would open other markets.
- **Seed data is Morocco-specific** (Marjane dataset, `.ma` demo emails). Swap for the buyer's catalog.
- **Payments are recorded, not processed.** POS captures payment mode; no gateway integration (Stripe/local providers) yet.
- **e2e tests need a live PostgreSQL**; they are not run in the default `npm test`.

None of these block operation — they are the obvious value-add paths for a new owner.

---

## 9. Handover checklist for the seller

- [ ] Revoke the old Gemini API key in Google Cloud
- [ ] Confirm no live secrets remain in the working tree or git history
- [ ] Transfer the GitHub repository to the buyer's account
- [ ] Provide production env values separately (never in the repo)
- [ ] Walk the buyer through one `docker compose up --build` on a clean machine
- [ ] Hand over any live demo/deployment credentials
