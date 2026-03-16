# Auth Service Implementation

## Objective

Implement the backend auth service logic for:

- login flow
- logout flow
- refresh token flow
- token validation flow

## What I changed

### 1. Reviewed the existing auth module first

I started by reading the current NestJS auth files, the Prisma schema, the JWT configuration, and the frontend auth client contract.

Why:

- to avoid breaking the existing API structure
- to reuse the `Session` Prisma model that already existed in the schema
- to confirm what the frontend already expects from `/auth/login` and `/auth/refresh`

Files reviewed:

- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/dto/auth.dto.ts`
- `backend/src/modules/auth/strategies/jwt.strategy.ts`
- `backend/prisma/schema.prisma`
- `frontend/src/lib/api/api-client.ts`

### 2. Reworked the login flow to create a real session

In `backend/src/modules/auth/auth.service.ts`, I changed the login flow so it now:

1. loads the user by email
2. checks that the user exists and is active
3. compares the submitted password with the stored bcrypt hash
4. creates a session record in the `sessions` table
5. generates both access and refresh tokens with a `sid` (session id) inside the JWT payload
6. hashes the refresh token before saving it in the database
7. stores the refresh-token expiration date on the session record

Why:

- a refresh token should not be trusted only because its signature is valid
- storing a hashed version of the refresh token protects it if the database is leaked
- adding `sid` to the JWT payload lets us link every token pair to one revocable server-side session

### 3. Implemented secure refresh token rotation

I replaced the old refresh logic with session-backed rotation.

New refresh flow:

1. verify the refresh token with the refresh secret
2. read the `sid` from the token payload
3. load the matching session from the database
4. confirm the session belongs to the same user and is not expired
5. compare the incoming refresh token with the hashed token stored in the session
6. generate a new access token and a new refresh token
7. replace the stored refresh-token hash with the new one
8. update the session expiration date

Why:

- this prevents old or stolen refresh tokens from being accepted after rotation
- it makes refresh behavior stateful and revocable
- it aligns the backend with a production-safe refresh-token lifecycle

### 4. Implemented logout as session revocation

I changed logout so it now deletes the current session record instead of only clearing `user.refreshToken`.

Controller change:

- logout now reads both `id` and `sessionId` from the authenticated user context

Service change:

- logout deletes the matching session using both `userId` and `sessionId`

Why:

- deleting the session is the actual revocation step
- once the session is removed, the backend can reject tokens tied to that session
- this is much cleaner than a single nullable `refreshToken` field on the user

### 5. Added token validation flow

I added a new DTO and endpoint:

- `ValidateTokenDto`
- `POST /auth/validate`

This endpoint accepts an access token and returns:

- whether the token is valid
- the authenticated user information
- the session id
- the access-token expiration timestamp

Why:

- this gives the system an explicit backend token-validation flow, as requested
- it is useful for clients, gateways, or future middleware that want to validate a token without calling another protected business endpoint

### 6. Strengthened the JWT strategy

In `backend/src/modules/auth/strategies/jwt.strategy.ts`, I updated validation so it now checks:

- the user still exists
- the user is still active
- the token contains a session id
- the referenced session still exists
- the session has not expired

Why:

- this makes logout effective for protected routes
- without this check, an old access token could still pass until its JWT expiry time even after logout
- this also improves consistency between login, refresh, logout, and validation flows

### 7. Added DTO support for the new validation endpoint

In `backend/src/modules/auth/dto/auth.dto.ts`, I added `ValidateTokenDto`.

Why:

- the project already uses DTO-based request validation with `class-validator`
- adding a DTO keeps the new endpoint aligned with the codebase style

### 8. Added focused unit tests

I created `backend/src/modules/auth/auth.service.spec.ts` and covered:

- successful login
- successful refresh rotation
- logout deleting the session
- successful access-token validation
- refresh rejection when the stored hash does not match

Why:

- these flows are security-sensitive and should be verified directly
- the tests protect the new session-backed behavior from regressions

## Files changed

- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/dto/auth.dto.ts`
- `backend/src/modules/auth/strategies/jwt.strategy.ts`
- `backend/src/modules/auth/auth.service.spec.ts`

## Verification performed

I ran the following checks inside `backend`:

1. `npm.cmd test -- auth.service.spec.ts`
2. `npm.cmd run build`

Results:

- the auth unit tests passed
- the NestJS backend build completed successfully

## Design decisions and reasoning

### Why I used the `Session` table

The Prisma schema already had a `Session` model. Reusing it was the right backend design choice because it gives us:

- per-login session tracking
- targeted logout/revocation
- a natural place to store hashed refresh tokens and expiry metadata

### Why I kept login and refresh responses as token pairs

The frontend auth client already expects:

- `/auth/login` -> `AuthTokens`
- `/auth/refresh` -> `AuthTokens`

I kept that contract stable so the new backend behavior improves security without forcing unrelated frontend changes.

### Why I hash refresh tokens

Passwords are not the only sensitive secret in an auth system. Refresh tokens can be abused to mint new access tokens, so storing them in plaintext would be risky.

Hashing them means:

- the database does not directly expose active refresh tokens
- verification still works using `bcrypt.compare`

## Final outcome

The backend now has a complete auth flow with:

- credential-based login
- server-side session creation
- secure refresh token rotation
- session-backed logout
- explicit token validation
- guarded route validation that respects revoked sessions

This makes the auth module much closer to production-ready behavior than the previous stateless refresh implementation.
