---
name: spottruck-app
description: Contexto completo del proyecto Spottruck — arquitectura, stack, convenciones, APIs y specs
tags: [spottruck, fullstack, react, nodejs, postgres]
version: 1.0.0
author: Jarvis (Hermes Agent)
---

# Spottruck App — Contexto del Proyecto

## Proyecto
Plataforma SaaS de subastas inversas para transporte de carga en Argentina.
**Carpeta:** `/home/jarvis/projects/spottruck`

---

## Stack Tecnológico

```
Frontend:  React 18 + Vite + TailwindCSS + React Router + Axios
Backend:   Node.js + Express + TypeScript
Database:  PostgreSQL 15 + Prisma ORM
Cache:     Redis
Queue:     RabbitMQ
Maps:      OpenStreetMap + Leaflet
Auth:      JWT (access 15min, refresh 7d)
Payments:  MercadoPago
IaC:       Terraform
Container: Docker + Docker Compose
CI/CD:     GitHub Actions
Testing:   Vitest (frontend), Jest + Supertest (backend), Playwright (e2e)
```

---

## Arquitectura de Carpetas

```
spottruck/
├── src/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/    # Componentes reutilizables
│   │   │   ├── pages/         # Vistas (rutas)
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── utils/         # Helpers
│   │   │   ├── styles/         # Tailwind config
│   │   │   └── App.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/        # Express routes
│   │   │   ├── services/      # Lógica de negocio
│   │   │   ├── models/        # Prisma schemas
│   │   │   ├── middleware/    # Auth, validation, error handling
│   │   │   ├── utils/         # Helpers
│   │   │   ├── config/        # Env config
│   │   │   └── index.ts       # Entry point
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   └── infrastructure/
│       ├── terraform/
│       └── ansible/
├── tests/
├── docs/
├── SPEC.md
└── README.md
```

---

## Convenciones de Código

### Commits (Conventional Commits)
```
feat: <descripción>          # Nueva feature
fix: <descripción>           # Bug fix
docs: <descripción>          # Docs
refactor: <descripción>       # Refactor sin cambio de comportamiento
test: <descripción>          # Tests
chore: <descripción>         # Mantenimiento, deps
perf: <descripción>          # Performance
```

### Naming
```
JS/TS:     camelCase (variables, funciones)
           PascalCase (componentes React, clases)
           SCREAMING_SNAKE_CASE (constantes)
DB:        snake_case
Files:     kebab-case
```

### TypeScript Rules
- Strict mode ON
- No `any` — usar `unknown` si es necesario
- Interfaces sobre types para объекты
- Export named, no default para utils/services

---

## API Base

```
Base URL: http://localhost:4000/api/v1
Auth:     Authorization: Bearer <jwt>
Content:  application/json
```

---

## Modelos Principales

### User
```
id, email, password_hash, role (COMPANY|DRIVER|ADMIN)
company_name, company_cuit, phone
driver_license, vehicle_plate, vehicle_type
rating_avg, trips_completed, created_at
```

### Trip
```
id, user_id, origin_address, origin_lat, origin_lng
destination_address, dest_lat, dest_lng
cargo_type (BULK|PALLETS|GENERAL|REFRIGERATED)
weight_kg, scheduled_date, base_price
status (DRAFT|OPEN|AUCTION|ASSIGNED|IN_PROGRESS|DELIVERED|SETTLED|CANCELLED)
created_at, updated_at
```

### Auction
```
id, trip_id, type (OPEN|DUTCH|SEALED)
start_time, end_time, status (PENDING|OPEN|CLOSED|SETTLED)
current_price, reserve_price
extension_count
```

### Bid
```
id, auction_id, user_id, amount, created_at
```

---

## Estados de Viaje (State Machine)

```
DRAFT → OPEN → AUCTION → ASSIGNED → IN_PROGRESS
                                    ↓
                              DELIVERED → SETTLED
                                    ↓
                               CANCELLED
```

---

## Design Tokens (del SPEC.md)

```
Primary:    #1B5E20
Secondary:  #212121
Accent:     #FF6D00
Background: #FAFAFA
Surface:    #FFFFFF
Text:       #1A1A1A
TextMuted:  #757575
Success:    #2E7D32
Warning:    #F57C00
Error:      #C62828

Font: Inter (400, 500, 700)
Scale: 12/14/16/20/24/32/48px
Spacing: 4px base (xs4 sm8 md16 lg24 xl32 2xl48)
```

---

## Reglas de Negocio Clave

1. **Subasta inversa:** Empresa publica, camioneros pujan (bajan precio)
2. **Anti-sniping:** Extensión 2min si hay puja en últimos 5min
3. **Oferta mínima:** base_price - 10%
4. **Comisión plataforma:** 8% del valor del flete
5. **Penalización cancelación:** 
   - >48h antes: 10%
   - 24-48h: 20%
   - <24h: 30%
6. **Rating Elo:** por tipo de carga y ruta

---

## Ports

```
Frontend:  http://localhost:3000
Backend:   http://localhost:4000
PostgreSQL:5432
Redis:     6379
RabbitMQ:  5672
```

---

## How to Run

```bash
# Backend
cd src/backend && npm install && npx prisma migrate dev && npm run dev

# Frontend
cd src/frontend && npm install && npm run dev

# Docker (todo)
docker compose up -d
```
