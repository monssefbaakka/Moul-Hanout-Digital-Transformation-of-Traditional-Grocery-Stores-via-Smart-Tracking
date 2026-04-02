# Authentication API Contract

This document outlines the API contract for the Moul Hanout POS authentication service.

## 1. Role Matrix & Protections

| Endpoint                  | Access Level    | Allowed Roles   | Description                                 |
| ------------------------- | --------------- | --------------- | ------------------------------------------- |
| `POST /auth/register`     | Public          | N/A             | Create a new user account.                  |
| `POST /auth/login`        | Public          | N/A             | Authenticate user and receive tokens.       |
| `POST /auth/refresh`      | Public          | N/A             | Refresh access token using refresh token.   |
| `POST /auth/logout`       | Protected       | Any Valid Token | Log out current session and revoke tokens.  |
| `GET /users`              | Protected       | `OWNER`         | List system users (example of RBAC route).  |

*Note: Roles are defined in `Role` enum (`OWNER`, `CASHIER`, etc).*

## 2. API Endpoints

### 2.1 POST `/auth/register`
**Status:** Public
**Description:** Registers a new user account.

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@domain.com",
  "password": "SecurePassword123!"
}
```

**Responses:**
- `201 Created`: Account successfully created. Returns created user object without password.
- `400 Bad Request`: Validation errors (e.g., weak password, invalid email format).
- `409 Conflict`: Email address already in use.

---

### 2.2 POST `/auth/login`
**Status:** Public
**Description:** Authenticates a user and returns an access and refresh token.

**Request Body:**
```json
{
  "email": "user@domain.com",
  "password": "SecurePassword123!"
}
```

**Responses:**
- `200 OK`: Successfully authenticated.
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "email": "user@domain.com",
        "name": "User Name",
        "role": "OWNER",
        "isActive": true,
        "createdAt": "2026-03-16T00:00:00.000Z"
      },
      "accessToken": "jwt.access.token",
      "refreshToken": "jwt.refresh.token"
    }
  }
  ```
- `400 Bad Request`: Validation errors (missing fields).
- `401 Unauthorized`: Invalid credentials or deactivated account.

---

### 2.3 POST `/auth/refresh`
**Status:** Public
**Description:** Refreshes an expired access token using a valid refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt.refresh.token"
}
```

**Responses:**
- `200 OK`: Tokens successfully refreshed. Returns new access and refresh tokens.
  ```json
  {
    "success": true,
    "data": {
      "user": { /* user details */ },
      "accessToken": "new.jwt.access.token",
      "refreshToken": "new.jwt.refresh.token"
    }
  }
  ```
- `400 Bad Request`: Missing refresh token.
- `401 Unauthorized`: Invalid or expired refresh token.

---

### 2.4 POST `/auth/logout`
**Status:** Protected (Requires valid `Authorization: Bearer <accessToken>`)
**Description:** Logs out the user and revokes the current session.

**Request Body:** (None)

**Responses:**
- `200 OK`: Successfully logged out and session revoked.
  ```json
  {
    "success": true,
    "data": {
      "message": "Logged out successfully"
    }
  }
  ```
- `401 Unauthorized`: Invalid or missing access token.

## 3. Standard Error Format

In case of `4xx` or `5xx` errors, the system responds with a standard exception payload:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid password",
  "error": "Unauthorized",
  "timestamp": "2026-03-16T12:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```
