# Spottruck — SPEC.md

**Proyecto:** Spottruck — Plataforma de subastas/logística para transporte de carga
**Versión:** V1.0.0
**Fecha:** 2026-06-04
**Estado:** DRAFT → IN_PROGRESS

---

## 1. Concepto y Visión

Spottruck es una plataforma SaaS que conecta empresas agroindustriales con transportistas de carga pesada en Argentina mediante un sistema de **subastas inversas**. La experiencia transmite profesionalismo, confianza y eficiencia logística — como un Mercado Libre pero para fletes pesados. El tono visual es industrial-moderno: verde y negro, tipografía bold, datos claros.

**Problema que resuelve:**
- Camiones van cargados a Buenos Aires pero vuelven vacíos (pierden 30-50% ingreso)
- Empresas en zonas de cosecha no encuentran trucks disponibles (pierden tiempo y mercadería)

---

## 2. Design Language

### Color Palette
```
Primary:    #1B5E20  (Verde Andreani/agro)
Secondary:  #212121  (Negro industrial)
Accent:     #FF6D00  (Naranja - CTAs, alertas, pujas)
Background: #FAFAFA  (Gris claro)
Surface:     #FFFFFF  (Blanco)
Text:       #1A1A1A  (Negro)
TextMuted:  #757575
Success:    #2E7D32
Warning:    #F57C00
Error:      #C62828
```

### Typography
```
Headings:  Inter (700) — bold, industrial
Body:      Inter (400, 500)
Mono:      JetBrains Mono (precios, IDs)
Scale:     12 / 14 / 16 / 20 / 24 / 32 / 48px
```

### Spacing
```
Base: 4px
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px
```

### Motion
- Transiciones UI: 150ms ease-out
- Page transitions: 200ms fade
- Loading states: skeleton + pulse
- Micro-interactions: scale(0.98) on click

---

## 3. Arquitectura General

### Stack
```
Frontend:  React 18 + Vite + TailwindCSS + React Router
Backend:   Node.js + Express + TypeScript
Database:  PostgreSQL 15 + Redis
Queue:     RabbitMQ
Maps:      OpenStreetMap + Leaflet
Auth:      JWT + Refresh Tokens
Payments:  MercadoPago
IaC:       Terraform
Container: Docker + Docker Compose
CI/CD:     GitHub Actions
```

### Estructura de Carpetas
```
spottruck/
├── src/
│   ├── frontend/        # React app
│   ├── backend/         # Express API
│   └── infrastructure/  # Terraform, Ansible
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
└── .agents/
```

---

## 4. Módulos y Features V1

### Auth & Users
- Registro con email/password (empresas vs transportistas)
- Login con JWT (access token 15min, refresh 7d)
- Perfil completo con validación RBAC

### Publicación de Viajes (Empresas)
- Formulario: origen, destino, tipo carga, fecha, precio base
- Tipos de carga: granel, pallets, cargas generales, refrig.
- Validaciones: координаты, capacidad truck requerida

### Sistema de Subastas
- Tipos: Ascendente abierta, Holandesa (precio baja), Puja sellada
- Anti-sniping: extensión automática 2min si hay puja en los últimos 5min
- Oferta mínima: precio_base - 10%
- Timeout: 12h-168h según tipo de usuario
- Estado: `OPEN` → `CLOSED` → `ASSIGNED` → `IN_PROGRESS` → `DELIVERED` → `SETTLED`

### Tracking GPS
- WebSocket para actualizaciones en tiempo real
- Polling fallback cada 30s
- Estados de viaje: `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `ARRIVED`, `DELIVERED`

### Pagos
- Hold de pago al asignar transportista
- Liberación post-entrega (empresa confirma)
- Penalizaciones por cancelación (matrix en Business Rules)
- Comisión plataforma: 8% del valor del flete

### Ratings
- Sistema Elo por tipo de carga y ruta
- Bidireccional: empresa → transportista, transportista → empresa
- Factores: puntualidad, estado de la carga, comunicación
- Trust score calculado nightly

### Admin Dashboard
- Moderación de usuarios
- Gestión de viajes y disputas
- Analytics básico: viajes/semana, revenue, rating promedio

---

## 5. API Design

### Base URL
```
Development: http://localhost:4000/api/v1
Production:  https://api.spottruck.com/api/v1
```

### Authentication
```
Headers: Authorization: Bearer <jwt_access_token>
```

### Endpoints Principales
```
Auth:
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

Users:
GET    /users/me
PUT    /users/me
GET    /users/:id/profile

Trips:
GET    /trips
POST   /trips
GET    /trips/:id
PUT    /trips/:id
DELETE /trips/:id

Auctions:
GET    /auctions
POST   /auctions
GET    /auctions/:id
POST   /auctions/:id/bid
GET    /auctions/:id/bids

Tracking:
GET    /tracking/:tripId/current
GET    /tracking/:tripId/history

Payments:
POST   /payments/hold
POST   /payments/release
GET    /payments/:tripId

Ratings:
POST   /ratings
GET    /ratings/user/:userId
```

---

## 6. Data Model

### Tablas Principales
```
users          → id, email, password_hash, role, company_data, created_at
trips          → id, user_id, origin, destination, cargo_type, scheduled_date, base_price, status
auctions       → id, trip_id, type, start_time, end_time, status, current_price
bids           → id, auction_id, user_id, amount, created_at
payments       → id, trip_id, amount, status, mercadopago_id
ratings        → id, from_user_id, to_user_id, trip_id, score, comment
tracking_logs  → id, trip_id, lat, lng, speed, recorded_at
```

---

## 7. Definition of Done

- Código mergeado en `main`
- Tests unitarios passing (>80% coverage)
- Tests de integración passing
- PR revisado por 1+ reviewer
- Deploy exitoso en staging
- No hay errores críticos de seguridad
- Documentación actualizada

---

## 8. Sprints Plan

| Sprint | Semanas | Meta |
|--------|---------|------|
| S1 | 1-2 | Auth + Registro + Schema DB + Trip CRUD |
| S2 | 3-4 | Subastas + Ofertas + Búsqueda |
| S3 | 5-6 | Tracking GPS + WebSocket + Pagos |
| S4 | 7-8 | Ratings + Admin + Polish + Deploy |

---

## 9. Conventions

- **Commits:** conventional commits (feat:, fix:, docs:, refactor:, test:)
- **Branches:** feature/<nombre>, fix/<nombre>, chore/<nombre>
- **Naming:** camelCase (JS), snake_case (DB), kebab-case (files)
- **Linting:** ESLint + Prettier
- **Testing:** Jest + Supertest (backend), Vitest + Playwright (frontend)
