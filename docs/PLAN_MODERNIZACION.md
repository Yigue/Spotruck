# Spotruck — Análisis de Gaps y Plan de Modernización

**Fecha:** 2026-06-10
**Insumos analizados:**
- Documentación completa del repo (`docs/`, `SPEC.md`, vault con requerimientos, arquitectura, UX, reglas de negocio)
- Base de datos original de la tesis (`BD_TESIS.vsdx`)
- Capturas de pantalla de la aplicación original (flujo Transportista y flujo Empresa)
- Auditoría del código actual (`src/backend`, `src/frontend`)

---

## 1. Resumen Ejecutivo

El proyecto nuevo ya tiene una base sólida (~60% del V1): auth con roles, CRUD de viajes,
subastas inversas con anti-sniping, pagos con hold/fee, ratings y tracking GPS en backend.

**Pero la app vieja tenía flujos completos de producto que hoy NO existen en la versión nueva**,
sobre todo del lado del transportista y de la gestión de ofertas de la empresa:

1. **Flota de camiones por transportista** (elegir camión al ofertar) — el modelo nuevo asume 1 solo vehículo embebido en `User`.
2. **Oferta con aclaración y estado** (aceptada/rechazada por la empresa) — `Bid` hoy solo tiene monto.
3. **Vista de empresa para comparar postulantes y Aceptar/Rechazar** (cerraba la subasta).
4. **Máquina de estados del viaje visible** (stepper: Preparando → En viaje → Esperando confirmación → Finalizada) con confirmaciones de ambos lados.
5. **Selectores de Provincia/Localidad** al publicar (hoy hay que tipear coordenadas a mano — peor UX que la app de 2022).
6. **Perfil público con WhatsApp**, viajes realizados, rating y datos del camión.
7. **Mapa con publicaciones cercanas** para el transportista.

El plan propuesto recupera **toda** la funcionalidad de la app original, modernizada con el
stack actual (React + Vite + Tailwind, Express + Prisma + PostgreSQL, Leaflet, WebSocket).

---

## 2. Estado Actual del Código (auditoría)

### Backend — implementado y real
| Módulo | Estado | Notas |
|---|---|---|
| Auth (register/login/refresh/JWT) | ✅ Real | bcrypt + roles COMPANY/DRIVER |
| Trips CRUD | ✅ Real | máquina de estados DRAFT→…→SETTLED |
| Subastas + pujas | ✅ Real | inversa, anti-sniping, tipos OPEN/DUTCH/SEALED |
| Pagos hold/release/penalidades | ✅ Real | fee 8%, hold 72h |
| Ratings | ✅ Real | score + subdimensiones, trust score |
| Tracking GPS | ✅ Real | posición, historial, ETA por haversine |
| Cron cierre de subastas | ✅ Real | cada 60s |

### Backend — stub o incompleto
| Módulo | Estado | Notas |
|---|---|---|
| MercadoPago | ⚠️ Stub | config existe, no hay llamadas reales al SDK |
| Notificaciones | ⚠️ Stub | `console.log`, sin email/push reales |
| WebSocket | ⚠️ Parcial | auth funciona; suscripción/broadcast no filtra por subasta |

### Frontend — páginas existentes
Login, Register (distingue Empresa/Transportista), Dashboard, Trips (lista+filtros),
TripDetail (mapa estático, subasta, BidForm, RatingForm), NewTrip (coordenadas manuales),
Auctions (lista, sin countdown ni live).

### Frontend — faltante
Perfil (propio y público), gestión de flota, map picker, selector provincia/localidad,
tabla de postulantes con Aceptar/Rechazar, stepper de estados del viaje, vista de tracking
en vivo, subasta en vivo con countdown, centro de notificaciones, link WhatsApp, UI de pagos.

---

## 3. BD Vieja (Visio) vs Esquema Prisma Nuevo

### Mapeo de entidades

| BD Tesis (vieja) | Prisma (nuevo) | Estado |
|---|---|---|
| `Usuario` + `TiposUsuarios` | `User` + enum `UserRole` | ✅ Cubierto. Falta: `UsuarioValidado` (verificación email), estado de cuenta |
| `Empresa` (CUIT, RazónSocial, TipoSector, Ubicación, PáginaWeb, Teléfono) | campos company en `User` | ⚠️ Parcial. Faltan: sector, ubicación/dirección, página web |
| `Trasportista` (Licencia, Cédula, Zona preferida) | campos driver en `User` | ⚠️ Parcial. Faltan: zona preferida, cédula/documentos |
| `Camion` + `TipoCamion` (patente, capacidad, carga preferida) | `vehiclePlate/Type/Capacity` en `User` | ❌ **Gap mayor**: la vieja soportaba flota (N camiones); la nueva, 1 solo |
| `Camion-TransporteAlimento` (Nro. Senasa) | — | ❌ No existe |
| `Seguro` + `TipoSeguro` + `EmpresaAseguradora` | — | ❌ No existe (era opcional en la vieja) |
| `Publicaciones` (fechas inicio/máxima, peso, tipo carga, detalle, localidad) | `Trip` | ⚠️ Parcial. Faltan: fecha fin, volumen, provincia/localidad normalizadas, distancia/duración |
| `Subasta` | `Auction` | ✅ Cubierto y mejorado (tipos, anti-sniping) |
| `Oferta` (precio, aclaración, estado de oferta, camión) | `Bid` | ⚠️ **Gap clave**: faltan `aclaración`, `estado` (PENDIENTE/ACEPTADA/RECHAZADA) y `camión` asociado |
| `EstadosOferta` | — | ❌ No existe |
| `Pais` / `Provincia` / `Localidad` | texto libre + lat/lng | ❌ No existe catálogo geográfico |
| `Estado` + `Viaje(EnCurso)` | `TripStatus` + `TrackingLog` | ✅ Cubierto y mejorado (GPS real) |

