# Backend Phase 1 Scope

This NestJS backend currently supports only the Phase 1 foundation:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users` (OWNER only)
- `GET /api/v1/health`

Prisma models kept in scope:

- `User`
- `Session`

The following were intentionally removed from the app surface because they were
incomplete or unsafe:

- products
- categories
- stock
- sales
- reports
- alerts/restock
- password reset placeholders
- background jobs

## Development commands

- `npm run prisma:generate`
- `npm run db:migrate:dev`
- `npm run db:migrate:deploy`
- `npm run db:seed`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
