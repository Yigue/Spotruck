# Spottruck — Performance Considerations

**Date:** 2026-06-04

---

## Database (PostgreSQL 15)

### Connection Pooling
- **PgBouncer** in transaction pooling mode
- Pool size: 20 connections to PostgreSQL
- Max client connections: 100
- Eliminates connection overhead (~5-10ms saved per query under load)

### Indexing Strategy (23 indexes planned)

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | email (unique) | B-tree | Login lookup |
| trips | userId | B-tree | My trips query |
| trips | status | B-tree | Filter by status |
| trips | scheduledDate | B-tree | Date range queries |
| trips | userId + status | Composite | Company's active trips |
| auctions | tripId (unique) | B-tree | Trip → auction lookup |
| auctions | status + endTime | Composite | Cron job query (OPEN + expired) |
| bids | auctionId + createdAt | Composite | Bid history (sorted) |
| bids | userId | B-tree | Driver's bids |
| payments | tripId | B-tree | Trip → payment lookup |
| ratings | toUserId | B-tree | User ratings |
| ratings | tripId + fromUserId | Unique | Prevent duplicate ratings |
| tracking_logs | tripId + recordedAt | Composite | Route history |

### Query Optimization
- Use `select` to limit returned columns (not `include` everything)
- Pagination on all list endpoints (default 20, max 100)
- Avoid N+1 queries — use Prisma's `include` for relations

---

## Caching (Redis)

### Session Cache
- Store active JWT refresh tokens in Redis with TTL
- Key pattern: `refresh:{userId}:{jti}`
- Enables instant token revocation on logout

### Rate Limiting
- In-memory store for development
- Redis store for production (shared across instances)
- Limits:
  - `/auth/login`: 10 req/min per IP
  - `/auth/register`: 5 req/min per IP
  - `/auctions/:id/bid`: 5 req/min per user
  - General API: 500 req/min per user

### Auction State Cache
- Cache `auction.status` + `currentPrice` in Redis
- Key: `auction:{id}:state`
- TTL: 30 seconds (short — must be fresh for bidding)
- Invalidate on bid

---

## API Performance

### Response Compression
- `compression` middleware (gzip) on Express
- Target: 70-80% reduction on JSON responses

### CDN (CloudFront)
- Frontend static assets served from CloudFront
- `Cache-Control: public, max-age=31536000` for hashed assets
- API responses: `Cache-Control: private, no-cache`

### Batch Endpoints (V2)
- Add `POST /trips/batch` for creating multiple trips
- Add `GET /auctions/batch?ids=` for fetching multiple auctions

---

## Load Testing Targets (k6)

```
VUs: 100 concurrent users
Scenarios:
  - Auth flow: 20% of traffic
  - Browse trips: 40% of traffic
  - Place bid: 10% of traffic
  - Track trip: 30% of traffic

KPIs:
  - p95 response time < 500ms
  - p99 response time < 1s
  - Error rate < 1%
  - Throughput: 500 req/s sustained
```

---

## Scaling Strategy

### V1 (< 100 DAU)
- Single EC2 instance (t3.medium)
- PostgreSQL RDS (db.t3.medium)
- Redis ElastiCache (cache.t3.micro)

### V2 (100-1000 DAU)
- ECS Fargate (auto-scaling 2-10 tasks)
- RDS (db.t3.large)
- Redis (cache.t3.medium)
- CloudFront for frontend

### V3 (> 1000 DAU)
- Consider splitting to microservices
- Read replicas for PostgreSQL
- ElastiCache Cluster Mode
- AWS Lambda for background jobs