### Cambios de esquema propuestos (migraciones Prisma)

```prisma
model Truck {
  id          String  @id @default(uuid())
  ownerId     String                    // User (DRIVER)
  plate       String  @unique
  type        TruckType                 // JAULA, SEMI, TOLVA, FURGON, REFRIGERADO...
  capacityKg  Float
  preferredCargo CargoType?
  senasaNumber String?                  // transporte de alimentos
  insurance    Json?                    // aseguradora, tipo, monto, vencimiento (opcional)
  active       Boolean @default(true)
}

enum BidStatus { PENDING ACCEPTED REJECTED WITHDRAWN }

model Bid {
  // ... campos actuales +
  note     String?      // "Aclaración" de la app vieja
  status   BidStatus @default(PENDING)
  truckId  String?      // camión con el que se postula
}

model Trip {
  // ... campos actuales +
  endDate        DateTime?   // "fecha máxima" de la publicación vieja
  volumeDesc     String?     // "Volumen: Maíz a granel"
  distanceKm     Float?      // calculada al crear (OSRM)
  durationMin    Int?
  originProvince String?     // normalizado vía API Georef
  originCity     String?
  destProvince   String?
  destCity       String?
}

model User {
  // ... campos actuales +
  emailVerified  Boolean @default(false)
  address        String?     // "Ubicación" de Empresa
  website        String?
  sector         String?
  preferredZone  String?     // zona preferida del transportista
  trucks         Truck[]
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // NEW_BID, BID_ACCEPTED, TRIP_STATE, AUCTION_CLOSED...
  payload   Json
  readAt    DateTime?
  createdAt DateTime @default(now())
}
```

> Nota: para Provincia/Localidad no hace falta replicar las tablas `Pais/Provincia/Localidad`
> de la BD vieja — se usa la **API Georef de Argentina** (datos.gob.ar) para los selectores
> y se persisten los nombres normalizados + coordenadas en el `Trip`.

---

## 4. Pantallas App Vieja → App Nueva (paridad + mejora)

### Flujo Transportista

| # | Pantalla vieja | Estado hoy | Acción |
|---|---|---|---|
| T1 | Login | ✅ Existe | Mantener |
| T2 | Registro 2 pasos (tipo usuario, reglas de contraseña, términos) | ⚠️ Parcial | Agregar: checkbox de términos/privacidad, indicador de reglas de contraseña, paso 2 con datos según rol y "completar luego" |
| T3 | **Mapa con publicaciones cercanas** (markers "P") | ❌ Falta | Nueva página `ExplorePage`: mapa Leaflet con markers de publicaciones abiertas + filtro por zona/tipo de carga |
| T4 | Detalle de publicación (origen, destino, distancia, duración, peso, tipo carga, fechas) + ruta A→B en mapa | ⚠️ Parcial | Completar `TripDetailPage`: distancia y duración calculadas (OSRM), polyline de ruta en el mapa |
| T5 | Popup perfil de la empresa (rating, CUIT, razón social, **botón WhatsApp**) | ❌ Falta | Componente `UserProfileModal` con rating, datos y link `wa.me/<phone>` |
| T6 | Modal "Postularse" (**elegir camión de la flota**, precio, **aclaración**) | ⚠️ Parcial | Extender `BidForm`: select de camión propio + campo aclaración (requiere `Truck` y `Bid.note`) |
| T7 | **Stepper de estados del viaje** (Preparando → En viaje → Esperando confirmación → Finalizada) con diálogos "¿Estás seguro?" / "¿Has terminado el viaje?" | ❌ Falta | Componente `TripStatusStepper` + botones de acción por rol + diálogos de confirmación; endpoints de transición con doble confirmación (transportista termina → empresa confirma) |
| T8 | Modal Valorar (estrellas + comentario) | ✅ Existe (`RatingForm`) | Convertir a modal disparado al finalizar el viaje, con recordatorio "no se olvide de valorar" |

### Flujo Empresa

