---
title: "Spottruck - Benchmarking de Rendimiento"
date: 2026-06-03
author: "Hermes Agent"
status: "draft"
tags: [spottruck, technical-refinements, rendimiento, benchmarking, load-testing, kpis, optimización]
---

# Spottruck - Benchmarking de Rendimiento

## 1. Introducción

**Propósito:** Definir los benchmarks de rendimiento, estrategia de load testing, KPIs esperados y plan de optimización para la plataforma Spottruck.

**Alcance:** Abarca rendimiento de API, rendimiento de base de datos, métricas de frontend y definiciones de SLA.

---

## 2. Performance Requirements

### 2.1 Service Level Objectives (SLOs)

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              SERVICE LEVEL OBJECTIVES                                              ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   SERVICE                  SLO                  MEASUREMENT WINDOW                                 ║
║   ───────                  ───                  ───────────────────                                 ║
║   API Availability         99.9%                Monthly (30 days)                                  ║
║   API Latency (p95)        < 200ms              Per minute, aggregated                              ║
║   API Latency (p99)        < 500ms              Per minute, aggregated                              ║
║   Homepage Load            < 1.5s               Weekly (p95)                                        ║
║   Search Response          < 300ms              Weekly (p95)                                        ║
║   Auction Update           < 100ms              Real-time (p95)                                     ║
║   Payment Processing       < 3s (90th)          Weekly                                              ║
║   Error Rate               < 0.1%               Monthly                                            ║
║                                                                                                     ║
║   CALCULATION:                                                                          ║
║   ─────────────                                                                         ║
║   Monthly uptime = (total minutes - downtime) / total minutes * 100                               ║
║   99.9% = maximum 43.8 minutes downtime per month                                                ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 2.2 Performance Tiers

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              PERFORMANCE TIERS                                                 │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   TIER 1 - CRITICAL (User-facing, revenue-impacting)                                          │
│   ────────────────────────────────────────────────────────────────────────────────────────    │
│   • Login/Authentication          < 100ms p95                                                   │
│   • Trip search                  < 200ms p95                                                   │
│   • Place bid                    < 150ms p95                                                   │
│   • Accept offer                 < 150ms p95                                                   │
│   • Payment processing           < 2s p90                                                       │
│                                                                                              │
│   TIER 2 - IMPORTANT (Core user experience)                                                   │
│   ────────────────────────────────────────────────────────────────────────────────────────    │
│   • Dashboard load               < 500ms p95                                                   │
│   • Trip creation                < 800ms p95                                                   │
│   • Notification delivery        < 1s p95                                                       │
│   • GPS location update          < 200ms p95                                                    │
│                                                                                              │
│   TIER 3 - NICE TO HAVE (Non-critical)                                                         │
│   ────────────────────────────────────────────────────────────────────────────────────────    │
│   • Report generation            < 5s p95                                                        │
│   • Historical data export       < 10s p95                                                       │
│   • Analytics dashboard         < 2s p95                                                        │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Load Testing Strategy

