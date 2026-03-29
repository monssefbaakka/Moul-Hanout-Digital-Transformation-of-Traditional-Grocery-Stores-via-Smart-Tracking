# Authentication API Contract

This document provides the formal specification for the Moul Hanout Authentication and RBAC module.

## 👥 Roles & Permissions

| Role | Description | Access Level |
| :--- | :--- | :--- |
| `OWNER` | Store owner / Manager | Full access to all modules and user management. |
| `CASHIER` | Store staff | Restricted access (Sales, Inventory browse). No user management. |

## 🛡️ Route Matrix

| Endpoint | Method | Access | Minimum Role |
| :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | `Public` | - |
| `/auth/register` | `POST` | `Public` | - |
| `/auth/refresh` | `POST` | `Public` | - |
| `/auth/validate` | `POST` | `Public` | - |
| `/auth/logout` | `POST` | `Protected` | `Any` |
| `/users` | `GET` | `Protected` | `OWNER` |
| `/users/:id` | `GET` | `Protected` | `OWNER` |

## 🚀 Endpoints Specification

### 1. Login
Authenticate and receive a token pair.

- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@moulhanout.ma",
    "password": "Password123!"
  }
  ```
- **Responses**:
  - `200 OK`: `{"accessToken": "...", "refreshToken": "..."}`
  - `401 Unauthorized`: Invalid credentials.

### 2. Token Refresh
Rotate access/refresh token pair.

- **Endpoint**: `POST /auth/refresh`
- **Request Body**:
  ```json
  {
    "refreshToken": "..."
  }
  ```
- **Responses**:
  - `200 OK`: Returns a new pair.
  - `401 Unauthorized`: Invalid or expired refresh token.

### 3. Logout
Revoke the current server-side session.

- **Endpoint**: `POST /auth/logout`
- **Auth**: Bearer Token required.
- **Responses**:
  - `204 No Content`: Successful revocation.
  - `401 Unauthorized`: Invalid token.

---

> [!NOTE]
> All protected routes require an `Authorization: Bearer <token>` header.
> Access tokens typically expire in 15 minutes, while refresh tokens last for 7 days.