| # | Pantalla vieja | Estado hoy | Acción |
|---|---|---|---|
| E1 | Registro empresa (razón social, ubicación, "¿completar luego?") | ⚠️ Parcial | Paso 2 del registro + edición desde perfil |
| E2 | Crear publicación (**selectores Provincia/Localidad** origen y destino, fecha inicio/fin, tipo de carga, peso, volumen) | ⚠️ Regresión | Rediseñar `NewTripPage`: dropdowns Georef + map picker Leaflet (reemplaza lat/lng manual), fecha fin y volumen, distancia/duración automáticas |
| E3 | Card de publicación con estado ("En Subasta"), distancia, duración, fecha creación | ⚠️ Parcial | Enriquecer `TripCard`/detalle con los campos nuevos |
| E4 | **Tabla comparativa de postulantes** (precio, fecha, ver detalle) | ❌ Falta | Sección "Postulantes" en `TripDetailPage` (vista empresa): tabla comparativa de ofertas |
| E5 | Modal perfil del transportista (viajes realizados, camión, capacidad, precio propuesto, aclaración, WhatsApp) + **ACEPTAR / RECHAZAR** | ❌ Falta | `BidDetailModal` con datos del camión de la oferta + acciones aceptar/rechazar (`PATCH /bids/:id`) |
| E6 | Confirmación "Se cerrará la subasta" al aceptar | ❌ Falta | Aceptar oferta ⇒ cierra subasta, asigna viaje, rechaza el resto, notifica |
| E7 | Stepper estados (Preparando → Camionero viajando → Esperando confirmación → Finalizada) + "¿El transportista ha terminado el viaje?" | ❌ Falta | Mismo `TripStatusStepper` con acciones del rol empresa |
| E8 | Valorar transportista | ✅ Existe | Integrar al cierre del flujo igual que T8 |

### Pantallas nuevas (no existían pero son necesarias)
- **ProfilePage** (propio): datos, contraseña, y para transportistas la gestión de **Mis Camiones** (CRUD de flota).
- **NotificationCenter**: campanita + lista (nueva oferta, oferta aceptada/rechazada, cambio de estado del viaje).
- **Tracking en vivo**: mapa con posición del camión durante `IN_PROGRESS` (el backend ya está listo).
- **Subasta en vivo**: countdown + actualización de precio por WebSocket.

---

## 5. Plan por Fases

### Fase 0 — Modelo de datos (1 semana)
- Migraciones Prisma: `Truck`, `Bid.note/status/truckId`, campos nuevos de `Trip` y `User`, `Notification`.
- Endpoints: CRUD `/trucks`, `PATCH /bids/:id` (accept/reject con cierre de subasta y asignación), transiciones de estado del viaje con doble confirmación.
- Seed actualizado.

### Fase 1 — Paridad con la app vieja (2-3 semanas) ← **prioridad**
- Registro en 2 pasos con términos y reglas de contraseña (T2/E1).
- `NewTripPage` con Georef + map picker + distancia/duración OSRM (E2).
- `ExplorePage` con mapa de publicaciones para transportistas (T3).
- `BidForm` con camión + aclaración (T6) y gestión de flota en `ProfilePage`.
- Tabla de postulantes + `BidDetailModal` aceptar/rechazar + confirmación (E4-E6).
- `TripStatusStepper` con acciones y diálogos por rol (T7/E7).
- `UserProfileModal` con WhatsApp (T5).
- Valoración como modal integrado al fin del viaje (T8/E8).

### Fase 2 — Tiempo real y notificaciones (2 semanas)
- WebSocket: suscripciones reales por subasta/viaje, broadcast filtrado.
- Subasta en vivo con countdown; tracking en vivo en mapa.
- Notificaciones in-app (modelo + campanita) y email real (Resend/SendGrid).

### Fase 3 — Pagos y confianza (2 semanas)
- Integración MercadoPago real (hold al asignar, release al confirmar entrega).
- Verificación de email; documentos del transportista (licencia, cédula, seguro, Senasa) con revisión admin.
- UI de pagos/escrow.

### Fase 4 — V2 (backlog)
- PWA mobile-first (la app vieja era mobile — priorizar responsive + installable antes que apps nativas).
- Analytics/estadísticas ("Estadísticas y Gráficos" era un beneficio prometido en el informe original).
- i18n, pricing dinámico ML, integraciones B2B.

---

## 6. Riesgos y decisiones abiertas

1. **Subasta vs. postulación simple**: la app vieja era "postularse y la empresa elige" (sin puja competitiva visible). La nueva implementa subasta inversa con anti-sniping. **Propuesta**: mantener la subasta como motor, pero la UX de la empresa es la de la app vieja (tabla de postulantes + aceptar/rechazar), que equivale a una subasta sellada con cierre manual.
2. **Geo**: API Georef (gratis, oficial AR) + OSRM público para rutas; si el volumen crece, self-host OSRM.
3. **Seguros/Senasa**: en la BD vieja eran opcionales; se modelan como JSON/campos opcionales en `Truck` para no sobre-normalizar.
4. **Mobile**: las capturas viejas son de una app móvil; la nueva es web. La Fase 1 debe ser **mobile-first responsive** para no perder ese caso de uso.