### 3.1 Test Scenarios

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              LOAD TEST SCENARIOS                                                 ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   SCENARIO 1: Normal Day Traffic                                                              ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║   Users: 5,000 concurrent                                                                             ║
║   Distribution:                                                                                        ║
║   • 40% browsing trips                                                                               ║
║   • 25% searching/filtering                                                                         ║
║   • 20% viewing trip details                                                                         ║
║   • 10% placing bids/offers                                                                          ║
║   • 5% managing account                                                                              ║
║                                                                                                     ║
║   Request rate: ~500 RPS average, 800 RPS peak                                                    ║
║   Duration: 30 minutes sustained                                                                     ║
║                                                                                                     ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   SCENARIO 2: Auction Peak (5PM)                                                              ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║   Users: 2,000 concurrent bidders                                                                   ║
║   Focus: Real-time bid processing                                                                   ║
║   Distribution:                                                                                        ║
║   • 60% bidding (place bid, get current price)                                                   ║
║   • 30% watching auction (live updates)                                                           ║
║   • 10% other operations                                                                           ║
║                                                                                                     ║
║   Request rate: ~2,000 RPS during active bidding                                                   ║
║   WebSocket connections: ~1,500                                                                       ║
║   Duration: 10 minutes peak, 30 minutes total                                                     ║
║                                                                                                     ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   SCENARIO 3: Stress Test (Black Friday)                                                        ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║   Users: 15,000 concurrent                                                                          ║
║   Focus: System breaking point                                                                      ║
║   Distribution:                                                                                        ║
║   • 50% trip search                                                                                ║
║   • 30% placing bids                                                                               ║
║   • 15% trip creation                                                                              ║
║   • 5% payments                                                                                    ║
║                                                                                                     ║
║   Request rate: ~3,000 RPS average, 5,000 RPS peak                                               ║
║   Duration: 60 minutes                                                                              ║
║   Goal: Identify failure modes above 10,000 users                                                 ║
║                                                                                                     ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   SCENARIO 4: Database Stress                                                         ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║   Focus: Database connection pool exhaustion, slow queries                                        ║
║   Pattern: 80% read, 20% write                                                                      ║
║   Query complexity: Mix of simple lookups and complex joins                                       ║
║   Concurrent connections: 500 to PostgreSQL                                                        ║
║                                                                                                     ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   SCENARIO 5: Chaos Testing                                                            ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║   • Kill random containers, verify recovery                                                      ║
║   • Network latency injection (100ms-500ms)                                                       ║
║   • Database failover simulation                                                                ║
║   • External API slowdown ( MercadoPago, Google Maps)                                           ║
║   • Verify circuit breakers trigger correctly                                                     ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 3.2 Load Testing Tools

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              LOAD TESTING TOOLCHAIN                                            │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   k6 (Grafana k6)                                                                           │
│   ─────────────                                                                              │
│   • Script: JavaScript (ES6 modules)                                                          │
│   • Execution: Distributed across 3 worker nodes                                             │
│   • Metrics: InfluxDB → Grafana dashboard                                                     │
│   • CI/CD integration: GitHub Actions                                                         │
│                                                                                              │
│   Example k6 script:                                                                         │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │  import http from 'k6/http';                                                              │  │
│   │  import { check, sleep } from 'k6';                                                       │  │
│   │  import { Rate } from 'k6/metrics';                                                       │  │
│   │                                                                                          │  │
│   │  export const options = {                                                                 │  │
│   │    stages: [                                                                             │  │
│   │      { duration: '5m', target: 100 },   // Ramp up                                       │  │
│   │      { duration: '10m', target: 500 },  // Steady state                                  │  │
│   │      { duration: '5m', target: 0 },     // Ramp down                                     │  │
│   │    ],                                                                                    │  │
│   │    thresholds: {                                                                          │  │
│   │      'http_req_duration': ['p(95)<200'],                                                  │  │
│   │      'http_req_failed': ['rate<0.01'],                                                   │  │
│   │    },                                                                                    │  │
│   │  };                                                                                      │  │
│   │                                                                                          │  │
│   │  const errorRate = new Rate('errors');                                                    │  │
│   │                                                                                          │  │
│   │  export default function() {                                                              │  │
│   │    const res = http.get('https://api.spottruck.com/v1/trips?page=1');                   │  │
│   │    check(res, {                                                                          │  │
│   │      'status is 200': (r) => r.status === 200,                                          │  │
│   │      'has trips': (r) => JSON.parse(r.body).data.length > 0,                            │  │
│   │    });                                                                                  │  │
│   │    errorRate.add(res.status !== 200);                                                    │  │
│   │    sleep(1);                                                                            │  │
│   │  };                                                                                     │  │
│   └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
│   Additional Tools:                                                                           │
│   • Locust (Python-based, good for complex user flows)                                        │
│   • Artillery (Node.js, good for WebSocket testing)                                           │
│   • Gatling (Scala, good for complex scenarios)                                               │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Performance Benchmarks

