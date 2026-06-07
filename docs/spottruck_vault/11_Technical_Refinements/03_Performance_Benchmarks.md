---
title: Spottruck Performance Benchmarks
description: Estrategia de load testing, KPIs, benchmarking y plan de optimización de performance
date: 2026-06-04
author: Guillermo Riedel
status: draft
tags: [spottruck, performance, benchmarks, load-testing, k6]
area: 11_Technical_Refinements
project: spottruck
stage: performance
---

# Spottruck Performance Benchmarks

## Resumen

Este documento establece la estrategia de benchmarking de performance para Spottruck, incluyendo KPIs objetivo, scripts de load testing con k6, estrategia de caching, y plan de optimización para producción.

## KPIs y Service Level Objectives

### Latency SLIs (Service Level Indicators)

| Endpoint Category | p50 | p95 | p99 | SLO Target |
|-------------------|-----|-----|-----|------------|
| Health check | < 5ms | < 10ms | < 15ms | 99.9% |
| Auth (login/register) | < 80ms | < 150ms | < 200ms | 99.5% |
| Search trips | < 100ms | < 300ms | < 500ms | 99% |
| Get trip detail | < 50ms | < 100ms | < 150ms | 99.9% |
| Create trip | < 100ms | < 200ms | < 300ms | 99.5% |
| Auction bid | < 100ms | < 150ms | < 200ms | 99.9% |
| List my trips | < 80ms | < 200ms | < 300ms | 99% |
| GPS update | < 30ms | < 50ms | < 80ms | 99.9% |
| Payment webhook | < 50ms | < 100ms | < 150ms | 99.9% |
| Static assets | < 10ms | < 20ms | < 30ms | 99.99% |

### Throughput SLIs

| Metric | Target | Peak |
|--------|--------|------|
| Concurrent users | 500 | 2000 |
| Requests per second (API) | 1,000 | 5,000 |
| Auction bids per second | 50 | 200 |
| GPS updates per second | 1,000 | 5,000 |
| Database connections | < 80 | 100 (max pool) |

### Availability SLIs

| Service | SLO Target | Maximum downtime/month |
|---------|------------|------------------------|
| API (all endpoints) | 99.5% | 3h 39m |
| Auction system | 99.9% | 43m |
| Payment processing | 99.99% | 4m 22s |
| GPS tracking | 99% | 7h 18m |
| Dashboard | 99% | 7h 18m |

### Error Rate SLIs

| Category | SLO Target |
|----------|------------|
| HTTP 5xx errors | < 0.1% |
| HTTP 4xx errors | < 1% |
| Failed auction bids | < 0.01% |
| Payment failures | < 0.001% |
| Database query failures | < 0.01% |

## Load Testing Strategy - k6

### Arquitectura de Testing

