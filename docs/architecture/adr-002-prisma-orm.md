# ADR-002: Prisma ORM

**Status:** Accepted  
**Date:** 2026-06-04

## Context

Spottruck uses **TypeScript + Node.js** for the backend API. Key requirements:

- **Type safety**: End-to-end TypeScript from DB to API response
- **Schema migrations**: Version-controlled database schema changes
- **Developer productivity**: Rapid iteration on data model
- **Query builder**: Need flexibility beyond raw SQL but not full ORM overhead

We evaluated:
- **Raw SQL** (pg): Maximum flexibility, no type safety, manual schema management
- **TypeORM**: Heavy, slow, poor TypeScript support
- **Prisma**: Modern, type-safe, migrations built-in
- **Drizzle**: Lightweight, SQL-like, but less mature

## Decision

We will use **Prisma ORM** as the primary database access layer.

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Express API    │───▶│   Prisma Client  │───▶│   PostgreSQL     │
│   (TypeScript)   │    │   (Type-safe)    │    │   (RDS)         │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                                                      ▲
         │               ┌──────────────────┐                  │
         └──────────────▶│   Prisma Schema  │──────────────────┘
                         │   (schema.prisma)│     Migrations
                         └──────────────────┘
```

### Schema Definition

```prisma
// schema.prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         Role
  createdAt    DateTime @default(now())
  // Relations
  trips        Trip[]
  bids         Bid[]
  ratingsGiven   Rating[] @relation("rater")
  ratingsReceived Rating[] @relation("rated")
}

model Trip {
  id           String   @id @default(uuid())
  userId       String
  origin       Json
  destination  Json
  cargoType    CargoType
  scheduledDate DateTime
  basePrice    Decimal
  status       TripStatus
  createdAt    DateTime @default(now())
  // Relations
  user         User     @relation(fields: [userId], references: [id])
  auction      Auction?
}

enum Role {
  COMPANY
  DRIVER
  ADMIN
}

enum CargoType {
  BULK
  PALLETS
  GENERAL
  REFRIGERATED
}

enum TripStatus {
  DRAFT
  OPEN
  ASSIGNED
  IN_PROGRESS
  DELIVERED
  SETTLED
  CANCELLED
}
```

## Consequences

### Positive
- **Full type safety**: Prisma Client generated types match schema exactly
- **Auto-generated CRUD**: `prisma.user.create()`, `prisma.trip.findMany()` etc.
- **Migrations**: `prisma migrate dev` creates versioned SQL migrations
- **Introspection**: Can generate schema from existing database
- **Query preview**: `prisma.$queryRaw` for raw SQL when needed

### Negative
- **Runtime overhead**: Prisma adds ~5-10ms per query vs raw pg
- **Less flexible**: Complex queries may require raw SQL or `$queryRaw`
- **Client bundle**: Prisma Client adds ~5MB to deployment
- **Connection management**: Prisma pool is separate from pg pool
- **Learning curve**: New team members need to learn Prisma conventions

### Performance Mitigations

- Use **connection pooling** via PgBouncer in production
- Enable **prepared statements** for repeated queries
- Use **selective loading** to avoid over-fetching: `prisma.user.findUnique({ select: { email: true } })`
- Monitor query performance with Prisma Accelerate in future

## References

- [Prisma Documentation](https://prisma.io/docs)
- [Prisma Performance Best Practices](https://pris.ly/performance)
- [When to use Raw SQL in Prisma](https://pris.ly/raw-sql)