### 4.1 Endpoint Performance Requirements

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              API ENDPOINT BENCHMARKS                                              ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   AUTHENTICATION ENDPOINTS                                                                      ║
║   ─────────────────────────                                                                      ║
║   Endpoint                  Method    p50       p95       p99       RPS Target                   ║
║   ──────────────────────   ─────    ─────     ─────     ─────     ───────────                   ║
║   /api/v1/auth/login       POST     45ms      80ms      120ms     500                            ║
║   /api/v1/auth/register    POST     60ms      100ms     150ms     200                            ║
║   /api/v1/auth/refresh     POST     20ms      35ms      50ms      1000                           ║
║   /api/v1/auth/logout      POST     15ms      25ms      40ms      500                            ║
║                                                                                                     ║
║   TRIP ENDPOINTS                                                                                 ║
║   ─────────────                                                                                  ║
║   Endpoint                  Method    p50       p95       p99       RPS Target                   ║
║   ──────────────────────   ─────    ─────     ─────     ─────     ───────────                   ║
║   /api/v1/trips            GET      30ms      60ms      100ms     800                            ║
║   /api/v1/trips/:id        GET      20ms      40ms      80ms      1000                           ║
║   /api/v1/trips            POST     150ms     250ms     400ms     100                            ║
║   /api/v1/trips/search     POST     80ms      150ms     250ms     300                            ║
║   /api/v1/trips/:id/bids   GET      25ms      50ms      100ms     500                            ║
║                                                                                                     ║
║   AUCTION ENDPOINTS                                                                            ║
║   ─────────────────                                                                              ║
║   Endpoint                  Method    p50       p95       p99       RPS Target                   ║
║   ──────────────────────   ─────    ─────     ─────     ─────     ───────────                   ║
║   /api/v1/auctions/:id      GET      15ms      30ms      60ms      2000                           ║
║   /api/v1/auctions/:id/bid  POST     40ms      80ms      120ms     500                            ║
║   /api/v1/auctions/:id/rt   WS       10ms      25ms      50ms      1500 (WS)                     ║
║                                                                                                     ║
║   PAYMENT ENDPOINTS                                                                              ║
║   ─────────────────                                                                              ║
║   Endpoint                  Method    p50       p95       p99       RPS Target                   ║
║   ──────────────────────   ─────    ─────     ─────     ─────     ───────────                   ║
║   /api/v1/payments          POST     800ms     1500ms    2500ms    50                             ║
║   /api/v1/payments/:id     GET      30ms      60ms      100ms     500                            ║
║   /api/v1/payments/confirm POST     200ms     400ms     600ms     100                            ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 4.2 Database Performance Targets

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE PERFORMANCE                                            │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   QUERY TYPE                    TARGET          MEASUREMENT                                   │
│   ──────────────────────────   ─────────       ──────────────                                  │
│   Simple index lookup           < 5ms           p99                                             │
│   Join (2-3 tables)            < 20ms          p99                                             │
│   Complex aggregate            < 100ms         p99                                             │
│   Full-text search              < 150ms          p99                                             │
│   Write (INSERT/UPDATE)        < 10ms           p99                                             │
│                                                                                              │
│   CONNECTION METRICS                                                                        │
│   ─────────────────                                                                        │
│   • Active connections: < 80% of max pool (40/50)                                            │
│   • Connection wait time: < 10ms                                                            │
│   • Idle connections: 5-15 (connection pooler)                                              │
│   • Query timeout: 30 seconds                                                               │
│                                                                                              │
│   REPLICATION LAG                                                                           │
│   ───────────────                                                                           │
│   • Read replica lag: < 100ms                                                               │
│   • Write to read replica: < 200ms (eventual consistency)                                    │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Frontend Performance Metrics

