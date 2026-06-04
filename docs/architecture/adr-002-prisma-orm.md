# ADR-002 — Prisma ORM

**Status:** Accepted
**Date:** 2026-06-04

---

## Context

Backend is Node.js + TypeScript. We need a database abstraction that provides:
- Type-safe queries (compile-time checks)
- Schema migrations with version control
- Developer experience (auto-completion, relations)
- No raw SQL strings in application code

---

## Decision

Use **Prisma ORM** with PostgreSQL.

- `schema.prisma` defines all models and enums
- Prisma Client generates fully-typed query methods
- `prisma migrate dev` for schema changes
- `prisma generate` on CI/build

---

## Consequences

**Positive:**
- End-to-end type safety from DB to API response
- Automatic relation loading with `include`
- Migrations with rollback support
- Excellent DX with schema visualization in Prisma Studio

**Negative:**
- Runtime overhead vs raw SQL (~5-10ms per query)
- Less flexible for complex queries (can fall back to `$queryRaw`)
- Prisma client bundle size (~15MB)
- Version upgrades can be breaking

**Mitigation:**
- Use `$queryRaw` for analytics/reporting queries
- Connection pooling via PgBouncer in production
- Monitor query times in staging

---

## Alternatives Considered

- **Raw `pg` + manual typing:** Rejected — too error-prone, no migrations
- **TypeORM:** Better for TypeScript but less type-safe, slower DX
- **Drizzle:** Lighter, faster, but less mature ecosystem (2024+)
