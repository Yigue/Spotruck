# System Context Diagram

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud (us-east-1)                               │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                           Spottruck Platform                                 │  │
│  │                                                                              │  │
│  │  ┌──────────────┐                    ┌──────────────┐                        │  │
│  │  │    ECS       │                    │    S3        │                        │  │
│  │  │  (Fargate)   │                    │  (Assets)    │                        │  │
│  │  │              │                    └──────────────┘                        │  │
│  │  │  ┌────────┐  │                                                            │  │
│  │  │  │Frontend│  │         ┌─────────────────────────────┐                    │  │
│  │  │  │ React  │  │────────▶│      CloudFront CDN        │                    │  │
│  │  │  └────────┘  │         └─────────────────────────────┘                    │  │
│  │  │              │                        ▲                                   │  │
│  │  │  ┌────────┐  │                        │                                   │  │
│  │  │  │Backend │  │                        │                                   │  │
│  │  │  │Express │  │                        │                                   │  │
│  │  │  └────────┘  │                        │                                   │  │
│  │  └───────┬───────┘                         │                                   │  │
│  │          │                                 │                                   │  │
│  │          ▼                                 │                                   │  │
│  │  ┌────────────────┐              ┌─────────┴───────┐                          │  │
│  │  │  RDS PostgreSQL │◀────────────▶│  ElastiCache   │                          │  │
│  │  │    (Primary)    │              │    (Redis)     │                          │  │
│  │  └────────────────┘              └────────────────┘                          │  │
│  │                                                                              │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                    ▲                                              │
│                                    │                                              │
└────────────────────────────────────┼────────────────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  Companies    │          │   Drivers     │          │    Admin      │
│  (Web/Mobile) │          │   (Mobile)    │          │   (Web)       │
└───────────────┘          └───────────────┘          └───────────────┘
```

## Component Details

### External Users

| User Type | Interface | Primary Actions |
|-----------|-----------|-----------------|
| Company | Web Browser | Post trips, manage auctions, confirm delivery, rate drivers |
| Driver | Mobile App | Browse trips, place bids, update GPS, view earnings |
| Admin | Web Browser | Moderate users, resolve disputes, view analytics |

### AWS Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **ECS Fargate** | Container hosting | 2 tasks (frontend + backend), auto-scaling 2-10 |
| **RDS PostgreSQL** | Primary database | db.t3.medium, Multi-AZ, automated backups |
| **ElastiCache Redis** | Sessions, cache, rate limiting | cache.t3.micro, single node |
| **S3** | Static assets, document storage | Standard storage, lifecycle policies |
| **CloudFront** | CDN for assets | Global distribution, SSL termination |

### Network Flow

```
User Request
     │
     ▼
CloudFront (SSL termination)
     │
     ├──▶ Static Assets (S3) ──▶ Cached Response
     │
     └──▶ ECS Load Balancer
              │
              ├──▶ Frontend Container (Port 3000)
              │
              └──▶ Backend Container (Port 4000)
                        │
                        ├──▶ PostgreSQL (Port 5432)
                        │
                        ├──▶ Redis (Port 6379)
                        │
                        └──▶ External APIs (MercadoPago, Maps)
```

## Data Flow Summary

1. **Read-heavy requests**: Served via CloudFront → S3 (static) or Redis cache
2. **Write requests**: Load Balancer → Backend → PostgreSQL
3. **Session data**: Backend → Redis
4. **File uploads**: Backend → S3 → CloudFront URL returned
5. **Payment processing**: Backend → MercadoPago API

## Security Boundaries

```
Internet
    │
    ▼
WAF (Web Application Firewall) ──▶ Rate Limiting, IP Blocking
    │
    ▼
CloudFront ──▶ DDoS Protection, SSL
    │
    ▼
Security Groups (ECS) ──▶ Only ports 80/443 inbound
    │
    ▼
Backend ──▶ JWT Validation, RBAC Checks
    │
    ▼
Database ──▶ Prisma ORM (parameterized queries)
```

## Deployment Topology

```
Production Environment (AWS)
├── us-east-1 (Primary)
│   ├── ECS Cluster (VPC: 10.0.0.0/16)
│   │   ├── Service: spottruck-api (Backend)
│   │   │   ├── Task Definition: spottruck-backend:20
│   │   │   └── Auto Scaling: CPU 70%
│   │   └── Service: spottruck-web (Frontend)
│   │       ├── Task Definition: spottruck-frontend:20
│   │       └── Auto Scaling: CPU 70%
│   ├── RDS (Primary + Replica)
│   │   └── spottruck-db.cluster-xxx.us-east-1.rds.amazonaws.com
│   ├── ElastiCache
│   │   └── spottruck-cache.xxx.0001.use1.cache.amazonaws.com
│   └── S3 Bucket
│       └── spottruck-assets (CloudFront origin)
│
Staging Environment (AWS)
└── Same structure, separate VPC and RDS
```