### 5.1 Core Web Vitals

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              CORE WEB VITALS TARGETS                                              ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   METRIC                TARGET          MEASUREMENT          INSTRUMENT                          ║
║   ───────               ───────         ───────────          ───────────                          ║
║   LCP (Largest          < 2.0s          75th percentile     Chrome UX Report                     ║
║   Contentful Paint)                                                                                 ║
║                                                                                                     ║
║   FID (First Input      < 100ms         75th percentile     Chrome UX Report                     ║
║   Delay)                                                                                           ║
║                                                                                                     ║
║   CLS (Cumulative      < 0.1            75th percentile     Chrome UX Report                     ║
║   Layout Shift)                                                                                    ║
║                                                                                                     ║
║   INP (Interaction      < 200ms         75th percentile     Chrome UX Report                     ║
║   to Next Paint)        (replaces FID)                                                       ║
║                                                                                                     ║
║   TTFB (Time to         < 200ms         75th percentile     Chrome UX Report                     ║
║   First Byte)                                                                                      ║
║                                                                                                     ║
║   RTT (Round Trip        < 50ms          50th percentile     Real User Monitoring                 ║
║   Time)                         (Argentina targets)                                                ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 5.2 Page Load Targets

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              PAGE LOAD PERFORMANCE                                           │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   PAGE                     LOAD TIME (p95)    Interactive (p95)    LCP (p95)                  │
│   ─────────────────        ──────────────     ─────────────────    ──────────────             │
│   Homepage                 < 1.5s             < 2.0s                 < 2.0s                    │
│   Trip Search              < 1.0s             < 1.5s                 < 1.5s                    │
│   Trip Detail              < 800ms            < 1.2s                 < 1.2s                    │
│   Auction Room             < 500ms            < 800ms                 < 800ms                   │
│   Driver Dashboard        < 2.0s             < 2.5s                 < 2.0s                    │
│   Company Dashboard       < 2.5s             < 3.0s                 < 2.5s                    │
│   Payment Page            < 1.0s             < 1.5s                 < 1.0s                    │
│                                                                                                │
│   MOBILE-SPECIFIC                                                                      │
│   ─────────────────                                                                    │
│   • 3G network (1.6 Mbps): pages must be interactive < 5s                                 │
│   • 4G network (4 Mbps): pages must be interactive < 3s                                   │
│   • 4G advanced (9 Mbps): pages must be interactive < 2s                                   │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Capacity Planning

### 6.1 User Scaling Model

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              CAPACITY PLANNING                                                   ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   CURRENT (MVP Launch)                                                                          ║
║   ─────────────────────                                                                          ║
║   • Registered users: 1,000                                                                       ║
║   • Active users/day: 200                                                                        ║
║   • Concurrent peak: 50                                                                          ║
║   • Trip creations/day: 100                                                                      ║
║   • Auctions active: 20                                                                          ║
║                                                                                                     ║
║   6-MONTH PROJECTION                                                                          ║
║   ─────────────────────                                                                          ║
║   • Registered users: 10,000                                                                     ║
║   • Active users/day: 2,000                                                                      ║
║   • Concurrent peak: 500                                                                         ║
║   • Trip creations/day: 500                                                                      ║
║   • Auctions active: 100                                                                         ║
║   • RPS required: ~300                                                                           ║
║                                                                                                     ║
║   12-MONTH PROJECTION                                                                          ║
║   ─────────────────────                                                                          ║
║   • Registered users: 50,000                                                                     ║
║   • Active users/day: 10,000                                                                     ║
║   • Concurrent peak: 2,000                                                                       ║
║   • Trip creations/day: 2,000                                                                    ║
║   • Auctions active: 400                                                                         ║
║   • RPS required: ~1,200                                                                         ║
║                                                                                                     ║
║   INFRASTRUCTURE SCALING PATH                                                                   ║
║   ─────────────────────────────                                                                   ║
║   ┌────────────────────────────────────────────────────────────────────────────────────────┐    ║
║   │  MVP (0-6 months):          2x API containers, 1x db.r5.large                           │    ║
║   │  Growth (6-12 months):      4x API containers, 1x db.r5.xlarge + read replica          │    ║
║   │  Scale (12+ months):       8x API containers, Aurora PostgreSQL, CDN                  │    ║
║   │  Enterprise (24+ months):   Auto-scaling, multi-region, dedicated DB cluster         │    ║
║   └────────────────────────────────────────────────────────────────────────────────────────┘    ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 6.2 Database Sizing

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE CAPACITY                                                │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   TABLE                           CURRENT ROWS    6-MONTH PROJECTION    STORAGE               │
│   ─────────────────────────       ─────────────   ──────────────────   ─────────             │
│   auth.users                      1,000           10,000               ~50 MB                 │
│   core.trips                      500              5,000               ~500 MB               │
│   core.bids                       5,000           50,000              ~2 GB                │
│   core.auctions                   50               500                ~10 MB               │
│   notifications.items             10,000          100,000             ~1 GB                │
│   audit.logs                      50,000          500,000             ~5 GB                │
│                                                                                              │
│   TOTAL STORAGE (MVP):           ~10 GB                                                        │
│   TOTAL STORAGE (6-month):       ~50 GB                                                        │
│                                                                                              │
│   INDEX OVERHEAD: 30% of data size                                                            │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Optimization Plan

