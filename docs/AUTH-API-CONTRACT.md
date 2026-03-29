# Authentication API Contract

This document defines the interface for the Authentication module.

## Base URL
`/api/v1/auth`

## Endpoints

### 1. Login
Authenticates a user and returns a token pair.

- **URL**: `/login`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid credentials or deactivated account.
  - `400 Bad Request`: Validation failed (e.g. invalid email format).

---

### 2. Logout
Invalidates the current session.

- **URL**: `/logout`
- **Method**: `POST`
- **Auth required**: Yes (Bearer Token)
- **Success Response**: `204 No Content`
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token.

---

### 3. Refresh Token
Exchange a refresh token for a new pair of tokens.

- **URL**: `/refresh`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbG..."
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired refresh token.

---

### 4. Validate Token
Manually check if an access token is valid and get user info.

- **URL**: `/validate`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "accessToken": "eyJhbG..."
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "valid": true,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "OWNER",
      "isActive": true,
      "createdAt": "2026-03-16T..."
    },
    "sessionId": "uuid",
    "expiresAt": "2026-03-27T..."
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired access token.

---

### 5. Forgot Password
Request a password reset.

- **URL**: `/forgot-password`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "If an account exists with that email, a reset link has been sent."
  }
  ```

---

### 6. Reset Password
Reset password using a token.

- **URL**: `/reset-password`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "token": "reset-token-uuid",
    "newPassword": "NewPassword123!"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Password has been successfully reset."
  }
  ```

## Role Matrix

| Route | Minimum Role |
| :--- | :--- |
| `GET /users` | `OWNER` |
| `PATCH /users/:id/deactivate` | `OWNER` |
| `POST /auth/logout` | `ANY` |
| `POST /auth/login` | `PUBLIC` |
| `POST /auth/refresh` | `PUBLIC` |
| `POST /auth/validate` | `PUBLIC` |
