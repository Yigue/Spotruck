# Spottruck — API Documentation

## Base URL
```
http://localhost:4000/api/v1
```

## Auth

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "name": "Juan Pérez",
  "role": "COMPANY" | "DRIVER"
}
```

**Response `201`:**
```json
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "uuid", "email": "...", "name": "...", "role": "..." }
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response `200`:**
```json
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": "uuid", "email": "...", "name": "...", "role": "..." }
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{ "refreshToken": "eyJ..." }
```

### Get Me
```http
GET /auth/me
Authorization: Bearer <accessToken>
```

---

## Trips

### List Trips
```http
GET /trips?status=AUCTION
Authorization: Bearer <accessToken>
```

### Get Trip
```http
GET /trips/:id
Authorization: Bearer <accessToken>
```

### Create Trip
```http
POST /trips
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "originAddress": "Rosario, Santa Fe",
  "originLat": -32.9442,
  "originLng": -60.6505,
  "destAddress": "Buenos Aires, CABA",
  "destLat": -34.6037,
  "destLng": -58.3816,
  "cargoType": "BULK" | "PALLETS" | "GENERAL" | "REFRIGERATED",
  "cargoDesc": "Descripción opcional",
  "weightKg": 10000,
  "scheduledDate": "2026-06-20T08:00:00Z",
  "basePrice": 50000
}
```

### Update Trip
```http
PUT /trips/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "status": "OPEN" }
```

**Status flow:** `DRAFT` → `OPEN` → `AUCTION` → `IN_PROGRESS` → `COMPLETED` | `CANCELLED`

---

## Auctions

### List Auctions
```http
GET /auctions
Authorization: Bearer <accessToken>
```

### Get Auction
```http
GET /auctions/:id
Authorization: Bearer <accessToken>
```

### Create Auction
```http
POST /auctions
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "tripId": "uuid"
}
```

Trip must have `status: OPEN`. Creates auction in `OPEN` status.

### Place Bid
```http
POST /auctions/:id/bid
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "amount": 45000, "note": "Tengo factura A", "truckId": "uuid" }
```

- **Reverse auction:** bids must be LOWER than current price
- Anti-sniping: extends auction by 5 min if bid placed in last 5 min
- Max 3 extensions per auction
- `note` (optional): aclaración del transportista
- `truckId` (optional): camión de la flota propia; se valida propiedad, que esté activo y que la capacidad cubra el peso de la carga

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "auctionId": "uuid",
    "userId": "uuid",
    "amount": 45000,
    "note": "Tengo factura A",
    "status": "PENDING",
    "truckId": "uuid",
    "createdAt": "2026-06-04T..."
  }
}
```

### Accept / Reject Bid (empresa)
```http
PATCH /bids/:id
Authorization: Bearer <accessToken>  (COMPANY dueña del viaje)
Content-Type: application/json

