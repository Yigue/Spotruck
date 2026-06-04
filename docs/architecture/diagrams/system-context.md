# Spottruck — System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL USERS                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Empresa     │  │  Camionero   │  │  Admin       │           │
│  │  (Browser)   │  │  (Mobile)    │  │  (Browser)  │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          │  HTTPS        │  HTTPS        │  HTTPS
          │                │                │
┌─────────▼────────────────▼────────────────▼────────────────────┐
│                    SPOTTRUCK PLATFORM                          │
│                                                           │
│  ┌─────────────────────────────────────────────────┐       │
│  │  CloudFront CDN                                 │       │
│  │  (Static assets, API caching)                   │       │
│  └─────────────────────┬───────────────────────────┘       │
│                        │                                       │
│  ┌─────────────────────▼───────────────────────────┐       │
│  │  ECS Fargate — Frontend (React)               │       │
│  │  Port 3000 — React SPA                        │       │
│  └─────────────────────┬───────────────────────────┘       │
│                        │                                       │
│  ┌─────────────────────▼───────────────────────────┐       │
│  │  ECS Fargate — Backend (Node.js + Express)    │       │
│  │  Port 4000 — REST API                          │       │
│  │  ┌─────────────┐  ┌─────────────┐              │       │
│  │  │ Auth Svc    │  │ Trip Svc    │              │       │
│  │  │ Auction Svc │  │ Payment Svc │              │       │
│  │  │ Rating Svc  │  │Tracking Svc │              │       │
│  │  └─────────────┘  └─────────────┘              │       │
│  └─────────────────────┬───────────────────────────┘       │
│                        │                                       │
│         ┌──────────────┼──────────────────┐                   │
│         │              │                  │                   │
│  ┌──────▼──────┐ ┌─────▼──────┐  ┌──────▼──────┐          │
│  │ PostgreSQL  │ │   Redis    │  │ RabbitMQ    │          │
│  │  (RDS)      │ │(ElastiCache)│ │  (SQS?)    │          │
│  │  Port 5432  │ │ Port 6379  │  │ Port 5672  │          │
│  └─────────────┘ └────────────┘  └─────────────┘          │
│                                                           │
│  ┌─────────────────────────────────────────────────┐       │
│  │  MercadoPago API (Payments)                    │       │
│  └─────────────────────────────────────────────────┘       │
│                                                           │
│  ┌─────────────────────────────────────────────────┐       │
│  │  OpenStreetMap / Leaflet (GPS Maps)             │       │
│  └─────────────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────────────┘
```

# User Interactions

## Empresa (Publishes Trips)
1. Register/Login → JWT
2. Create Trip → stored in PostgreSQL
3. Start Auction → drivers notified
4. Select Winner → payment hold created
5. Track Trip → GPS updates
6. Confirm Delivery → payment released
7. Rate Driver → trust score updated

## Camionero (Bids on Trips)
1. Register/Login → JWT
2. Browse Auctions → filter by route/cargo
3. Place Bid → bid recorded, price updated
4. Win Auction → payment hold confirmed
5. Update GPS → tracking logged
6. Complete Delivery → payment released
7. Rate Company → trust score updated

## Admin (Platform Management)
1. Login with ADMIN role
2. View all users, trips, auctions
3. Resolve disputes
4. View analytics
