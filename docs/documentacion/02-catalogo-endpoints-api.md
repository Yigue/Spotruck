# Catálogo Completo de Endpoints API — Spottruck

Especificación técnica detallada de todos los endpoints de la API REST del sistema Spottruck (`/api/v1`).

---

## 🔐 Convenciones Generales y Autenticación

- **Base URL:** `http://localhost:4000/api/v1` (en desarrollo) / `https://api.spottruck.com/api/v1` (en producción)
- **Cabecera de Autenticación:** 
  ```http
  Authorization: Bearer <jwt_access_token>
  ```
- **Control de Acceso (RBAC):** Basado en los roles `COMPANY` (Empresa), `DRIVER` (Transportista) y `ADMIN` (Administrador).
- **Formato de Respuesta Estándar:** JSON. Éxito: `{ "data": ... , "meta"?: { total, page, limit } }`. Error: `{ "error": { "code", "message" } }`.
- **Montos:** se almacenan como `Decimal(12,2)` y se serializan como número JSON (`450000.5`).
- **Visibilidad:** las reglas de quién ve qué viaje/subasta/GPS están centralizadas en `src/backend/src/utils/tripAccess.ts`. Un recurso no visible responde 404.
- **Tiempo real:** WebSocket en `/ws` (canales `auction:<id>`, `trip:<id>`, `user:<id>`; se autentica con el primer mensaje).

---

## 📑 Índice de Módulos API

