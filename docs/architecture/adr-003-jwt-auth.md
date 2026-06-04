# ADR-003: JWT Authentication with Refresh Tokens

**Status:** Accepted  
**Date:** 2026-06-04

## Context

Spottruck is a stateless API platform where:
- Users authenticate from web and mobile clients
- API calls must be stateless (no server-side sessions)
- Security is critical (financial transactions, personal data)
- Users may have long sessions (multi-day trips)

We evaluated:
- **Session-based auth**: Traditional sessions with Redis store
- **Plain JWT**: Simple but no refresh, security risks on token theft
- **OAuth 2.0 / OIDC**: Overkill for internal app, added complexity
- **JWT + Refresh tokens**: Best balance of security and UX

## Decision

We implement **JWT with short-lived access tokens and long-lived refresh tokens**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LOGIN                                                       │
│  ┌─────────┐      POST /auth/login      ┌─────────────┐         │
│  │  Client │ ──────────────────────────▶│   Backend   │         │
│  └─────────┘                            └─────────────┘         │
│       │                                       │                 │
│       │    { accessToken: "eyJ...",           │                 │
│       │      refreshToken: "ref_..." }       │                 │
│       │◀──────────────────────────────────────┘                 │
│                                                                 │
│  2. API CALLS                                                   │
│  ┌─────────┐  Authorization: Bearer eyJ...  ┌─────────────┐     │
│  │  Client │ ──────────────────────────────▶│   Backend   │     │
│  └─────────┘                                └─────────────┘     │
│       │              200 OK + Data                │              │
│       │◀─────────────────────────────────────── │              │
│                                                                 │
│  3. REFRESH (when accessToken expires)                          │
│  ┌─────────┐  POST /auth/refresh          ┌─────────────┐        │
│  │  Client │ ───────────────────────────▶│   Backend   │        │
│  └─────────┘    { refreshToken }          └─────────────┘        │
│       │                                       │                 │
│       │    { accessToken: "eyJ...",           │                 │
│       │      refreshToken: "new_ref_..." }    │ (rotation)      │
│       │◀──────────────────────────────────────┘                 │
│                                                                 │
│  4. LOGOUT                                                      │
│  ┌─────────┐  POST /auth/logout          ┌─────────────┐        │
│  │  Client │ ──────────────────────────▶│   Backend   │        │
│  │         │   { refreshToken }         └─────────────┘        │
│  └─────────┘                            Delete from DB         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Token Configuration

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 15 minutes | Memory (JS variable) | API authentication |
| Refresh Token | 7 days | HttpOnly Cookie OR Secure Storage | Obtain new access token |

### Token Payload Structure

```typescript
// Access Token Payload
interface AccessTokenPayload {
  sub: string;           // User ID
  email: string;
  role: 'COMPANY' | 'DRIVER' | 'ADMIN';
  iat: number;           // Issued at
  exp: number;           // Expires at (iat + 15min)
}

// Refresh Token (stored in DB)
interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;     // SHA-256 hash of token
  expiresAt: Date;
  rotatedAt: Date | null;
  revokedAt: Date | null;
}
```

## Consequences

### Positive
- **Stateless API**: No server-side session storage needed
- **Security**: Short-lived access tokens limit exposure on theft
- **UX**: Users stay logged in without re-entering credentials
- **Rotation**: Refresh token rotation detects stolen tokens
- **Audit**: Refresh token table provides login history

### Negative
- **Complexity**: More moving parts than simple sessions
- **Token management**: Client must handle 401 and refresh flow
- **Revocation delay**: Can't immediately revoke access tokens
- **Storage**: Refresh tokens need persistent storage (DB)

### Security Measures

1. **Refresh Token Rotation**: Each use generates a new refresh token (detect theft via reuse)
2. **Refresh Token Reuse Detection**: If a refresh token is used twice, revoke ALL tokens for that user
3. **Device Limit**: Max 5 active refresh tokens per user
4. **IP Binding**: Optionally bind refresh token to IP (configurable)

### Implementation Notes

- Passwords hashed with **bcrypt** (12 rounds)
- JWT signed with **RS256** (asymmetric) or **HS256** (symmetric, secret in env)
- Refresh tokens hashed with **SHA-256** before storage
- Access tokens NOT stored in localStorage (XSS risk) — use memory

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [JWT Best Practices](https://auth0.com/blog/refresh-tokens-what-are-the-they-and-how-to-use-them/)
- [RFC 7523: JWT Profile for OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc7523)