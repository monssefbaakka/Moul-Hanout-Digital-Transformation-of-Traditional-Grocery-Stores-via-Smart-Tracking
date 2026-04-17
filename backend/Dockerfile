# ============================================================
# Backend Dockerfile — Multi-stage build (monorepo root context)
# Build context: repo root  (docker-compose: context: .)
# ============================================================

# ─── Stage 1: Build ──────────────────────────────────────────
# A single stage handles install, compile, prisma generate, and prune.
# Splitting into deps/builder here would require duplicating the
# workspace manifest COPYs and runs into the nested-node_modules
# problem (some prod deps land in backend/node_modules/ due to
# workspace version conflicts and must travel with dist/).
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests first so this layer stays cache-stable;
# it only re-runs when a package.json or the lockfile changes.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# HUSKY=0 — no .git in Docker, so the prepare script must be skipped.
RUN HUSKY=0 npm ci

# Copy source after install so the layer above is not invalidated by
# every code change.
COPY packages ./packages
COPY backend ./backend

RUN cd backend && \
    DATABASE_URL=postgresql://prisma:prisma@localhost:5432/prisma \
    npx prisma generate && \
    npm run build
# Strip devDependencies in-place.  This runs after generate so the
# Prisma client is already baked into node_modules/@prisma/client.
RUN HUSKY=0 npm prune --omit=dev

# ─── Stage 2: Production ─────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Hoisted workspace deps (root node_modules).
COPY --from=builder /app/node_modules ./node_modules

# Nested backend workspace deps (packages that could not be hoisted
# due to version conflicts — e.g. @nestjs/cache-manager, @nestjs/terminus).
# Node.js resolves these from backend/dist/main because the resolution
# chain walks up: dist/ → backend/ → root.
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Compiled application.
COPY --from=builder /app/backend/dist ./backend/dist

# Prisma schema + migrations (needed for prisma migrate deploy on startup).
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/prisma.config.js ./backend/prisma.config.js

# package.json is read by some NestJS internals and by npx/prisma CLI.
COPY backend/package.json ./backend/

# Create the uploads directory with correct ownership; node_modules can
# stay root-owned since the app only needs read access to run.
RUN mkdir -p uploads && chown nestjs:nodejs uploads

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

# Run migrations + idempotent seed data before boot so a fresh compose
# stack is usable without manual Prisma commands.
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node dist/prisma/seeds/seed.js && exec node dist/src/main.js"]
