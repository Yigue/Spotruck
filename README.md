# Spottruck

Plataforma de **subastas de fletes** para el transporte de carga en Argentina. Conecta empresas que publican viajes con transportistas que se postulan o toman el viaje; todo el ciclo (publicación → subasta → asignación → viaje con seguimiento GPS → pago en custodia → valoración) vive en la misma app.

Es la modernización de la versión original en PHP (2022), que se conserva en [`legacy/`](legacy/) como referencia.

## Qué hace

| Rol | Puede |
|---|---|
| **Empresa** | Publicar viajes (subasta abierta, holandesa o sellada), comparar postulantes, aceptar/rechazar, confirmar la entrega, pagar con MercadoPago, valorar |
| **Transportista** | Explorar viajes en mapa, gestionar su flota, postularse o "tomar" un viaje, retirar ofertas, compartir su ubicación en vivo, verificar su cuenta |
| **Admin** | Revisar la documentación de los transportistas |

Incluye notificaciones en tiempo real, estadísticas por rol, PWA instalable, verificación de email y reset de contraseña.

### Tipos de subasta
- **Abierta (OPEN)**: ofertas a la baja; cada una debe mejorar al menos un 10 % la anterior; anti-sniping (se extiende el cierre si hay ofertas sobre el final).
- **Holandesa (DUTCH)**: el precio baja solo con el tiempo hasta un piso; gana el primero que pulsa **¡Tomar!**.
- **Sellada (SEALED)**: ofertas privadas; los montos ajenos no se exponen (el servidor los redacta).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Vite, TypeScript, TailwindCSS, React Router, Zustand, Leaflet |
| Backend | Node.js 20+, Express, TypeScript, Prisma, Zod, `ws` (WebSocket), Multer |
| Base de datos | PostgreSQL 15 (importes en `Decimal(12,2)`) |
| Mapas / geo | OpenStreetMap + Leaflet, API Georef (provincias/localidades), OSRM (rutas) |
| Integraciones | MercadoPago (Checkout Pro) y Resend (emails) — **ambas opcionales**: sin credenciales corre en modo simulado |

> Redis está configurado en `docker-compose.yml` pero hoy ningún módulo lo usa.

## Puesta en marcha

### Opción A — Docker (recomendada)

```bash
docker compose up -d          # Postgres :5433, Redis :6380, API :4000, Web :3001
```

Aplicá las migraciones y cargá datos de ejemplo:

```bash
cd src/backend
cp .env.example .env          # completá lo necesario (ver abajo)
npm install
npx prisma migrate deploy     # aplica las migraciones existentes (NO uses `migrate dev --name init`)
npm run prisma:seed
```

### Opción B — sin Docker

Necesitás un PostgreSQL propio y su `DATABASE_URL` en `src/backend/.env`.

```bash
# Backend  → http://localhost:4000
cd src/backend && npm install && npx prisma migrate deploy && npm run prisma:seed && npm run dev

# Frontend → http://localhost:3000  (en otra terminal)
cd src/frontend && npm install && npm run dev
```

### Usuarios de ejemplo (contraseña `Demo1234!`)

| Email | Rol |
|---|---|
| `empresa@demo.com`, `logistica@demo.com` | Empresa |
| `camionero1@demo.com` (verificado), `camionero2@demo.com`, `camionero3@demo.com` | Transportista |
| `admin@spottruck.com` | Admin |

## Variables de entorno

Todo está documentado en [`src/backend/.env.example`](src/backend/.env.example). El archivo `.env` **no se versiona**. Sin `MERCADOPAGO_ACCESS_TOKEN` los pagos se simulan; sin `RESEND_API_KEY` los emails (verificación, reset) se imprimen en la consola del servidor.

## Comandos útiles

```bash
# Backend (src/backend)
npm run dev              # servidor con recarga
npm run build            # compila a dist/
npm test                 # Jest: unitarios + integración (necesita la base migrada)
npm run lint
npm run test:e2e:fast    # suites end-to-end contra el servidor levantado
npm run test:e2e         # idem + recorrido completo con el cron real (~3 min)

# Frontend (src/frontend)
npm run dev | build | test | lint
```

Las suites e2e (`src/backend/scripts/`) recorren los flujos reales por HTTP: caminos felices, casos límite y permisos, concurrencia y tipos de subasta. Requieren el backend corriendo y la base con el seed.

## Estructura

```
src/
├── backend/        API Express + Prisma (routes/, services/, middleware/, prisma/)
│   ├── prisma/       schema, migraciones y seed
│   └── scripts/      suites e2e
├── frontend/       SPA React (pages/, components/, hooks/, utils/)
└── infrastructure/ Terraform y Ansible
docs/documentacion/ Documentación técnica (modelo de BD, endpoints, páginas)
openspec/           Specs y cambios en formato SDD
legacy/             Versión original en PHP (referencia)
```

## Documentación

Empezá por [`docs/documentacion/README.md`](docs/documentacion/README.md): modelo de datos, catálogo de endpoints y comparativa de páginas con el sistema legacy.

## Integración continua

`.github/workflows/ci.yml` corre lint, build y tests del backend y frontend en cada push/PR a `master`; también verifica que las migraciones coincidan con `schema.prisma`.
