# ============================================================
# Frontend Dockerfile — Multi-stage build (monorepo root context)
# Build context: repo root  (docker-compose: context: .)
#
# next.config.ts sets:
#   outputFileTracingRoot = path.join(__dirname, '..')   ← monorepo root
#
# This means Next.js organises the standalone bundle relative to /app
# (the monorepo root), so the production WORKDIR must also be /app.
# ============================================================

# ─── Stage 1: Dependencies ───────────────────────────────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Copy all workspace manifests so npm resolves the full workspace graph
# and caches this layer independently of source changes.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-utils/package.json ./packages/shared-utils/

# HUSKY=0 — no .git in Docker, so the prepare script must be skipped.
# Use the lockfile directly so optional platform packages such as
# lightningcss are installed in one pass without an extra registry hit.
RUN HUSKY=0 npm ci --include=optional --no-audit --no-fund

# ─── Stage 2: Build ──────────────────────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# Shared packages expose their TypeScript source directly
# ("main": "src/index.ts").  Next.js compiles them via transpilePackages;
# no pre-build step is required.
COPY packages ./packages
COPY frontend ./frontend
# Root package.json is read by Next.js for workspace resolution.
COPY package.json ./

ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN cd frontend && npm run build

# ─── Stage 3: Production ─────────────────────────────────────
FROM node:20-bookworm-slim AS production
# WORKDIR must equal outputFileTracingRoot (/app) so that server.js
# resolves app files at frontend/.next/server/… relative to this root.
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone/ mirrors the repo-root layout because outputFileTracingRoot = /app:
#   standalone/server.js          ← entry point (run from /app)
#   standalone/node_modules/      ← traced runtime deps
#   standalone/frontend/.next/…   ← app server code
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./

# Static assets must be at the path the standalone server expects.
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

# Public files served at /.
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "frontend/server.js"]
