# SPEC: Authentication & Authorization

## 1. Feature

**Authentication & Authorization** — User registration, login, session management, and JWT-based token lifecycle.

---

## 2. User Story

> **COMO** usuario **QUIERO** registrarme y hacer login **PARA** acceder a la plataforma

---

## 3. Behavior

### 3.1 Register

- User submits `email`, `password`, and `role` (`COMPANY` or `DRIVER`)
- Optional fields: `companyName` (COMPANY), `driverLicense` + `vehiclePlate` (DRIVER)
- Password is hashed with bcrypt before storage
- On success: `201 Created` + `{ accessToken, refreshToken, user }`

### 3.2 Login

- User submits `email` + `password`
- On correct credentials: `200 OK` + `{ accessToken, refreshToken, user }`
- On wrong password: `401 Unauthorized` + `{ error: "Invalid credentials" }`
- On non-existent email: `401 Unauthorized` + `{ error: "Invalid credentials" }` (do not reveal which field is wrong)

### 3.3 Token Refresh

- User submits a valid `refreshToken`
- Both `accessToken` and `refreshToken` are rotated (new pair issued)
- On expired/invalid refresh token: `401 Unauthorized`

### 3.4 Logout

- Client discards tokens locally
- Server invalidates the `refreshToken` (blocklist or delete)
- Response: `{ success: true }`

### 3.5 Get Profile

- Authenticated requests include `Authorization: Bearer <accessToken>`
- Returns the full user object (without passwordHash)

---

## 4. API Contract

### POST /auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass",
  "role": "COMPANY",
  "companyName": "Acme Logistics"
}
```
| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | Unique, valid email format |
| `password` | string | ✅ | Min 8 chars, 1 uppercase, 1 number |
| `role` | enum | ✅ | `COMPANY` or `DRIVER` |
| `companyName` | string | if role=COMPANY | Max 200 chars |
| `driverLicense` | string | if role=DRIVER | Max 50 chars |
| `vehiclePlate` | string | if role=DRIVER | Max 20 chars |

**Response `201`:**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "COMPANY",
    "companyName": "Acme Logistics",
    "createdAt": "2026-06-04T10:00:00Z"
  }
}
```

**Errors:** `400` validation error | `409` email already exists

---

### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass"
}
```

**Response `200`:**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "COMPANY",
    "companyName": "Acme Logistics"
  }
}
```

**Errors:** `400` validation error | `401` invalid credentials

---

### POST /auth/refresh

**Request:**
```json
{
  "refreshToken": "<jwt>"
}
```

**Response `200`:**
```json
{
  "accessToken": "<new-jwt>",
  "refreshToken": "<new-jwt>"
}
```

**Errors:** `400` validation error | `401` expired or invalid token

---

### POST /auth/logout

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "refreshToken": "<jwt>"
}
```

**Response `200`:**
```json
{
  "success": true
}
```

---

### GET /auth/me

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "COMPANY",
  "companyName": "Acme Logistics",
  "trustScore": 4.5,
  "createdAt": "2026-06-04T10:00:00Z"
}
```

**Errors:** `401` missing or invalid token

---

## 5. Data Model

### User

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `email` | string | Unique, not null |
| `passwordHash` | string | bcrypt hash, not null |
| `role` | enum | `COMPANY`, `DRIVER` |
| `companyName` | string? | nullable, max 200 |
| `driverLicense` | string? | nullable, max 50 |
| `vehiclePlate` | string? | nullable, max 20 |
| `trustScore` | float | default 0.0, 0–5 |
| `createdAt` | DateTime | auto |
| `updatedAt` | DateTime | auto-update |

**Indexes:** `email` (unique)

---

## 6. Edge Cases

- **Duplicate email registration** → return `409 Conflict` with generic message (do not reveal which field)
- **Weak password** → `400` with specific validation error
- **Missing optional fields for role** → `400` with guidance on required fields
- **Refresh token reuse** → treat as potential compromise, invalidate entire user session (all tokens)
- **Access token tampered** → `401` immediately
- **Driver registers without vehiclePlate or driverLicense** → `400`
- **COMPANY submits driver-specific fields** → silently ignored, not rejected

---

## 7. Acceptance Criteria

- [ ] User can register as COMPANY with email, password, and companyName
- [ ] User can register as DRIVER with email, password, driverLicense, and vehiclePlate
- [ ] Registration returns `201` with JWT access + refresh tokens
- [ ] Duplicate email returns `409`
- [ ] Password is stored as bcrypt hash, never plaintext
- [ ] Login with correct credentials returns `200` and both tokens
- [ ] Login with wrong password returns `401`
- [ ] Login with non-existent email returns `401`
- [ ] Token refresh returns new token pair and invalidates old refresh token
- [ ] Logout invalidates the refresh token server-side
- [ ] GET /auth/me returns the authenticated user's profile
- [ ] All protected endpoints reject requests without valid Bearer token
- [ ] JWT access token payload contains `userId` and `role`
- [ ] Token expiry is enforced (access: 15min, refresh: 7d)