```
┌─────────────────────────────────────────────────────────────┐
│                      k6 Cloud / Local                       │
│                    (5-50 concurrent VUs)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│                    Spottruck API                            │
│                  (Kubernetes Cluster)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │   API   │  │  Worker │  │  Redis  │  │Postgres │       │
│  │ (Node)  │  │(Celery) │  │         │  │         │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Test Scenarios

#### 1. Smoke Test - Validación de Sistema

```javascript
// smoke-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function() {
  // Health check
  const health = http.get('https://api.spottruck.com/health');
  check(health, {
    'health status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Auth login
  const loginRes = http.post(
    'https://api.spottruck.com/api/auth/login',
    JSON.stringify({
      email: 'test@spottruck.com',
      password: 'testpassword123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has access token': (r) => r.json('access_token') !== undefined,
  });

  sleep(1);
}
```

#### 2. Load Test -正常使用 (Baseline)

```javascript
// load-test.js
import http from 'k6/http';
import { group, check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const searchDuration = new Trend('search_duration');

const BASE_URL = 'https://api.spottruck.com';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Stress
    { duration: '5m', target: 200 },   // Steady stress
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.1'],
  },
};

export default function() {
  const token = login();
  
  group('Trip Search', () => {
    const searchRes = http.get(
      `${BASE_URL}/api/trips/search?origin=Buenos+Aires&destination=Córdoba&date=2026-06-15`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    check(searchRes, {
      'search returns 200': (r) => r.status === 200,
      'has trips': (r) => r.json('trips').length > 0,
    });
    searchDuration.add(searchRes.timings.duration);
    errorRate.add(searchRes.status >= 400);
  });

  group('Auction Bidding', () => {
    // Get active auction
    const auctionRes = http.get(
      `${BASE_URL}/api/auctions/active`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (auctionRes.status === 200 && auctionRes.json('auctions').length > 0) {
      const auctionId = auctionRes.json('auctions')[0].id;
      const bidRes = http.post(
        `${BASE_URL}/api/auctions/${auctionId}/bid`,
        JSON.stringify({ amount: 50000 }),
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      check(bidRes, {
        'bid accepted': (r) => r.status === 200 || r.status === 201,
      });
      errorRate.add(bidRes.status >= 400);
    }
  });

  group('GPS Update', () => {
    const gpsRes = http.patch(
      `${BASE_URL}/api/trips/trip-123/location`,
      JSON.stringify({
        lat: -34.6037,
        lng: -58.3816,
        timestamp: new Date().toISOString()
      }),
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    errorRate.add(gpsRes.status >= 400);
  });

  sleep(1);
}

function login() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: `user${Math.floor(Math.random() * 1000)}@test.com`,
      password: 'Test1234!'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginDuration.add(res.timings.duration);
  return res.json('access_token');
}
```

#### 3. Stress Test - Subastas en Vivo

```javascript
// auction-stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 150 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'],
    'http_req_failed': ['rate<0.001'],
  },
};

export default function() {
  const auctionId = 'auction-456'; // Active auction ID
  
  // Concurrent bids to same auction
  const res = http.post(
    `https://api.spottruck.com/api/auctions/${auctionId}/bid`,
    JSON.stringify({
      amount: Math.floor(Math.random() * 50000) + 40000,
      user_id: `user-${Math.random().toString(36).substring(7)}`
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      tags: { name: 'AuctionBid' }
    }
  );
  
  check(res, {
    'bid processed': (r) => r.status === 200 || r.status === 409 || r.status === 422,
    'response under 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(0.1); // Simulate rapid bidding
}
```

#### 4. Spike Test - Eventos de Mercado

```javascript
// spike-test.js
export const options = {
  scenarios: {
    auction_ending: {
      executor: 'ramping-arrival-rate',
      duration: '30s',
      preallocate: 50,
      rate: 20,          // 20 VUs start
      timeUnit: '1s',
      maxVUs: 200,
      stages: [
        { target: 200, duration: '30s' },  // Sudden spike
        { target: 200, duration: '1m' },    // Hold at peak
        { target: 0, duration: '30s' },     // Rapid drop
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function() {
  // Bid at end of popular auction
  const res = http.post(
    'https://api.spottruck.com/api/auctions/ending-soon/bid',
    JSON.stringify({ amount: 55000 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
```

### Running Tests

```bash
# Local test
k6 run load-test.js

# Local test with environment variables
TEST_TOKEN=xxx k6 run load-test.js --env TEDT_TOKEN=${TEST_TOKEN}

# Cloud test (k6 Cloud)
k6 cloud load-test.js

# Export results to JSON
k6 run load-test.js --out json=results.json

# HTML report
k6 run load-test.js --out html=report.html
```

## Caching Strategy

### Redis Caching Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CloudFront CDN                          │
│  (Static assets, uploaded images, JS/CSS bundles)           │
│  TTL: 1 year (immutable assets), 5 min (mutable)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Redis Cache                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Session     │ │ API Cache   │ │ Rate Limit  │          │
│  │ (JWT blacklist) │ (search results) │ (counters) │          │
│  │ TTL: 15min  │ │ TTL: 1min   │ │ TTL: 1min   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL                               │
│  (Primary data store)                                      │
└─────────────────────────────────────────────────────────────┘
```

### Cache Keys Structure

```typescript
// Cache key patterns
const cacheKeys = {
  // User sessions (JWT blacklist for logout)
  session: (userId: string) => `session:${userId}`,
  
  // Trip search results (frequent queries)
  tripSearch: (params: SearchParams) => 
    `search:trips:${hash(JSON.stringify(params))}`,
  
  // Trip details (read-heavy)
  tripDetail: (tripId: string) => `trip:${tripId}`,
  
  // Auction current state (frequently updated)
  auctionState: (auctionId: string) => `auction:${auctionId}`,
  
  // User ratings (read-heavy, update occasionally)
  userRating: (userId: string) => `rating:${userId}`,
  
  // Price estimation cache (heavy computation)
  priceEstimate: (origin: string, dest: string, cargoType: string) =>
    `price:${origin}:${dest}:${cargoType}`,
};

// TTL configuration
const cacheTTL = {
  session: 900,        // 15 minutes (matches JWT access token)
  tripSearch: 60,      // 1 minute (real-time search)
  tripDetail: 300,     // 5 minutes
  auctionState: 10,     // 10 seconds (real-time auction updates)
  userRating: 3600,    // 1 hour
  priceEstimate: 86400, // 24 hours (market prices don't change often)
};
```

### Cache-Aside Pattern Implementation

```typescript
class TripService {
  async getTrip(tripId: string): Promise<Trip> {
    const cacheKey = cacheKeys.tripDetail(tripId);
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Cache miss - fetch from DB
    const trip = await db.trips.findById(tripId);
    
    // Store in cache with TTL
    await redis.setex(cacheKey, cacheTTL.tripDetail, JSON.stringify(trip));
    
    return trip;
  }
  
  async updateTrip(tripId: string, data: UpdateTripDTO): Promise<Trip> {
    const trip = await db.trips.update(tripId, data);
    
    // Invalidate cache
    await redis.del(cacheKeys.tripDetail(tripId));
    
    // Also invalidate related search caches (pattern-based delete)
    const keys = await redis.keys(`search:trips:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    return trip;
  }
}
```

### Cache Warming for Auctions

```typescript
// Worker: Warm auction cache before auction goes live
async function warmAuctionCache(auctionId: string) {
  const auction = await db.auctions.findById(auctionId, {
    include: ['trip', 'bids', 'participants']
  });
  
  // Pre-compute frequently accessed data
  const cachedData = {
    auction: auction,
    currentBid: auction.bids.sort((a, b) => b.amount - a.amount)[0],
    bidCount: auction.bids.length,
    participantCount: auction.participants.length,
    timeRemaining: calculateTimeRemaining(auction),
  };
  
  await redis.setex(
    cacheKeys.auctionState(auctionId),
    cacheTTL.auctionState,
    JSON.stringify(cachedData)
  );
}

// Scheduled: Refresh auction state every 5 seconds during active auction
cron.schedule('*/5 * * * * *', async () => {
  const activeAuctions = await db.auctions.findActive();
  for (const auction of activeAuctions) {
    await warmAuctionCache(auction.id);
  }
});
```

## Database Optimization

### Connection Pooling (PgBouncer)

```ini
; pgbouncer.ini
[databases]
spottruck = host=postgres port=5432 dbname=spottruck

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
min_pool_size = 10
reserve_pool_size = 10
reserve_pool_timeout = 3
max_db_connections = 100
server_lifetime = 3600
server_idle_timeout = 600
```

### Query Optimization - EXPLAIN ANALYZE

```sql
-- Example: Search trips with filters
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT t.* 
FROM trips t
WHERE t.status = 'PUBLISHED'
  AND t.origin_city = 'Buenos Aires'
  AND t.destination_city = 'Córdoba'
  AND t.pickup_date BETWEEN '2026-06-15' AND '2026-06-20'
  AND t.cargo_type = 'REFRIGERATED'
ORDER BY t.pickup_date ASC
LIMIT 20 OFFSET 0;

-- Expected output:
-- {
--   "Plan": {
--     "Node Type": "Limit",
--     "Startup Time": 0.123,
--     "Total Cost": 45.67,
--     "Actual Time": 0.234,
--     "Buffers": {
--       "Shared Hit": 156,
--       "Read": 0
--     },
--     "Plans": [
--       {
--         "Node Type": "Seq Scan",
--         "Relation Name": "trips",
--         "Filter": "status = 'PUBLISHED'",
--         "Rows Removed by Filter": 1234,
--         "Actual Rows": 20,
--         "Actual Time": 0.189
--       }
--     ]
--   }
-- }
```

### Index Strategy for Search

```sql
-- Partial index for published trips (most common query)
CREATE INDEX idx_trips_published ON trips (pickup_date, origin_city, destination_city)
WHERE status = 'PUBLISHED';

-- Composite index for search with multiple filters
CREATE INDEX idx_trips_search ON trips (status, pickup_date, cargo_type, price)
INCLUDE (id, origin_city, destination_city);

-- GIN index for text search on description
CREATE INDEX idx_trips_description_gin ON trips USING gin(to_tsvector('spanish', description));

-- BRIN index for time-series data (GPS events)
CREATE INDEX idx_tracking_events_brin ON tracking_events USING brin(timestamp)
WITH (pages_per_range = 32);
```

## Performance Monitoring in Production

### Prometheus Metrics

```yaml
# prometheus/rules.yml
groups:
  - name: spottruck-api
    interval: 15s
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency detected"
          description: "p95 latency is {{ $value }}s"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate"
          
      - alert: DatabaseSlowQueries
        expr: rate(pg_stat_statements_mean_exec_time[5m]) > 100
        for: 5m
        labels:
          severity: warning
```

### Grafana Dashboard Queries

```promql
# API Latency (p95)
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket{service="api"}[5m])
)

# Request Rate by Endpoint
sum(rate(http_requests_total{service="api"}[1m])) by (endpoint, method)

# Error Rate
sum(rate(http_requests_total{status=~"5.."}[5m])) 
  / 
sum(rate(http_requests_total[5m]))

# Database Connection Pool Usage
pg_stat_activity{state="active"} / pg_settings{max_connections}

# Auction Bids per Second
rate(auction_bids_total[10s])
```

## Optimization Plan

### Phase 1: Quick Wins (Sprint 1-2)

| Optimization | Impact | Effort | Expected Improvement |
|--------------|--------|--------|---------------------|
| Add indexes for search queries | High | Low | 50% faster searches |
| Enable Redis caching for trips | High | Low | 80% cache hit rate |
| Connection pooling (PgBouncer) | Medium | Low | 30% reduce DB load |
| Enable response compression (gzip) | Low | Low | 40% smaller responses |

### Phase 2: Medium Effort (Sprint 3-4)

| Optimization | Impact | Effort | Expected Improvement |
|--------------|--------|--------|---------------------|
| Database query optimization | High | Medium | 40% faster queries |
| CDN for static assets | Medium | Medium | 60% faster page loads |
| Worker scaling for background jobs | Medium | Medium | 50% faster job processing |
| Redis cluster for high availability | Medium | Medium | 99.99% cache uptime |

### Phase 3: Advanced (Post-Launch)

| Optimization | Impact | Effort | Expected Improvement |
|--------------|--------|--------|---------------------|
| Read replicas for reporting queries | High | High | 10x faster reports |
| GraphQL federation for mobile API | Medium | High | 30% smaller payloads |
| WebSocket for real-time auction updates | High | High | <100ms bid updates |
| ML-based price prediction caching | Medium | High | 70% cache hit rate |

---

**Versión**: 1.0.0
**Última actualización**: 2026-06-04
**Autor**: Guillermo Riedel