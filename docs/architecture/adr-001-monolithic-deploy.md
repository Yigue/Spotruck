# ADR-001 — Monolithic Deploy for V1

**Status:** Accepted
**Date:** 2026-06-04
**Deciders:** Project Team

---

## Context

Spottruck starts as a small startup project with a limited team. The system needs to handle the core flow: companies post trips, drivers bid in auctions, payments are processed. We need to ship V1 fast with minimal operational overhead.

---

## Decision

We will deploy Spottruck as a **monolithic application** for V1:
- Single GitHub repository
- Single Docker Compose stack (backend + frontend + postgres + redis)
- Single ECS service (both containers in same task)
- Shared PostgreSQL database (no per-service DBs)

---

## Consequences

**Positive:**
- Fast to ship — no service discovery, no distributed tracing needed
- Simple local development with `docker compose up`
- Single CI pipeline
- Easy to refactor boundaries later

**Negative:**
- Coupling risk — one team's deploy affects the whole system
- Scaling is coarse — can't scale backend without scaling frontend
- Technology lock-in — moving a service to another stack requires full migration

**Mitigation:**
- Clean module boundaries within the codebase (routes/, services/, models/)
- API contract documented in OpenAPI format
- Decision to split will be revisited at 1000 DAU or if team > 5 engineers

---

## Alternatives Considered

- **Microservices immediately:** Rejected — premature optimization, high operational cost
- **Modular monolith:** Not necessary yet; will migrate to this if needed