1. [Autenticación y Seguridad (`/auth`)](#1-autenticación-y-seguridad-auth)
2. [Gestión de Usuarios y Perfiles (`/users`)](#2-gestión-de-usuarios-y-perfiles-users)
3. [Gestión de Camiones y Flota (`/trucks`)](#3-gestión-de-camiones-y-flota-trucks)
4. [Publicación y Gestión de Viajes (`/trips`)](#4-publicación-y-gestión-de-viajes-trips)
5. [Sistema de Subastas Inversas (`/auctions`)](#5-sistema-de-subastas-inversas-auctions)
6. [Ofertas y Pujas (`/bids`)](#6-ofertas-y-pujas-bids)
7. [Pagos y MercadoPago (`/payments`)](#7-pagos-y-mercadopago-payments)
8. [Seguimiento GPS en Tiempo Real (`/tracking`)](#8-seguimiento-gps-en-tiempo-real-tracking)
9. [Calificaciones y Reseñas (`/ratings`)](#9-calificaciones-y-reseñas-ratings)
10. [Notificaciones (`/notifications`)](#10-notificaciones-notifications)
11. [Estadísticas y Métricas (`/stats`)](#11-estadísticas-y-métricas-stats)
12. [Archivos Privados (`/files`)](#12-archivos-privados-files)

---

## 1. Autenticación y Seguridad (`/auth`)

### `POST /auth/register`
- **Descripción:** Registra un nuevo usuario en la plataforma como Empresa (`COMPANY`) o Transportista (`DRIVER`).
- **Autenticación:** Pública (No requerida).
- **Body:**
  ```json
  {
    "email": "usuario@empresa.com",
    "password": "Password123!",
    "role": "COMPANY",
    "companyName": "Agro Fletes S.A.",
    "companyCuit": "30-71123456-8",
    "phone": "+5491144332211"
  }
  ```
- **Respuesta (201 Created):** Retorna el objeto `user` recién creado (sin hash de contraseña) y los tokens `accessToken` y `refreshToken`.

---

### `POST /auth/login`
- **Descripción:** Autentica a un usuario registrado mediante sus credenciales y genera un par de tokens JWT.
- **Autenticación:** Pública.
- **Body:**
  ```json
  {
    "email": "usuario@empresa.com",
    "password": "Password123!"
  }
  ```
- **Respuesta (200 OK):** Devuelve `user`, `accessToken` (expira en 15 min) y `refreshToken` (expira en 7 días).

---

### `POST /auth/refresh`
- **Descripción:** Renueva el `accessToken` utilizando un `refreshToken` válido.
- **Autenticación:** Pública (Valida el `refreshToken` enviado en el body).
- **Body:** `{ "refreshToken": "string" }`
- **Respuesta (200 OK):** `{ "accessToken": "string" }`

---

### `POST /auth/logout`
- **Descripción:** Invalida la sesión actual del usuario.
- **Autenticación:** Requerida (`Bearer Token`).
- **Respuesta (200 OK):** `{ "message": "Sesión cerrada correctamente" }`

---

### `POST /auth/forgot-password`
- **Descripción:** Inicia el proceso de recuperación de contraseña. Genera un token de un solo uso de 1 hora de vigencia y envía un correo electrónico. Por seguridad anti-enumeración, siempre retorna 200 OK.
- **Autenticación:** Pública.
- **Body:** `{ "email": "usuario@empresa.com" }`
- **Respuesta (200 OK):** `{ "message": "Si el email está registrado, se enviaron instrucciones" }`

---

### `POST /auth/reset-password`
- **Descripción:** Restablece la contraseña utilizando el token enviado por correo electrónico.
- **Autenticación:** Pública.
- **Body:** `{ "token": "uuid", "password": "NuevaPassword123!" }`
- **Respuesta (200 OK):** `{ "message": "Contraseña restablecida con éxito" }`

---

### `POST /auth/verify-email`
- **Descripción:** Valida la dirección de correo electrónico del usuario mediante el token recibido al registrarse.
- **Autenticación:** Pública.
- **Body:** `{ "token": "uuid" }`
- **Respuesta (200 OK):** `{ "message": "Email verificado correctamente" }`

---

### `POST /auth/resend-verification`
- **Descripción:** Reenvía el correo de verificación al usuario autenticado.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** `{ "message": "Correo de verificación reenviado" }`

---

### `GET /auth/me`
- **Descripción:** Devuelve la información del perfil del usuario actualmente autenticado.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** Objeto de usuario con sus datos y rol.

---

## 2. Gestión de Usuarios y Perfiles (`/users`)

### `GET /users/me`
- **Descripción:** Obtiene los detalles completos del perfil del usuario logueado.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** Objeto `User` con datos de empresa o transportista.

---

### `PUT /users/me`
- **Descripción:** Actualiza los datos editables del perfil del usuario (teléfono, razón social, CUIT, zona de preferencia, etc.).
- **Autenticación:** Requerida.
- **Body:** Campos opcionales a modificar.
- **Respuesta (200 OK):** Objeto `User` actualizado.

---

### `GET /users/:id/profile`
- **Descripción:** Obtiene el perfil público de cualquier usuario en la plataforma (empresa o transportista) incluyendo reputación y promedio de estrellas.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** Objeto de perfil público (excluye campos sensibles como hash de contraseña y tokens).

---

### `POST /users/me/avatar`
- **Descripción:** Sube la foto de perfil (JPG/PNG/WebP, ≤ 2 MB). Un archivo por usuario. Es el **único** archivo servido públicamente (`/uploads/avatars/<userId>.<ext>`).
- **Autenticación:** Requerida.
- **Body:** `multipart/form-data` con el campo `avatar`.
- **Respuesta (200 OK):** `{ id, avatarUrl }`.

---

### `POST /users/me/documents`
- **Descripción:** El transportista sube su documentación de verificación (licencia, cédula, seguro). Se guarda en `uploads/documents/<userId>/` y el estado de verificación no cambia hasta solicitarla.
- **Autenticación:** Requerida (`DRIVER` o `ADMIN`).
- **Body:** `multipart/form-data` con uno o más archivos en el campo `documents` (PDF/JPG/PNG, ≤ 5 MB c/u).
- **Respuesta (200 OK):** Usuario con `documentsUrl` actualizado (sin duplicados).
- **Descarga:** los documentos **no** son públicos; se leen con `GET /files/documents/:ownerId/:filename` (ver sección *Archivos privados*).

---

### `POST /users/me/request-verification`
- **Descripción:** Solicita la verificación y homologación formal del perfil de transportista ante los administradores.
- **Autenticación:** Requerida (`DRIVER`).
- **Respuesta (200 OK):** Notificación de solicitud enviada.

---

### `PATCH /users/:id/verify`
- **Descripción:** Endpoint administrativo para aprobar o rechazar la verificación de un usuario/transportista.
- **Autenticación:** Requerida (`ADMIN`).
- **Body:** `{ "action": "approve" | "reject", "note"?: "..." }`
- **Reglas:** el usuario debe tener `documentsStatus = PENDING`; si no, 400. Notifica al transportista.
- **Respuesta (200 OK):** `{ id, documentsStatus }` actualizado.

---

### `GET /users`
- **Descripción:** Listado paginado de usuarios para moderación y administración.
- **Autenticación:** Requerida (`ADMIN`).
- **Query Params:** `role`, `documentsStatus` (`NONE|PENDING|APPROVED|REJECTED`), `page`, `limit`.
- **Respuesta (200 OK):** Lista de usuarios (incluye `phone`, `documentsUrl`, `avatarUrl`, `emailVerified` y `trucks`) y metadatos de paginación.

---

### `GET /users/verification/summary`
- **Descripción:** Contadores de la cola de verificación de transportistas (alimenta el panel `/admin`).
- **Autenticación:** Requerida (`ADMIN`).
- **Respuesta (200 OK):** `{ "data": { "NONE": 0, "PENDING": 0, "APPROVED": 0, "REJECTED": 0 } }`

---

## 3. Gestión de Camiones y Flota (`/trucks`)

### `GET /trucks`
- **Descripción:** Obtiene el listado de vehículos registrados en la flota del transportista autenticado.
- **Autenticación:** Requerida (`DRIVER` o `ADMIN`).
- **Respuesta (200 OK):** Array de objetos `Truck`.

---

### `POST /trucks`
- **Descripción:** Agrega un nuevo camión a la flota del transportista.
- **Autenticación:** Requerida (`DRIVER`).
- **Body:**
  ```json
  {
    "plate": "AA123BC",
    "type": "SEMI",
    "capacityKg": 30000,
    "preferredCargo": "PALLETS",
    "senasaNumber": "SENASA-99213"
  }
  ```
- **Respuesta (201 Created):** Objeto `Truck` creado.

---

### `GET /trucks/:id`
- **Descripción:** Obtiene el detalle de un camión específico de la flota.
- **Autenticación:** Requerida (`DRIVER` o `ADMIN`).
- **Respuesta (200 OK):** Objeto `Truck`.

---

### `PUT /trucks/:id`
- **Descripción:** Edita los datos o características de un camión.
- **Autenticación:** Requerida (`DRIVER` o `ADMIN` dueño del vehículo).
- **Body:** Campos del camión a modificar.
- **Respuesta (200 OK):** Objeto `Truck` actualizado.

---

### `POST /trucks/:id/documents`
- **Descripción:** Sube un documento del camión (VTV, SENASA, póliza). Se guarda en `uploads/documents/trucks/<truckId>/`. Solo el dueño del camión o un ADMIN (se valida **antes** de escribir el archivo).
- **Autenticación:** Requerida (`DRIVER` o `ADMIN`).
- **Body:** `multipart/form-data` con un archivo en el campo `document` (PDF/JPG/PNG, ≤ 5 MB).
- **Respuesta (200 OK):** Objeto `Truck` con `documentsUrl` actualizado.

---

### `DELETE /trucks/:id`
- **Descripción:** Elimina o desactiva un camión de la flota.
- **Autenticación:** Requerida (`DRIVER` o `ADMIN`).
- **Respuesta (200 OK):** `{ "message": "Camión eliminado con éxito" }`

---

## 4. Publicación y Gestión de Viajes (`/trips`)

### `GET /trips`
- **Descripción:** Lista los viajes publicados. Admite búsqueda por origen, destino, tipo de carga, estado y paginación.
- **Autenticación:** Requerida.
- **Query Params:** `cargoType`, `status`, `minPrice`, `maxPrice`, `lat`/`lng`/`radius` (cercanía), `mine=true`, `page`, `limit`.
- **Visibilidad (por rol):** `ADMIN` ve todo · `COMPANY` solo sus propios viajes (incluye borradores) · `DRIVER` solo viajes en subasta (`AUCTION`) o en los que ya ofertó. `mine=true` limita a los propios (empresa: creados; transportista: asignados).
- **Respuesta (200 OK):** `{ data: Trip[], meta: { total, page, limit } }`.

---

### `POST /trips`
- **Descripción:** Crea un nuevo viaje o solicitud de flete. Por defecto se crea en subasta activa o como borrador (`DRAFT`).
- **Autenticación:** Requerida (`COMPANY` o `ADMIN`).
- **Body:**
  ```json
  {
    "originAddress": "Av. Colón 1234, Córdoba",
    "originLat": -31.4135,
    "originLng": -64.1810,
    "destAddress": "Puerto de Rosario, Santa Fe",
    "destLat": -32.9468,
    "destLng": -60.6393,
    "cargoType": "BULK",
    "weightKg": 28000,
    "scheduledDate": "2026-08-15T08:00:00.000Z",
    "basePrice": 450000.00,
    "draft": false
  }
  ```
- **Respuesta (201 Created):** Objeto `Trip` y su subasta asociada.

---

### `GET /trips/:id`
- **Descripción:** Obtiene la información detallada de un viaje por su ID (incluye origen, destino, oferta ganadora y datos de contacto si corresponde).
- **Autenticación:** Requerida.
- **Visibilidad:** si el usuario no puede ver el viaje (borrador ajeno, viaje privado de otra empresa) responde **404**, no 403. El historial GPS (`trackingLogs`) solo se incluye para las partes (dueño, transportista adjudicado, admin).
- **Respuesta (200 OK):** Objeto `Trip` completo con sus relaciones.

---

### `POST /trips/:id/publish`
- **Descripción:** Cambia el estado de un viaje en borrador (`DRAFT`) a publicado en subasta (`AUCTION`).
- **Autenticación:** Requerida (`COMPANY` o `ADMIN` dueño del viaje).
- **Respuesta (200 OK):** Viaje y subasta abiertos.

---

### `PUT /trips/:id`
- **Descripción:** Modifica los parámetros de un viaje existente (solo permitido mientras no esté asignado ni en tránsito).
- **Autenticación:** Requerida (Dueño del viaje).
- **Body:** Campos editables del viaje.
- **Respuesta (200 OK):** Viaje modificado.

---

### `POST /trips/:id/cancel`
- **Descripción:** Cancela un viaje publicado o en subasta.
- **Autenticación:** Requerida (`COMPANY` o `ADMIN`).
- **Body:** `{ "reason": "Cambio de programación de cosecha" }`
- **Respuesta (200 OK):** Viaje y subasta marcados como `CANCELLED`.

---

### `DELETE /trips/:id`
- **Descripción:** Elimina un borrador de viaje.
- **Autenticación:** Requerida (Dueño del viaje).
- **Respuesta (200 OK):** `{ "message": "Viaje eliminado" }`

---

### `POST /trips/:id/start`
- **Descripción:** El transportista asignado marca el inicio del tránsito hacia destino (`TripStatus.IN_PROGRESS`).
- **Autenticación:** Requerida (`DRIVER` asignado al viaje).
- **Respuesta (200 OK):** Estado del viaje modificado a `IN_PROGRESS`.

---

### `POST /trips/:id/finish`
- **Descripción:** El transportista notifica la llegada y entrega de la carga en destino (`TripStatus.DELIVERED`).
- **Autenticación:** Requerida (`DRIVER` asignado al viaje).
- **Respuesta (200 OK):** Estado del viaje modificado a `DELIVERED`.

---

### `POST /trips/:id/confirm-delivery`
- **Descripción:** La empresa dante de carga confirma la recepción conforme de la mercadería y libera el cierre formal del flete (`SETTLED`).
- **Autenticación:** Requerida (`COMPANY` dante de carga o `ADMIN`).
- **Respuesta (200 OK):** Viaje completado y disparador de liberación de pago al transportista.

---

## 5. Sistema de Subastas Inversas (`/auctions`)

### `GET /auctions`
- **Descripción:** Obtiene el listado de subastas activas o finalizadas en la plataforma.
- **Autenticación:** Requerida.
- **Query Params:** `status`, `type`, `cargoType`, `page`, `limit`.
- **Respuesta (200 OK):** Lista de subastas con el precio menor actual (`currentPrice`).

---

### `POST /auctions`
- **Descripción:** Inicia manualmente una subasta para un viaje publicado.
- **Autenticación:** Requerida (`COMPANY` o `ADMIN`).
- **Body:**
  ```json
  {
    "tripId": "uuid-del-viaje",
    "type": "OPEN | DUTCH | SEALED",
    "endTime": "2026-08-10T18:00:00.000Z",
    "reservePrice": 400000.00
  }
  ```
- **Tipos:** `OPEN` (inversa: cada oferta debe bajar ≥ 10 %, anti-sniping), `DUTCH` (el precio baja solo de `basePrice` a `reservePrice` según el tiempo; el primero que pulsa «Tomar» gana al instante), `SEALED` (ofertas ocultas: el monto solo lo ven la empresa dueña, el admin y el propio oferente).
- **Respuesta (201 Created):** Objeto `Auction`.

---

### `GET /auctions/:id`
- **Descripción:** Devuelve los datos de una subasta específica y su cuenta regresiva/tiempo restante.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** Objeto `Auction` con `bids`. Aplican las mismas reglas de visibilidad que en `/trips/:id` y, en `SEALED`, los montos ajenos vienen `null` con `sealed: true`. El teléfono del oferente solo lo ve el dueño del viaje.

---

### `POST /auctions/:id/bid`
- **Descripción:** Permite a un transportista realizar una oferta (puja) en la subasta. El monto debe ser menor a la oferta actual menos la regla de paso mínimo (10%). Aplica anti-sniping automático si resta menos de 5 min.
- **Autenticación:** Requerida (`DRIVER`).
- **Notas por tipo:** en `DUTCH` el `amount` se ignora: se adjudica al precio vigente (bloqueo atómico, solo un ganador). En `SEALED` no se publica la oferta mínima.
- **Body:**
  ```json
  {
    "amount": 420000.00,
    "truckId": "uuid-del-camion",
    "note": "Camión listo en zona para cargar el lunes"
  }
  ```
- **Respuesta (201 Created):** Puja registrada y actualización del `currentPrice` de la subasta.

---

### `GET /auctions/:id/bids`
- **Descripción:** Lista todas las ofertas realizadas en una subasta específica ordenadas cronológicamente de la mejor a la peor.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** Array de objetos `Bid` (con los montos redactados en subastas `SEALED` según el espectador).

---

### `PATCH /auctions/:id/extend`
- **Descripción:** Extiende el tiempo de finalización de una subasta manualmente.
- **Autenticación:** Requerida (`COMPANY` o `ADMIN`).
- **Body:** `{ "hours": 1-72 }` (entero)
- **Respuesta (200 OK):** Subasta con nuevo `endTime`.

---

## 6. Ofertas y Pujas (`/bids`)

### `GET /bids/me`
- **Descripción:** Obtiene todas las ofertas enviadas por el transportista autenticado.
- **Autenticación:** Requerida (`DRIVER`).
- **Respuesta (200 OK):** Lista de pujas con datos del viaje y subasta asociados.

---

### `PATCH /bids/:id/withdraw`
- **Descripción:** Permite al transportista retirar una oferta pendiente antes del cierre de la subasta.
- **Autenticación:** Requerida (`DRIVER` autor de la puja).
- **Respuesta (200 OK):** Puja con `status = WITHDRAWN`.

---

### `PUT /bids/:id`
- **Descripción:** Permite modificar el monto o nota de una puja activa.
- **Autenticación:** Requerida (`DRIVER` autor de la puja).
- **Body:** `{ "amount": 410000.00, "note": "Nueva propuesta" }`
- **Respuesta (200 OK):** Puja actualizada.

---

### `PATCH /bids/:id`
- **Descripción:** Permite a la empresa aceptar la oferta de un transportista y adjudicarle el viaje.
- **Autenticación:** Requerida (`COMPANY` dante de carga o `ADMIN`).
- **Body:** `{ "status": "ACCEPTED" }`
- **Respuesta (200 OK):** Puja aceptada, subasta finalizada, viaje adjudicado (`ASSIGNED`) y creación de orden de retención de pago (`Payment`).

---

## 7. Pagos y MercadoPago (`/payments`)

### `POST /payments/hold`
- **Descripción:** Genera la orden de retención en garantía (escrow) y el enlace de pago de MercadoPago para la empresa dante de carga.
- **Autenticación:** Requerida.
- **Body:** `{ "tripId": "uuid-del-viaje" }`
- **Respuesta (200 OK):** Objeto `Payment` con `paymentUrl` de MercadoPago y estado `HELD` o `PENDING`.

---

### `POST /payments/release`
- **Descripción:** Libera los fondos retenidos al transportista una vez que la empresa ha confirmado la entrega conforme (`confirm-delivery`). Descuenta la comisión de plataforma (8%) y liquida el monto neto.
- **Autenticación:** Requerida.
- **Body:** `{ "tripId": "uuid-del-viaje" }`
- **Respuesta (200 OK):** Objeto `Payment` actualizado a `RELEASED`.

---

### `GET /payments/:tripId`
- **Descripción:** Consulta el estado financiero, comisión de plataforma y montos netos del pago correspondiente a un viaje.
- **Autenticación:** Requerida (Solo partes involucradas o Admin).
- **Respuesta (200 OK):** Objeto `Payment`.

---

### `POST /payments/webhook`
- **Descripción:** Endpoint receptor de notificaciones instantáneas de pago (IPN / Webhook) enviadas por MercadoPago para actualizar el estado del pago automáticamente.
- **Autenticación:** Pública (Valida la firma `X-Signature` de MercadoPago).
- **Respuesta (200 OK):** Confirmación de recepción.

---

## 8. Seguimiento GPS en Tiempo Real (`/tracking`)

### `POST /tracking/:tripId`
- **Descripción:** Emisión de coordenadas GPS enviadas desde la app/dispositivo del transportista durante el viaje. Si es el primer punto y el viaje estaba en `ASSIGNED`, lo pasa automáticamente a `IN_PROGRESS`.
- **Autenticación:** Requerida (`DRIVER` asignado al viaje).
- **Body:**
  ```json
  {
    "lat": -31.4167,
    "lng": -64.1833,
    "speed": 82.5,
    "heading": 145.0
  }
  ```
- **Respuesta (201 Created):** Punto GPS guardado y retransmitido vía WebSockets a la empresa.

---

### `GET /tracking/:tripId/current`
- **Descripción:** Obtiene la última posición GPS conocida del vehículo en viaje.
- **Autenticación:** Requerida y solo para las **partes del viaje** (empresa dueña, transportista adjudicado, admin); el resto recibe 403/404.
- **Respuesta (200 OK):** Objeto `TrackingLog` más reciente.

---

### `GET /tracking/:tripId/history`
- **Descripción:** Devuelve la lista histórica de puntos GPS registrados durante todo el trayecto para trazar la ruta en el mapa.
- **Autenticación:** Requerida y solo para las partes del viaje (igual que `/current`).
- **Respuesta (200 OK):** Array de objetos `TrackingLog`.

---

## 9. Calificaciones y Reseñas (`/ratings`)

### `POST /ratings`
- **Descripción:** Permite calificar la contraparte de un viaje completado (Empresa a Transportista o Transportista a Empresa).
- **Autenticación:** Requerida (Participante del viaje).
- **Body:**
  ```json
  {
    "tripId": "uuid-del-viaje",
    "toUserId": "uuid-del-evaluado",
    "score": 5.0,
    "punctuality": 5.0,
    "communication": 4.5,
    "cargoCondition": 5.0,
    "comment": "Excelente atención y puntualidad en la descarga."
  }
  ```
- **Respuesta (201 Created):** Objeto `Rating` y actualización automática del promedio de puntuación del usuario.

---

### `GET /ratings/user/:userId`
- **Descripción:** Obtiene la lista de calificaciones y comentarios recibidos por un usuario.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** Array de objeto `Rating` con datos del emisor.

---

## 10. Notificaciones (`/notifications`)

### `GET /notifications`
- **Descripción:** Devuelve las notificaciones del usuario autenticado (ofertas recibidas, cambios de estado, etc.).
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** Lista de notificaciones ordenadas por fecha reciente.

---

### `PATCH /notifications/:id/read`
- **Descripción:** Marca una notificación específica como leída.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** Notificación actualizada.

---

### `POST /notifications/read-all`
- **Descripción:** Marca todas las notificaciones pendientes del usuario como leídas.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** `{ "message": "Todas las notificaciones fueron marcadas como leídas" }`

---

## 11. Estadísticas y Métricas (`/stats`)

### `GET /stats/me`
- **Descripción:** Devuelve las métricas y tablero de indicadores del usuario autenticado adaptado a su rol:
  - **Empresa:** Total de viajes creados, activos, gasto acumulado, subastas abiertas.
  - **Transportista:** Total de subastas ganadas, ganancias brutas y netas acumuladas, viajes completados, rating actual.
- **Autenticación:** Requerida.
- **Respuesta (200 OK):** Objeto JSON con las métricas acumuladas y KPIs.

---

## 12. Archivos Privados (`/files`)

La documentación sensible **no** se sirve como estático. Solo los avatares son públicos (`/uploads/avatars/...`). Todo lo demás se descarga autenticado, con `Cache-Control: private, no-store`.

### `GET /files/documents/:ownerId/:filename`
- **Descripción:** Descarga un documento de verificación de un usuario.
- **Autenticación:** Requerida: el propio dueño o `ADMIN`.
- **Respuesta:** el archivo; 404 si no existe o no hay permiso.

---

### `GET /files/documents/trucks/:truckId/:filename`
- **Descripción:** Descarga un documento de un camión.
- **Autenticación:** Requerida: dueño del camión o `ADMIN`.
- **Seguridad:** `truckId`/`ownerId` deben ser UUID y `filename` un nombre plano (sin `/`, `..`): protección contra path traversal.
