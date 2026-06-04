# Authentication Flow Diagram

## Sequence: Register / Login / Token Refresh / Logout

```
┌─────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  User   │     │   Frontend   │     │   Backend API   │     │    Redis     │     │   PostgreSQL    │
└────┬────┘     └──────┬───────┘     └───────┬─────────┘     └──────┬───────┘     └───────┬─────────┘
     │                 │                      │                      │                      │
     │  1. REGISTER    │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  2. POST /auth/register                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  3. Hash password    │                      │
     │                 │                      │     (bcrypt 12)      │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │                 │                      │  4. INSERT user      │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │                 │                      │  5. Create refresh   │                      │
     │                 │                      │     token record     │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │  6. JWT tokens  │                      │                      │                      │
     │◀────────────────│◀────────────────────│                      │                      │
     │  (access +      │  { accessToken,      │                      │                      │
     │   refresh)      │   refreshToken }      │                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │                      │                      │
     │  7. LOGIN       │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  8. POST /auth/login │                      │                      │
     │                 │   { email, password }│                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  9. Find user        │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │                 │                      │  10. Verify password │                      │
     │                 │                      │     (bcrypt)        │                      │
     │                 │                      │                      │                      │
     │                 │                      │  11. Create JWT     │                      │
     │                 │                      │     (15min)         │                      │
     │                 │                      │                      │                      │
     │                 │                      │  12. Store refresh  │                      │
     │                 │                      │     token (hash)    │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │  13. Tokens     │                      │                      │                      │
     │◀────────────────│◀─────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │                      │                      │
     │  14. API CALL   │                      │                      │                      │
     │   (with JWT)    │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  15. GET /trips      │                      │                      │
     │                 │   Authorization:    │                      │                      │
     │                 │   Bearer eyJ...     │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  16. Validate JWT   │                      │
     │                 │                      │                      │                      │
     │                 │                      │  17. Fetch data     │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │  18. Response   │                      │                      │                      │
     │◀────────────────│◀─────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │  19. JWT EXPIRED│                      │                      │                      │
     │   (after 15min) │                      │                      │                      │
     │                 │                      │                      │                      │
     │  20. REFRESH    │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  21. POST /auth/refresh                      │                      │
     │                 │   { refreshToken }   │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  22. Find token     │                      │
     │                 │                      │     by hash         │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │                 │                      │  23. Validate:      │                      │
     │                 │                      │     - Not expired   │                      │
     │                 │                      │     - Not revoked   │                      │
     │                 │                      │     - User active   │                      │
     │                 │                      │                      │                      │
     │                 │                      │  24. Rotate token:  │                      │
     │                 │                      │     - Revoke old    │                      │
     │                 │                      │     - Issue new     │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │  25. New tokens │                      │                      │                      │
     │◀────────────────│◀─────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │  26. LOGOUT     │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  27. POST /auth/logout                      │                      │
     │                 │   { refreshToken }   │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  28. Revoke token:  │                      │
     │                 │                      │     set revokedAt   │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │  29. Success    │                      │                      │                      │
     │◀────────────────│◀─────────────────────│                      │                      │
     │                 │                      │                      │                      │
```

## Token Storage Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      Token Storage                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Access Token:                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Memory (JavaScript variable) - NOT localStorage           │   │
│  │ Reason: XSS attacks can steal localStorage tokens        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Refresh Token:                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Option A: HttpOnly Cookie (recommended for web)          │   │
│  │ Option B: Secure storage (mobile keychain)               │   │
│  │ NEVER in localStorage or sessionStorage                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Refresh Token Rotation Flow

```
┌────────────────────────────────────────────────────────────────┐
│           Refresh Token Rotation (Theft Detection)             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Normal Flow:                                                  │
│  ┌──────────┐    POST /refresh    ┌───────────┐               │
│  │  Client  │───────────────────▶│   Backend  │               │
│  │          │    old refresh      │           │               │
│  └──────────┘                     └───────────┘               │
│       ▲                                 │                      │
│       │                                 │                      │
│       │         new refresh            │                      │
│       └─────────────────────────────────┘                      │
│                                                                │
│  ─────────────────────────────────────────────────────────────│
│                                                                │
│  Theft Detected (token reuse):                                │
│  ┌──────────┐    POST /refresh    ┌───────────┐               │
│  │  Attacker│───────────────────▶│   Backend  │──┐           │
│  │  (stolen │    old refresh      │            │  │           │
│  │   token) │                     │            │  │  Revoke   │
│  └──────────┘                     └───────────┘  │  ALL user │
│                                                 │  tokens   │
│  ┌──────────┐    POST /refresh    ┌───────────┐ │           │
│  │  Original│───────────────────▶│   Backend  │─┘           │
│  │  Client  │    old refresh     │            │              │
│  │          │ (already used!)    │  401 +     │              │
│  └──────────┘◀────────────────────│  revoke all│              │
│                                   └───────────┘               │
│                                                                │
│  Result: Attacker's token AND user's token are BOTH revoked   │
│          User must re-login                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```