### 7.1 Optimization Priorities

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              OPTIMIZATION ROADMAP                                                ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   PHASE 1 (Weeks 1-4): Quick Wins                                                               ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║   1. Add database indexes for frequent queries                                                  ║
║      • trips(company_id, status)                                                              ║
║      • bids(auction_id, created_at DESC)                                                       ║
║      • notifications(user_id, read, created_at DESC)                                           ║
║                                                                                                     ║
║   2. Enable Redis caching                                                                          ║
║      • Cache trip details (TTL: 60s)                                                           ║
║      • Cache auction current state (TTL: 5s)                                                  ║
║      • Cache user preferences (TTL: 300s)                                                      ║
║                                                                                                     ║
║   3. Enable gzip compression for API responses                                                 ║
║                                                                                                     ║
║   4. Add connection pooling (PgBouncer)                                                         ║
║      • Max connections: 50, idle: 10                                                           ║
║      • Target: reduce DB connection overhead by 40%                                             ║
║                                                                                                     ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   PHASE 2 (Weeks 5-8): Performance Improvements                                                ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║   1. Implement read replicas for search queries                                                 ║
║      • Route SELECT queries to replica                                                          ║
║      • Keep writes on primary                                                                   ║
║                                                                                                     ║
║   2. Optimize slow queries                                                                       ║
║      • ANALYZE on trips, bids, notifications                                                   ║
║      • Rewrite N+1 queries to JOINs                                                            ║
║      • Add composite indexes for common filters                                                ║
║                                                                                                     ║
║   3. Implement query result caching                                                            ║
║      • User's active trips cache                                                                ║
║      • Auction list cache (invalidated on new auction)                                         ║
║                                                                                                     ║
║   4. Add database query timeout (30s max)                                                       ║
║                                                                                                     ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   PHASE 3 (Weeks 9-12): Scale Preparation                                                       ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║   1. Implement WebSocket connection pooling                                                     ║
║      • Use Socket.IO with Redis adapter                                                         ║
║      • Target: 5,000 concurrent WebSocket connections                                          ║
║                                                                                                     ║
║   2. Implement API response caching (CDN)                                                     ║
║      • Cache public endpoints at edge                                                          ║
║      • Invalidate on data changes                                                              ║
║                                                                                                     ║
║   3. Database partitioning                                                                        ║
║      • Partition trips by month (created_at)                                                    ║
║      • Partition notifications by month                                                          ║
║      • Partition audit_logs by month                                                           ║
║                                                                                                     ║
║   4. Implement auto-scaling rules                                                               ║
║      • Scale API containers at 70% CPU                                                          ║
║      • Scale at 500 concurrent connections                                                     ║
║                                                                                                     ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   PHASE 4 (Weeks 13-16): Advanced Optimization                                                  ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║   1. Implement CQRS for auction updates                                                         ║
║      • Separate read model for auction state                                                   ║
║      • Event-driven updates to read model                                                       ║
║                                                                                                     ║
║   2. Implement search optimization                                                              ║
║      • Elasticsearch for full-text search                                                       ║
║      • Move complex filters to ES                                                              ║
║                                                                                                     ║
║   3. Database sharding consideration                                                           ║
║      • Shard by user_id for large tables                                                        ║
║      • Evaluate after 1M+ users reached                                                         ║
║                                                                                                     ║
║   4. ImplementGraphQL federation (future)                                                       ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 7.2 CDN and Static Asset Performance

