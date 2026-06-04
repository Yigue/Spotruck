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

{ "amount": 45000 }
```

- **Reverse auction:** bids must be LOWER than current price
- Anti-sniping: extends auction by 5 min if bid placed in last 5 min
- Max 3 extensions per auction

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "auctionId": "uuid",
    "userId": "uuid",
    "amount": 45000,
    "createdAt": "2026-06-04T..."
  }
}
```

---

## Payments

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

### Subscribe to Trip
```ws
ws://localhost:4000/tracking/subscribe/:tripId
```

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
