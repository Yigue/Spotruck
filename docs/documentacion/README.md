# Documentación Técnica del Sistema Spottruck

Bienvenido a la documentación oficial del sistema **Spottruck** (Plataforma SaaS de subastas inversas y logística para transporte de carga pesada).

---

## 📁 Estructura de la Documentación

Esta carpeta contiene la documentación detallada del modelo de datos, reglas de negocio, diagramas gráficos, especificación de la API REST y análisis funcional de páginas:

1. 📄 **[Entidades y Reglas de Negocio](Entidad%20y%20sus%20reglas%20de%20negocio.md)**
   - Detalle exhaustivo de las 9 entidades del sistema.
   - Lógica de negocio responsable, ciclo de vida de estados e invariantes/reglas estrictas.

2. 📄 **[Páginas y Funcionalidades (Legacy vs. Actual)](Pages-y-Funcionalidades.md)**
   - Auditoría funcional de todas las pantallas del sistema legacy (PHP/HTML/JS).
   - Análisis de diseño, prerrequisitos, acciones y reglas de negocio por vista.
   - Matriz comparativa entre la versión legacy y la plataforma actual (React 18 + Node.js + WebSockets).

3. 📄 **[Modelo de Base de Datos y Entidades](01-modelo-bd-y-entidades.md)**
   - Diagrama Entidad-Relación en formato **Mermaid**.
   - Definición de todos los `Enums`.
   - Tablas, campos, tipos Prisma, nulabilidad y restricciones.

4. 🔌 **[Catálogo Completo de Endpoints API](02-catalogo-endpoints-api.md)**
   - Especificación técnica de todos los endpoints REST (`/api/v1`).
   - Métodos HTTP, rutas, permisos RBAC, parámetros y respuestas.

5. 🎨 **[Diagrama de Base de Datos (Exportable y Visual)](03-diagrama-base-de-datos.md)**
   - Esquemas exportables en formato **DBML** ([dbdiagram.io](https://dbdiagram.io)), Mermaid y PlantUML.

6. 🌐 **[Visualizador Interactivo HTML](visualizador_bd.html)**
   - Herramienta web interactiva standalone para explorar la base de datos desde el navegador.

---

## 🚀 Estado Actual del Proyecto

Actualmente, **Spottruck** se encuentra en fase **V1.0.0 (Desarrollo Activo e Integrado)** con una arquitectura completa backend/frontend totalmente funcional y desacoplada:

### ⚙️ 1. Backend (Node.js + Express + TypeScript)
- **Autenticación y Seguridad:** JWT (Access Token 15m + Refresh Token 7d), hash bcrypt, middlewares RBAC (`COMPANY`, `DRIVER`, `ADMIN`), rate limiting y Helmet.
- **Módulos y Rutas Implementadas (`/api/v1`):**
  - `/auth`: Registro, Login, Refresh, Verificación de Email y Recupero de Contraseña.
  - `/users`: Perfil, actualización y revisión de documentación de chóferes (`documentsStatus`).
  - `/trucks`: CRUD completo de vehículos para transportistas (`DRIVER`).
  - `/trips`: Creación, edición, listado con filtros (origen, destino, tipo de carga) y ciclo de estados de viajes.
  - `/auctions`: Gestión de subastas inversas (Abierta, Holandesa, Sobre Cerrado) con mecanismo **Anti-sniping**.
  - `/bids`: Envío, validaciones de decremento, aceptación y retiro de pujas.
  - `/payments`: Flujo de **Escrow** (retención en garantía) e integración con API de MercadoPago.
  - `/tracking`: Telemetría GPS en tiempo real e histórico de ruta vía WebSockets (`ws://`) y polling HTTP.
  - `/ratings`: Evaluación bidireccional post-entrega y recálculo de promedios.
  - `/notifications`: Alertas in-app y push por WebSocket.
  - `/stats`: Dashboard de métricas y analytics operacional/financiero.

### 🗄️ 2. Base de Datos y Persistencia (PostgreSQL + Prisma ORM)
- **Esquema Relacional:** 9 Modelos (`User`, `Truck`, `Trip`, `Auction`, `Bid`, `Payment`, `Rating`, `TrackingLog`, `Notification`) y 9 Enumeraciones.
- **Migraciones y Seeding:** Script `prisma/seed.ts` configurado para poblar datos de prueba (usuarios, camiones, viajes y subastas).

### 💻 3. Frontend (React 18 + Vite + TailwindCSS + TypeScript)
- **Interfaz de Usuario (SPA):** Diseño industrial-moderno con paleta corporativa (verde andreani, negro industrial, acentos naranja).
- **Vistas Desarrolladas:**
  - `DashboardPage`: Panel de control según rol del usuario.
  - `ExplorePage`: Buscador interactivo de viajes y subastas disponibles.
  - `TripsPage` & `TripDetailPage`: Gestión detallada del ciclo de vida del flete y seguimiento GPS.
  - `AuctionPage`: Sala de subasta en tiempo real para ofertar y monitorear el anti-sniping.
  - `NewTripPage`: Formulario paso a paso para publicación de fletes por empresas.
  - `ProfilePage`: Gestión de datos, perfil de transportista/empresa y carga de documentación.
  - `StatsPage`: Reportes y métricas operacionales.
  - `Auth`: Flujos completos de Login, Registro, Recupero/Reset de Contraseña y Verificación de Email.

### 🧪 4. Testing y Calidad
- **Backend:** Tests unitarios y de integración con Jest y Supertest. Scripts de simulación de flujo completo (`test-flow.py` y `test-api.py`).
- **Frontend:** Tests de componentes e integración con Vitest, React Testing Library y Playwright.

### 🐳 5. Infraestructura y Docker
- Entorno de ejecución contenedorizado listo vía `docker-compose.yml` integrando servicios de PostgreSQL 15, Redis, Backend API y Frontend Vite.

---

## 🏗 Arquitectura General de Datos

- **Motor de Base de Datos:** PostgreSQL 15+
- **ORM:** Prisma 5+
- **Autenticación:** JWT (Bearer Tokens) + RBAC (`COMPANY`, `DRIVER`, `ADMIN`)
- **Moneda / Montos:** Preservados mediante `Decimal(12, 2)` para precisión financiera exacta.