```python
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              CDN Y RENDIMIENTO DE ACTIVOS ESTÁTICOS                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   CONFIGURACIÓN DE CDN (CloudFront/AWS)                                                         │
│   ─────────────────────────────────────────                                                     │
│   • Edge locations: 15 (Latinoamérica), 5 (Europa)                                             │
│   • Certificados SSL: *.spottruck.com (AWS ACM)                                                │
│   • Protocols: HTTPS only (TLS 1.3), HTTP/2, HTTP/3 (QUIC)                                     │
│                                                                                                  │
│   CACHÉ DE ACTIVOS ESTÁTICOS                                                                    │
│   ───────────────────────────────                                                                │
│   • JavaScript/CSS: Cache-Control: public, max-age=31536000, immutable                         │
│   • Imágenes: Cache-Control: public, max-age=2592000 (30 días)                                │
│   • Fuentes: Cache-Control: public, max-age=31536000                                           │
│   • HTML: Cache-Control: public, max-age=0, must-revalidate (preciso para SPA)                │
│                                                                                                  │
│   MÉTRICAS DE RENDIMIENTO CDN                                                                    │
│   ───────────────────────────────                                                                │
│   • Cache hit ratio: > 95% para activos estáticos                                             │
│   • Time to First Byte (CDN): < 30ms (p95) desde edge cercana                                 │
│   • Downstream bitrate: > 50 Mbps (p95)                                                        │
│   • Connection setup time: < 10ms (TLS resumable)                                               │
│                                                                                                  │
│   OPTIMIZACIÓN DE IMÁGENES                                                                       │
│   ─────────────────────────────                                                                  │
│   • Formatos: WebP con fallback JPEG/PNG                                                       │
│   • Responsive images: srcset con 3 breakpoints (640w, 1024w, 1920w)                          │
│   • Lazy loading: IntersectionObserver para imágenes below-the-fold                            │
│   • Compression: MozJPEG (quality 80) para fotos de camiones                                   │
│   • Sprites: SVG sprites para iconografía de interfaz                                          │
│                                                                                                  │
│   INCREMENTO DE VELOCIDAD DE CARGA                                                               │
│   ──────────────────────────────                                                                │
│   • HTTP/2 multiplexing: permite múltiples requests en una conexión                            │
│   • Early hints: envío de headers Link antes de respuesta completa                             │
│   • Brotli compression: 15% mejor que gzip para activos JS/CSS                                 │
│   • Resource hints: <link rel="preconnect"> para APIs y CDNs                                 │
│   • DNS prefetch: resolución anticipada de dominios de terceros                                 │
│                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Performance Monitoring

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              PERFORMANCE MONITORING                                            │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   DASHBOARDS                                                                                 │
│   ──────────                                                                                 │
│   • Grafana: API Performance (latency, RPS, errors)                                          │
│   • Grafana: Database Performance (queries, connections, slow queries)                       │
│   • Grafana: Business Metrics (trips, auctions, revenue)                                      │
│   • Kibana: Application Logs (errors, warnings)                                              │
│   • Kibana: Audit Logs (security events)                                                    │
│                                                                                              │
│   ALERTS                                                                                     │
│   ──────                                                                                     │
│   • API latency p95 > 500ms for 5 minutes → PagerDuty + Slack                                │
│   • Error rate > 1% for 2 minutes → PagerDuty                                               │
│   • DB connections > 80% for 1 minute → Slack                                                │
│   • Disk usage > 80% → Slack                                                                │
│   • Memory usage > 85% for 5 minutes → Slack                                                │
│                                                                                              │
│   REPORTING                                                                                  │
│   ──────────                                                                                 │
│   • Weekly performance report (auto-generated)                                               │
│   • Monthly SLO compliance report                                                            │
│   • Quarterly capacity planning review                                                       │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Performance Budget

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              PERFORMANCE BUDGET                                                 ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   JAVASCRIPT BUNDLE                                                                          ║
║   ─────────────────                                                                          ║
║   • Initial bundle: < 150 KB (gzipped)                                                        ║
║   • Lazy-loaded chunks: < 50 KB each                                                          ║
║   • Third-party libraries: < 80 KB total                                                       ║
║                                                                                                     ║
║   IMAGES                                                                                      ║
║   ──────                                                                                      ║
║   • Largest Contentful Paint images: < 100 KB each                                            ║
║   • WebP format preferred, JPEG fallback                                                       ║
║   • Lazy loading for below-fold images                                                        ║
║   • CDN-served with cache headers (1 year)                                                   ║
║                                                                                                     ║
║   API RESPONSES                                                                               ║
║   ─────────────                                                                               ║
║   • List endpoints: < 50 items per page, total payload < 20 KB                              ║
║   • Detail endpoints: < 5 KB                                                                  ║
║   • Compression: gzip on all responses (min 500 bytes)                                       ║
║                                                                                                     ║
║   DATABASE                                                                                    ║
║   ────────                                                                                    ║
║   • No query should exceed 30 seconds                                                          ║
║   • Maximum 10 queries per page load (use N+1 detector)                                       ║
║   • Slow query threshold: 100ms                                                                ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 8. Mobile Network Optimization

```python
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              OPTIMIZACIÓN DE RED MÓVIL                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   ESTRATEGIA DE OPTIMIZACIÓN PARA REDES MÓVILES                                                 │
│   ─────────────────────────────────────────────                                                 │
│   Spottruck debe funcionar de manera óptima en redes 3G/4G/LTE utilizadas por                 │
│   transportistas en rutas. Las áreas de descanso frecuentemente tienen                         │
│   conectividad limitada y alta latencia.                                                       │
│                                                                                                  │
│   OPTIMIZACIÓN DE CONEXIONES                                                                    │
│   ─────────────────────────────                                                                  │
│   • Keep-alive connections: mantener conexiones HTTP abiertas con heartbeats                  │
│   │   cada 30 segundos para reducir latency de requests subsecuentes                         │
│   • Request batching: agrupar múltiples requests pequeños en uno solo                        │
│   │   para minimizar overhead de round-trips                                                   │
│   • Exponential backoff: implementación de reintentos con backoff exponencial                   │
│   │   (1s, 2s, 4s, 8s, máximo 30s) para requests fallidos                                     │
│   • Connection pooling: reuse de conexiones HTTP para evitar overhead de TLS                 │
│                                                                                                  │
│   ESTRATEGIA DE DATOS                                                                           │
│   ─────────────────────                                                                         │
│   • Delta updates: envío de únicamente cambios desde última sincronización                      │
│   │   (tamaño típico: 2-5 KB vs 50-100 KB para payload completo)                              │
│   • Compresión de datos: gzip para payloads > 1 KB                                             │
│   • Binary protocols: evaluación de Protocol Buffers para APIs de alta frecuencia             │
│   │   (location updates cada 30s)                                                             │
│   • Local caching: almacenamiento en caché local con invalidación inteligente                 │
│   │   (Cache-Control: stale-while-revalidate)                                                 │
│                                                                                                  │
│   MANEJO DE CONECTIVIDAD INTERMITENTE                                                           │
│   ─────────────────────────────────────                                                         │
│   • Offline mode: queue de operations locally cuando no hay conectividad                       │
│   │   con sincronización automática al reconectar                                              │
│   • Optimistic UI: mostrar datos locales inmediatamente, sincronizar en background            │
│   • Retry queue: persistencia de requests pendientes en IndexedDB                             │
│   │   con reintento automático al reconectar                                                  │
│   • Sync conflict resolution: timestamp-based last-write-wins con                             │
│   │   notificación al usuario cuando hay conflictos                                           │
│                                                                                                  │
│   PRIORIDAD DE DATOS EN BACKGROUND                                                              │
│   ───────────────────────────────────                                                           │
│   • Immediate: Location updates, safety alerts, emergency notifications                        │
│   • High: Trip status updates, bid notifications, messages                                    │
│   │   (Background sync: wifi-only para preservación de batería)                              │
│   • Normal: Dashboard data, reports, analytics                                                │
│   │   (Background sync: wifi + charging)                                                      │
│   • Low: Historical data sync, non-critical images                                            │
│   │   (Background sync: wifi-only, low battery skip)                                         │
│                                                                                                  │
│   OPTIMIZACIÓN DE LOCATION TRACKING                                                             │
│   ─────────────────────────────────                                                           │
│   • Adaptive GPS sampling: 30s en movimiento, 5min detenido                                  │
│   • Batching de ubicación: acumular 10 puntos antes de enviar (ahorro 90% en datos)        │
│   • WiFi-based location: fallback a WiFi triangulation en túneles/garajes                     │
│   • Battery optimization: reducir precisión GPS cuando batería < 20%                        │
│                                                                                                  │
│   LÍMITES DE DATOS POR SESIÓN                                                                   │
│   ──────────────────────────────                                                                │
│   • Actualización de dashboard: máximo 50 requests/sesión                                     │
│   • Imágenes: lazy loading con placeholder, máximo 10 imágenes simultáneas                    │
│   • Videos (si aplica): solo con WiFi, máximo 50 MB por sesión                                │
│   • Offline maps: almacenamiento local de mapas para rutas frecuentes                        │
│                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Test Execution Schedule

