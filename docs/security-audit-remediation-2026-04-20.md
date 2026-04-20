# Security Audit Remediation Report — 2026-04-20

## Scope

This audit documents the remediation of three backend security issues in the NestJS API:

1. `GET /users` multi-tenant data leak
2. Missing global rate-limit enforcement
3. Hardcoded `shopId` fallback during authentication

## Changes Implemented

### 1. `GET /users` shop scoping enforced

Affected files:

- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/users.service.ts`

What changed:

- The controller now passes the authenticated user's `shopId` into `UsersService.findAll`.
- The service now filters users through `UserShopRole` using `where.shopRoles.some.shopId`.
- Returned `shopRoles` are also scoped to the same `shopId` before admin-facing mapping.

Security impact:

- Owners can now retrieve only users assigned to their own shop.
- Users from other shops and unassigned users no longer appear in the response.

### 2. Global throttling activated

Affected files:

- `backend/src/app.module.ts`
- `backend/src/modules/health/health.controller.ts`

What changed:

- Registered `ThrottlerGuard` globally through the Nest `APP_GUARD` pattern.
- Preserved the existing named throttling tiers configured in `ThrottlerModule`.
- Excluded the health endpoint with `@SkipThrottle({ short: true, medium: true, long: true })`.

Security impact:

- Public endpoints are now protected by the configured throttling policy.
- Repeated brute-force attempts against routes like `POST /auth/login` are now blocked.
- Internal liveness checks remain available without being rate-limited.

### 3. Auth fallback removed for unassigned users

Affected file:

- `backend/src/modules/auth/auth.service.ts`

What changed:

- Replaced the implicit `'default-shop-id'` fallback with explicit validation.
- Added a shared helper that requires a real shop assignment during login and refresh.
- Authentication now throws `UnauthorizedException('User has no shop assignment')` when no shop role exists.

Security impact:

- Authentication no longer silently proceeds with a bogus tenant context.
- Unassigned accounts now fail closed instead of producing misleading empty or cross-tenant behavior downstream.

## Test Coverage Added or Updated

Affected files:

- `backend/src/modules/auth/auth.service.spec.ts`
- `backend/test/app.e2e-spec.ts`

Coverage includes:

- Login rejection for users without a shop assignment
- Refresh rejection for users without a shop assignment
- `GET /users` tenant isolation against other-shop and unassigned users
- Global throttling enforcement on repeated `POST /auth/login` attempts
- Health endpoint exclusion from throttling

## Validation Run

Executed successfully:

- `npm run prisma:generate --workspace backend`
- `npm run test --workspace backend`
- `npm run test:e2e --workspace backend`
- `npm run build --workspace backend`

## Residual Notes

- This remediation activates the existing throttling configuration globally without changing the configured tier values.
- If additional internal endpoints are added later, they must be explicitly marked with `@SkipThrottle` only when operationally justified.