{ "action": "accept" }
```

- `accept`: cierra la subasta, rechaza las demás ofertas, asigna el viaje (`ASSIGNED`) y crea el hold de pago
- `reject`: marca la oferta como `REJECTED` y notifica al transportista

---

## Trip Lifecycle (stepper)

Estados: `ASSIGNED` (Preparando) → `IN_PROGRESS` (En viaje) → `DELIVERED` (Esperando confirmación) → `SETTLED` (Finalizada)

```http
POST /trips/:id/start             # DRIVER asignado: ASSIGNED → IN_PROGRESS
POST /trips/:id/finish            # DRIVER asignado: IN_PROGRESS → DELIVERED
POST /trips/:id/confirm-delivery  # COMPANY dueña: DELIVERED → SETTLED (libera el pago)
```

---

## Trucks (flota del transportista)

```http
GET    /trucks        # flota propia (DRIVER)
POST   /trucks        # { "plate", "type", "capacityKg", "preferredCargo?", "senasaNumber?", "insurance?" }
PUT    /trucks/:id
DELETE /trucks/:id    # baja lógica (active=false) si el camión tiene ofertas asociadas
```

`type`: `JAULA | SEMI | TOLVA | BATEA | FURGON | REFRIGERADO | PLAYO | OTRO`

---

## Notifications

```http
GET   /notifications            # propias, paginadas; meta incluye "unread"
PATCH /notifications/:id/read
POST  /notifications/read-all
```

`type`: `NEW_BID | BID_ACCEPTED | BID_REJECTED | TRIP_STATE | AUCTION_CLOSED`

---

## Email Verification

```http
POST /auth/verify-email          { "token": "<token del link del email>" }
POST /auth/resend-verification   (auth) reenvía el link de verificación
```

Al registrarse se envía un email con el link `FRONTEND_URL/verify-email?token=...`.
Sin `RESEND_API_KEY` configurada, el email se loguea en la consola del servidor.

---

## Payments

El flujo de pago depende de la configuración:

- **Con `MERCADOPAGO_ACCESS_TOKEN`**: al aceptar una oferta el pago nace
  `PENDING` con un `paymentUrl` (Checkout Pro). Cuando la empresa paga,
  MercadoPago notifica al webhook y el pago pasa a `HELD` (custodia).
- **Sin credenciales (modo simulado)**: el pago nace `HELD` directamente.

En ambos casos, `HELD → RELEASED` ocurre cuando la empresa confirma la
entrega (`POST /trips/:id/confirm-delivery`).

### Webhook MercadoPago
```http
POST /payments/webhook            (lo llama MercadoPago, sin auth)
```
Configurar en el panel de MP apuntando a `API_URL/api/v1/payments/webhook`.
Si `MERCADOPAGO_WEBHOOK_SECRET` está seteado se valida la firma `x-signature`.

### Hold Payment
```http
POST /payments/hold
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "tripId": "uuid" }
```

### Release Payment
```http
POST /payments/release
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "tripId": "uuid" }
```

### Get Payment
```http
GET /payments/:tripId
Authorization: Bearer <accessToken>
```

---

## Ratings

### Create Rating
```http
POST /ratings
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "tripId": "uuid",
  "toUserId": "uuid",
  "score": 5,
  "punctuality": 4,
  "communication": 5,
  "cargoCondition": 5,
  "comment": "Muy profesional"
}
```

### Get User Ratings
```http
GET /ratings/user/:userId
Authorization: Bearer <accessToken>
```

---

## Tracking

### Update Location
```http
POST /tracking/update
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "tripId": "uuid",
  "lat": -34.6037,
  "lng": -58.3816,
  "speedKmh": 85
}
```

## WebSocket (tiempo real)

```
ws://localhost:4000/ws?token=<accessToken>
```

Al conectar, el servidor suscribe automáticamente al canal personal
`user:<id>` (notificaciones). Suscripción explícita a subastas y viajes:

```json
{ "type": "subscribe", "payload": { "channel": "auction", "id": "<auctionId>" } }
{ "type": "subscribe", "payload": { "channel": "trip", "id": "<tripId>" } }
{ "type": "unsubscribe", "payload": { "channel": "trip", "id": "<tripId>" } }
```

Mensajes que emite el servidor:

| type | Canal | Cuándo |
|---|---|---|
| `auction_update` | auction | nueva oferta (trae `currentPrice`, `endTime`) o cierre (`status: SETTLED`) |
| `trip_update` | trip | cambio de estado del viaje (`status`) |
| `tracking_update` | trip | nueva posición GPS (`lat`, `lng`, `speed`, `recordedAt`) |
| `notification` | user | notificación in-app nueva (trae el objeto `notification`) |

---

## Demo Credentials

```
empresa@demo.com     / Demo1234!  → COMPANY
camionero1@demo.com  / Demo1234!  → DRIVER
```

## Error Format

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Descriptive error message"
  }
}
```

Common codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `INTERNAL_ERROR`
