# User Admin Management Update

Date: 2026-04-18

## Purpose

This document summarizes the user administration improvements completed for the single-store MVP.

The goal of this change set was to make user management safer, more consistent, and easier to use without expanding the scope beyond MVP needs.

## What Was Implemented

### 1. Backend self-deactivation protection

Owners can no longer deactivate their own account through the API.

Why:

- prevents accidental admin lockout
- moves the protection to the backend instead of relying only on the frontend

Behavior:

- `PATCH /users/:id/deactivate` now returns `403` if the authenticated owner tries to deactivate their own account

### 2. User reactivation flow

Owners can now reactivate inactive users.

Why:

- deactivation is no longer a one-way action
- avoids manual database changes for restoring user access

Behavior:

- added `PATCH /users/:id/activate`
- reactivated users can log in again

### 3. Shared admin user contract cleanup

The user management API now returns a flat admin-friendly user shape instead of exposing nested `shopRoles` to the frontend.

Why:

- keeps frontend and backend aligned
- reduces UI-side data mapping
- makes the admin user list easier to consume and maintain

Current admin user response shape:

```json
{
  "id": "user-cashier",
  "email": "cashier@moulhanout.ma",
  "name": "Default Cashier",
  "role": "CASHIER",
  "isActive": true,
  "createdAt": "2026-03-18T00:00:00.000Z"
}
```

### 4. Frontend admin workspace updates

The users workspace now supports:

- showing the aligned admin user contract
- reactivating inactive users
- clearer success messages for create, deactivate, and reactivate actions
- keeping inactive users visible in the management list

## API Summary

### List users

```http
GET /users
```

Returns a flat list of admin users.

### Deactivate user

```http
PATCH /users/:id/deactivate
```

Rules:

- owner-only
- cannot deactivate own account

### Reactivate user

```http
PATCH /users/:id/activate
```

Rules:

- owner-only
- restores login access for inactive users

## Frontend Usage

In the users admin screen:

1. Create a cashier account from the create form.
2. Deactivate a user to block future login.
3. Reactivate an inactive user to restore access.

Expected behavior:

- active users can sign in
- inactive users cannot sign in
- owners cannot deactivate themselves

## Files Updated

Backend:

- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/test/app.e2e-spec.ts`

Frontend:

- `frontend/src/app/utilisateurs/users-workspace.tsx`
- `frontend/src/lib/api/api-client.ts`

Shared:

- `packages/shared-types/src/index.ts`

## Validation Completed

The following checks passed:

- shared types build
- backend unit tests
- backend e2e tests
- backend build
- frontend lint

Note:

- frontend production build was attempted but failed locally with `spawn EPERM`, which appears to be an environment/process issue rather than a logic regression in this feature

## MVP Status Impact

For the single-store MVP, the user administration area is now close to complete.

Completed capabilities:

- owner can list users
- owner can create cashier accounts
- owner can deactivate users
- owner cannot deactivate self
- owner can reactivate users
- deactivated users cannot log in
- reactivated users can log in again

## Short Conclusion

This update hardens the admin user flow without expanding scope beyond MVP.

It improves safety, removes a contract mismatch between backend and frontend, and makes user access management operational for the current single-store system.