| Test Type | Frequency | Duration | Environment |
|-----------|-----------|----------|-------------|
| Unit Tests | Every PR | ~5 min | CI |
| Integration Tests | Every PR | ~15 min | CI |
| Load Tests (Smoke) | Daily | ~10 min | Staging |
| Load Tests (Full) | Weekly | ~60 min | Staging |
| Stress Tests | Monthly | ~90 min | Production-like |
| Chaos Tests | Monthly | ~30 min | Staging |

---

## 10. Resumen de KPIs

| KPI | Actual | Objetivo 6 meses | Objetivo 12 meses |
|-----|--------|-------------------|-------------------|
| Disponibilidad API | 99.5% | 99.9% | 99.95% |
| Latencia API (p95) | 250ms | <200ms | <150ms |
| Tiempo de carga página (p95) | 2.5s | <1.5s | <1.0s |
| Tasa de error | 0.5% | <0.1% | <0.05% |
| Usuarios concurrentes | 50 | 500 | 2,000 |
| RPS (pico) | 100 | 300 | 1,200 |

---

## 11. Apéndice: Glosario de Términos

| Término | Definición |
|---------|------------|
| SLO | Service Level Objective - Objetivo de nivel de servicio |
| p95 | Percentil 95 - valor que supera el 95% de las mediciones |
| RPS | Requests Per Second - Solicitudes por segundo |
| CDN | Content Delivery Network - Red de distribución de contenidos |
| TTFB | Time to First Byte - Tiempo hasta el primer byte |
| LCP | Largest Contentful Paint - Tiempo de carga del elemento más grande |
| CLS | Cumulative Layout Shift - Cambio acumulativo de diseño |
| INP | Interaction to Next Paint - Interacción hasta siguiente pintura |
| k6 | Herramienta de load testing open source (Grafana k6) |
| SIEM | Security Information and Event Management |
| WORM | Write Once Read Many - Almacenamiento inmutable |