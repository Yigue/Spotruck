# ADR-001: Monolithic Deploy for V1

**Status:** Accepted  
**Date:** 2026-06-04

## Context

Spottruck is a startup project with a small development team. The primary constraints are:

- **Speed to market**: Need to validate the business model quickly
- **Limited team size**: 2-4 developers, no dedicated DevOps/SRE
- **Cost sensitivity**: Minimal infrastructure overhead
- **Uncertain scale**: Unknown traffic patterns, need to learn before investing in complex infra

The platform consists of a React frontend, Express/Node.js backend, PostgreSQL database, and Redis cache.

## Decision

We will deploy Spottruck V1 as a **monolithic application** with the following characteristics:

- **Single repository** containing both frontend and backend
- **Single Docker Compose** stack for local development
- **Single ECS service** (Fargate) in production
- **Shared PostgreSQL database** (RDS) with schema separation
- **Shared Redis** (ElastiCache) for sessions and caching

```
┌─────────────────────────────────────────────────────────────┐
│                      ECS Service (Fargate)                  │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Frontend      │    │   Backend       │                 │
│  │   (React SPA)   │    │   (Express)     │                 │
│  │   Port 3000     │    │   Port 4000     │                 │
│  └─────────────────┘    └─────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Consequences

### Positive
- **Faster initial development**: Single codebase, simpler CI/CD
- **Easier debugging**: No network hops between services
- **Lower cost**: Single ECS service, simpler networking
- **Simplified local development**: One `docker compose up` starts everything
- **Easier schema migrations**: No distributed transaction concerns

### Negative
- **Scaling asymmetry**: Can't scale frontend separately from backend
- **Technology coupling**: Eventually need to choose different tech for different parts
- **Deployment coupling**: Full stack deploy even for frontend-only changes
- **Eventual rewrite risk**: Architecture may not support V2 scale

### Future Migration Path

When the monolith becomes a bottleneck, we will split into:

1. **Bounded Contexts**: Auth, Trips, Auctions, Payments, Tracking, Ratings
2. **Extract by API**: Each context becomes its own service with its own DB
3. **Event-Driven**: Use RabbitMQ for async communication between services

This ADR will be revisited when:
- Deployment frequency drops below 2x/week due to coordination
- Team grows beyond 8 developers
- One component consistently needs more resources than others

## References

- [AWS ECS Deployment](https://docs.aws.amazon.com/ecs/)
- [Docker Compose in Production](https://docs.docker.com/compose/production/)