# Spottruck

> Sistema de subastas inversas para logística de transporte de carga en Argentina.

## Idea

**Problema real:** Camioneros van cargados a Buenos Aires pero no encuentran viaje de vuelta — pierden dinero. Empresas agroquímicas en cosecha no encuentran logística — pierden mercadería.

**Solución:** Subastas inversas donde la empresa publica un viaje y transportistas pujan para ofrecer el mejor precio.

## Cómo funciona

```
Empresa publica viaje ──▶ Transportistas pujan ──▶ Empresa elige ──▶ Viaje ──▶ Calificaciones mutuas
                         (precio baja)
```

1. **Empresa** crea un viaje (origen, destino, tipo de carga, fecha, precio base)
2. **Sistema** inicia una auction abierta
3. **Transportistas** ven los viajes disponibles y pujan — precio baja
4. **Empresa** elige la mejor oferta
5. Se ejecuta el viaje con **tracking GPS en tiempo real**
6. Al finalizar: **pago automático** y **calificaciones mutuas**

## Stack

| Capa | Tech |
|------|------|
| Backend | Node.js + Express + TypeScript |
| DB | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Frontend | React + Vite + TypeScript |
| Auth | JWT (access + refresh) |
| Maps | OpenStreetMap / Leaflet |
| Notifications | Nodemailer (SMTP) |

## Estructura del proyecto

```
spottruck/
├── src/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Modelo de datos
│   │   │   └── seed.ts          # Datos de demostración
│   │   └── src/
│   │       ├── routes/          # Endpoints REST
│   │       ├── services/        # Lógica de negocio
│   │       └── jobs/            # Tareas programadas
│   └── frontend/
│       ├── src/
│       │   ├── pages/           # Rutas de página
│       │   ├── components/      # Componentes React
│       │   └── hooks/          # Custom hooks
│       └── ...
├── docs/                        # Documentación
├── docker-compose.yml           # Postgres + Redis
└── README.md
```

## Setup local

### 1. Requisitos

- Node.js 20+
- Docker + Docker Compose
- PostgreSQL (vía Docker)
- Redis (vía Docker)

### 2. Variables de entorno

```bash
cp src/backend/.env.example src/backend/.env
# Editar .env con los valores correspondientes
```

### 3. Levantar servicios

```bash
docker compose up -d postgres redis
```

### 4. Instalar y migrar

```bash
cd src/backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed    # Datos de demo
npm run dev            # Servidor en :4000
```

### 5. Frontend

```bash
cd src/frontend
npm install
npm run dev            # En :3000
```

## Demo

El seed incluye usuarios de prueba:

| Email | Password | Rol |
|-------|----------|-----|
| empresa@demo.com | Demo1234! | COMPANY |
| camionero1@demo.com | Demo1234! | DRIVER |

## Docs

- [API Reference](API.md)
- [Despliegue](DEPLOY.md)

## Autores

Proyecto E.E.S.T.Nro 3 "Roberto Arlt" — Schulexam
- Ana Lucía Basaldúa
- Martina Villanueva
- Guillermo Riedel (@RGuillee)
