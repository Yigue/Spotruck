# Spottruck — Security Review

**Date:** 2026-06-04
**Reviewer:** Jarvis (Architect Agent)

---

## OWASP Top 10 Assessment

### A01 — Broken Access Control ⚠️
**Status:** Mitigated

- JWT validation on every protected route via `authenticate` middleware
- `requireRole()` middleware enforces COMPANY/DRIVER/ADMIN roles
- Ownership checks on trips: `if (trip.userId !== req.user!.sub && req.user!.role !== 'ADMIN')`
- CORS restricted to configured frontend origin only
- **Vulnerability:** Auction bids not checking if driver already won another auction for same trip → **Fix:** Add unique constraint + validation

### A02 — Cryptographic Failures ✅
**Status:** Compliant

- Passwords hashed with bcrypt (12 rounds) — not MD5 or SHA-1
- JWT secrets configurable via env var (must be changed in production)
- Database connections over internal network (VPC)
- Sensitive data (MercadoPago tokens) in env vars, never in code

### A03 — Injection ⚠️
**Status:** Mostly mitigated

- Prisma uses parameterized queries → no SQL injection
- Zod validation on all input → prevents malformed data
- **Gap:** No rate limiting on bid endpoint → **Fix:** Add express-rate-limit (5 bids/min per user)

### A04 — Insecure Design ✅
**Status:** Compliant

- Anti-sniping prevents auction manipulation
- Role-based access enforced at middleware level
- State machine prevents invalid trip status transitions
- Payment holds prevent fund loss

### A05 — Security Misconfiguration ✅
**Status:** Compliant

- Helmet.js for security headers (XSS, clickjacking, etc.)
- CORS restricted to single origin
- No debug mode in production
- Docker images run as non-root user (nodejs:1001)

### A06 — Vulnerable Components ⚠️
**Status:** Needs ongoing monitoring

- `npm audit` in CI pipeline
- Trivy scan on Docker images
- Keep dependencies updated (Renovate bot recommended for V2)
- **Note:** `jsonwebtoken` v9+ has breaking changes — pin version

### A07 — Auth Failures ⚠️
**Status:** Partially mitigated

- JWT access token TTL: 15 minutes (short — good)
- Refresh token rotation enabled
- **Gap:** No failed login lockout → **Fix:** Add account lockout (5 failed logins = 15 min lockout) using Redis counter

### A08 — Data Integrity Failures ✅
**Status:** Compliant

- Prisma transactions for multi-step operations (bid + update auction price)
- Database constraints (unique, not null, foreign keys)
- Prisma migrations version-controlled

### A09 — Logging & Monitoring ⚠️
**Status:** Planned for V2

- Request logging via morgan ('combined' format = IP, method, path, status, response time)
- **Gap:** No centralized logging (ELK/Splunk) in V1
- **Gap:** No alerting on failed auth attempts
- **Recommendation:** Add structured JSON logging + Datadog/Grafana Loki in V2

### A10 — SSRF ⚠️
**Status:** Low risk

- App doesn't make outbound HTTP requests to user-controlled URLs
- MercadoPago API calls are pre-defined endpoints
- GPS coordinates are validated (-90 to 90, -180 to 180) but could be used for geofence bypass → **Mitigation:** Validate coordinates are within Argentina bounding box

---

## LOPD/PDPA Compliance Notes (Argentina)

Since this operates in Argentina with user data:

- **Consent:** Users explicitly agree to data processing during registration
- **Data minimization:** Only collect what's necessary (no excessive fields)
- **Right to deletion:** Implement `/users/me` DELETE endpoint (not in V1 scope, add V2)
- **Data breach notification:** Not covered in V1 — plan for V2 with proper incident response

---

## Security Checklist for Production Launch

- [ ] Change JWT_SECRET from dev default
- [ ] Set `NODE_ENV=production`
- [ ] Enable database SSL connections
- [ ] Configure Redis AUTH
- [ ] Set up CDN (CloudFront) for static assets
- [ ] Enable CloudWatch/Datadog monitoring
- [ ] Penetration test before public launch
- [ ] Implement rate limiting on all public endpoints
- [ ] Add account lockout (Redis)
- [ ] Set up secrets manager (AWS Secrets Manager / Vault)
