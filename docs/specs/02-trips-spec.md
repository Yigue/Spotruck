# SPEC: Trip Management

## 1. Feature

**Trip Management** — Companies create and manage freight trips; drivers view available trips. Trip lifecycle is governed by a status state machine.

---

## 2. User Story

> **COMO** empresa **QUIERO** publicar viajes **PARA** que transportistas puedan competir

---

## 3. Behavior

### 3.1 Trip Lifecycle (State Machine)

```
DRAFT → OPEN → AUCTION → ASSIGNED → IN_PROGRESS → DELIVERED → SETTLED
  │                                                        ↑
  └──────────────────────────────────── cancellation ───────┘
```

| Status | Who Transitions | Trigger |
|---|---|---|
| `DRAFT` | Company | Trip created, not yet published |
| `OPEN` | Company | Trip published, auction not started |
| `AUCTION` | System | Auction goes live (scheduled or manual) |
| `ASSIGNED` | System | Auction closes, winner selected |
| `IN_PROGRESS` | System | Driver sends first GPS update |
| `DELIVERED` | Company | Company confirms cargo delivered |
| `SETTLED` | System | Payment released to driver |
| *(cancelled)* | Company/Driver | Cancellation at any non-terminal state |

### 3.2 CRUD Operations

- **Create** (DRAFT): Company provides origin, destination, cargo description, date, price
- **Read**: Anyone (authenticated) can view trip details; drivers see OPEN/AUCTION trips
- **Update**: Only DRAFT trips; company can modify any field before publishing
- **Delete**: Only DRAFT trips; soft-delete (cancelled) for audit trail

### 3.3 Validations

- Coordinates: latitude `[-90, 90]`, longitude `[-180, 180]`
- Price: `> 0` (positive decimal)
- Trip date: must be in the future (at least 1 hour from now)
- Cargo weight: `> 0` kg
- Cargo description: non-empty string, max 1000 chars

---

## 4. API Contract

### POST /trips

**Auth:** COMPANY only

**Request:**
```json
{
  "origin": {
    "lat": 19.4326,
    "lng": -99.1332,
    "address": "Mexico City, CDMX"
  },
  "destination": {
    "lat": 20.6597,
    "lng": -103.3496,
    "address": "Guadalajara, Jalisco"
  },
  "cargoDescription": "Electronics shipment - 500kg",
  "cargoWeight": 500,
  "price": 15000.00,
  "scheduledDate": "2026-06-10T08:00:00Z",
  "status": "DRAFT"
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "origin": { "lat": 19.4326, "lng": -99.1332, "address": "Mexico City, CDMX" },
  "destination": { "lat": 20.6597, "lng": -103.3496, "address": "Guadalajara, Jalisco" },
  "cargoDescription": "Electronics shipment - 500kg",
  "cargoWeight": 500,
  "price": 15000.00,
  "scheduledDate": "2026-06-10T08:00:00Z",
  "status": "DRAFT",
  "createdAt": "2026-06-04T10:00:00Z"
}
```

**Errors:** `400` validation | `401` | `403` not a COMPANY

---

### GET /trips

**Auth:** Any authenticated user

**Query Params:**
| Param | Type | Notes |
|---|---|---|
| `status` | string | Filter by status (e.g., `OPEN,AUCTION`) |
| `fromDate` | ISO8601 | Filter trips scheduled after |
| `toDate` | ISO8601 | Filter trips scheduled before |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

**Response `200`:**
```json
{
  "data": [/* trip objects */],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Note:** DRIVER role sees only `OPEN` or `AUCTION` trips regardless of query filter (enforced server-side).

---

### GET /trips/:id

**Auth:** Any authenticated user

**Response `200`:** Full trip object including `companyId` and `assignedDriverId` (if any)

**Errors:** `404` not found | `403` trying to view another company's DRAFT

---

### PUT /trips/:id

**Auth:** COMPANY (own trips only)

**Request:** Any subset of trip fields (partial update)

**Response `200`:** Updated trip object

**Errors:** `400` validation | `401` | `403` not owner | `404` | `409` trip not in DRAFT status

---

### DELETE /trips/:id

**Auth:** COMPANY (own trips only)

**Behavior:** Soft-delete; status → `CANCELLED`

**Response `200`:**
```json
{
  "success": true,
  "id": "uuid"
}
```

**Errors:** `401` | `403` not owner | `404` | `409` trip not in DRAFT

---

### PATCH /trips/:id/status

**Auth:** COMPANY or SYSTEM

**Request:**
```json
{
  "status": "OPEN"
}
```

**Response `200`:** Updated trip object

**Errors:** `400` invalid status transition | `401` | `403` | `404`

---

## 5. Data Model

### Trip

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `companyId` | UUID | FK → User, not null |
| `assignedDriverId` | UUID? | FK → User, nullable |
| `originLat` | float | not null, -90 to 90 |
| `originLng` | float | not null, -180 to 180 |
| `originAddress` | string | not null, max 500 |
| `destinationLat` | float | not null, -90 to 90 |
| `destinationLng` | float | not null, -180 to 180 |
| `destinationAddress` | string | not null, max 500 |
| `cargoDescription` | string | not null, max 1000 |
| `cargoWeight` | float | not null, > 0 |
| `price` | decimal | not null, > 0 |
| `scheduledDate` | DateTime | not null, future |
| `status` | enum | DRAFT/OPEN/AUCTION/ASSIGNED/IN_PROGRESS/DELIVERED/SETTLED/CANCELLED |
| `deletedAt` | DateTime? | soft delete |
| `createdAt` | DateTime | auto |
| `updatedAt` | DateTime | auto-update |

**Indexes:** `companyId` | `status` | `scheduledDate`

---

## 6. Edge Cases

- **Company updates another company's trip** → `403 Forbidden`
- **Driver tries to create a trip** → `403 Forbidden`
- **Update trip that is not DRAFT** → `409 Conflict`
- **Delete trip that has bids** → allowed (auction cancelled, drivers notified)
- **ScheduledDate in the past** → `400` validation error
- **Coordinates outside valid range** → `400` validation error
- **Price is zero or negative** → `400` validation error
- **Trip transitions to ASSIGNED but winner's payment hold fails** → transaction rollback, auction remains OPEN
- **Pagination beyond available results** → return empty `data` array with correct metadata

---

## 7. Acceptance Criteria

- [ ] Company can create a trip in DRAFT status
- [ ] DRAFT trip is visible only to its owning company
- [ ] Trip coordinates are validated: lat ∈ [-90, 90], lng ∈ [-180, 180]
- [ ] Trip price is validated: > 0
- [ ] Trip scheduledDate is validated: must be at least 1 hour in the future
- [ ] Company can update a DRAFT trip
- [ ] Company can publish a DRAFT trip → status becomes OPEN
- [ ] Company can cancel (soft-delete) a DRAFT trip
- [ ] DRIVER role cannot create, update, or delete trips
- [ ] DRIVER can list and view OPEN/AUCTION trips
- [ ] Status transitions follow the state machine (invalid transitions return `409`)
- [ ] Soft-delete sets `deletedAt`; trip is excluded from normal queries
- [ ] Trip list supports filtering by status, date range, and price range
- [ ] Trip list supports pagination (page, limit)
- [ ] GET /trips/:id returns full trip details for authorized users