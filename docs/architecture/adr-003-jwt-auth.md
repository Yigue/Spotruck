# ADR-003 — JWT Auth with Refresh Token Rotation

**Status:** Accepted
**Date:** 2026-06-04

---

## Context

Stateless API. Need secure authentication that works across multiple clients (web, future mobile). Users stay logged in for 7 days but access tokens must be short-lived for security.

---

## Decision

**JWT with dual-token pattern:**

| Token | TTL | Storage | Purpose |
|-------|-----|---------|---------|
| Access Token | 15 min | Memory (not localStorage) | API authorization |
| Refresh Token | 7 days | httpOnly cookie | Obtain new access tokens |

- Passwords hashed with bcrypt (12 rounds)
- Refresh token rotation: each `/auth/refresh` issues a new refresh token
- Refresh tokens stored in Redis for invalidation on logout
- `jti` (JWT ID) claim for token revocation tracking

---

## Consequences

**Positive:**
- Access tokens are short-lived — limited damage if leaked
- No database query on every request (stateless validation)
- Refresh rotation prevents replay attacks
- Works for mobile (native token storage)

**Negative:**
- Refresh token theft → full account compromise (mitigated with rotation)
- More complex than simple session cookies
- Clock skew can cause valid token rejection

**Mitigation:**
- Store refresh tokens in Redis with TTL = 7 days
- Invalidate all refresh tokens on password change
- Rate limit `/auth/refresh` endpoint (5/min per IP)
- Consider device fingerprinting in V2

---

## Alternatives Considered

- **Session cookies:** Rejected — not mobile-friendly, sticky sessions needed
- **OAuth2/OIDC:** Overkill for V1 internal platform
- **Simple JWT without rotation:** Rejected — no way to revoke compromised tokens
