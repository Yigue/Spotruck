# Spottruck
Plataforma SaaS de subastas inversas para transporte de carga en Argentina.

## Stack
- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Node.js + Express + TypeScript + Prisma
- **DB:** PostgreSQL 15 + Redis
- **Queue:** RabbitMQ
- **Maps:** OpenStreetMap + Leaflet
- **Payments:** MercadoPago

## Quick Start

```bash
# 1. Clonar y entrar
cd spottruck

# 2. Levantar todo con Docker
docker compose up -d

# 3. Backend: instalar deps y correr migraciones
cd src/backend
npm install
npx prisma migrate dev --name init
npm run dev   # http://localhost:4000

# 4. Frontend
cd src/frontend
npm install
npm run dev   # http://localhost:3000
```

## Estructura
```
src/
├── backend/      # Express API
├── frontend/     # React SPA
└── infrastructure/ # Terraform, Ansible
```

## API
Base: `http://localhost:4000/api/v1`

Ver `docs/api/` para documentación completa de endpoints.
