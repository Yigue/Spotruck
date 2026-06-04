# SPEC: GPS Tracking

## 1. Feature

**GPS Tracking** — Drivers post position updates during active trips; companies view real-time location and route history. Trip status advances automatically.

---

## 2. User Story

> **COMO** empresa **QUIERO** ver la ubicación en tiempo real del transporte **PARA** saber cuándo llegará mi carga

---

## 3. Behavior

### 3.1 Position Updates

- Driver posts `POST /tracking/:tripId` with current coordinates, speed, and heading
- Updates are stored as `TrackingLog` records with server timestamp
- First position update for a trip in `ASSIGNED` status → automatically transitions to `IN_PROGRESS`

### 3.2 Real-Time Viewing

- **V1 (current spec):** Company polls `GET /tracking/:tripId` for current position and history
- **Future (V2):** WebSocket push for live updates (stubbed, not implemented in V1)

### 3.3 ETA Calculation

```
ETA = distance(from current position to destination) / average speed
```

- Distance calculated using Haversine formula between last known position and destination
- Speed from latest TrackingLog record (km/h)
- If no speed data: assume 60 km/h average
- Displayed in minutes; if > 60 min, display in hours + minutes

### 3.4 Route History

- All TrackingLog entries for a trip are stored and retrievable
- Company can request full history or a time-windowed slice

---

## 4. API Contract

### POST /tracking/:tripId

**Auth:** DRIVER (assigned to this trip only)

**Request:**
```json
{
  "lat": 20.3421,
  "lng": -102.5678,
  "speed": 85.5,
  "heading": 45.0,
  "recordedAt": "2026-06-04T12:30:00Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `lat` | float | ✅ | -90 to 90 |
| `lng` | float | ✅ | -180 to 180 |
| `speed` | float | ✅ | km/h, ≥ 0 |
| `heading` | float | ✅ | 0–360 degrees |
| `recordedAt` | ISO8601 | ✅ | Client timestamp; stored but server time is authoritative |

**Response `201`:**
```json
{
  "id": "uuid",
  "tripId": "uuid",
  "lat": 20.3421,
  "lng": -102.5678,
  "speed": 85.5,
  "heading": 45.0,
  "recordedAt": "2026-06-04T12:30:00Z",
  "serverRecordedAt": "2026-06-04T12:30:05Z",
  "tripStatus": "IN_PROGRESS"
}
```

**Notes:** `tripStatus` shows new status if auto-advanced. Only the first update triggers status transition.

**Errors:** `400` validation | `401` | `403` not assigned driver | `404` | `409` trip not in ASSIGNED or IN_PROGRESS

---

### GET /tracking/:tripId/current

**Auth:** COMPANY (own trip) or DRIVER (assigned to trip)

**Response `200`:**
```json
{
  "tripId": "uuid",
  "lat": 20.3421,
  "lng": -102.5678,
  "speed": 85.5,
  "heading": 45.0,
  "recordedAt": "2026-06-04T12:30:00Z",
  "etaMinutes": 145,
  "etaFormatted": "2h 25m",
  "destination": {
    "lat": 20.6597,
    "lng": -103.3496,
    "address": "Guadalajara, Jalisco"
  }
}
```

**Errors:** `403` | `404`

---

### GET /tracking/:tripId/history

**Auth:** COMPANY (own trip) or DRIVER (assigned to trip)

**Query Params:**
| Param | Type | Notes |
|---|---|---|
| `from` | ISO8601 | Start of time window |
| `to` | ISO8601 | End of time window |
| `page` | number | Default `1` |
| `limit` | number | Default `100`, max `1000` |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "lat": 20.3421,
      "lng": -102.5678,
      "speed": 85.5,
      "heading": 45.0,
      "recordedAt": "2026-06-04T12:30:00Z"
    },
    {
      "id": "uuid",
      "lat": 20.3510,
      "lng": -102.5540,
      "speed": 82.0,
      "heading": 44.0,
      "recordedAt": "2026-06-04T12:25:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 100, "total": 450, "pages": 5 }
}
```

**Note:** Results ordered by `recordedAt` descending (newest first)

---

### WebSocket /tracking/:tripId/ws (V2 Stub)

**Stub for future implementation:**

```
Connection: ws://host/ws/tracking/:tripId?token=<accessToken>
Messages (server → client):
  { type: "POSITION_UPDATE", data: { lat, lng, speed, heading, recordedAt } }

Messages (client → server):
  { type: "SUBSCRIBE", tripId: "uuid" }
  { type: "UNSUBSCRIBE", tripId: "uuid" }
```

---

## 5. Data Model

### TrackingLog

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `tripId` | UUID | FK → Trip |
| `driverId` | UUID | FK → User |
| `lat` | float | not null, -90 to 90 |
| `lng` | float | not null, -180 to 180 |
| `speed` | float | not null, ≥ 0 (km/h) |
| `heading` | float | not null, 0–360 |
| `recordedAt` | DateTime | not null (client timestamp) |
| `serverRecordedAt` | DateTime | not null (server timestamp, auto) |

**Indexes:** `(tripId, serverRecordedAt DESC)` | `tripId`

---

## 6. Edge Cases

- **Driver posts to a trip not assigned to them** → `403 Forbidden`
- **Driver posts to a CANCELLED or SETTLED trip** → `409` trip not trackable
- **Position coordinates outside valid range** → `400` validation error
- **Speed or heading out of range** → `400` validation error
- **First update transitions trip from ASSIGNED → IN_PROGRESS** → both operations in same transaction; if transition fails, tracking log still saved but status unchanged
- **Company polls for a trip with no tracking logs yet** → `200` with null current position (trip may still be at origin)
- **GPS device sends stale `recordedAt` (e.g., 1h old)** → stored with warning flag (future enhancement), not rejected
- **Driver disconnects (no updates for > 30 min)** → no automatic action in V1 (V2: alert)
- **ETA calculation when destination is same as current position** → `etaMinutes: 0`
- **ETA calculation when speed = 0** → use default average speed 60 km/h
- **Pagination beyond available data** → empty `data` array with correct metadata

---

## 7. Acceptance Criteria

- [ ] Driver can post position update with lat, lng, speed, heading
- [ ] First position update on ASSIGNED trip auto-advances status to IN_PROGRESS
- [ ] Position coordinates validated: lat ∈ [-90, 90], lng ∈ [-180, 180]
- [ ] Speed validated: ≥ 0 km/h
- [ ] Heading validated: 0–360 degrees
- [ ] GET /tracking/:tripId/current returns latest position
- [ ] GET /tracking/:tripId/current returns ETA to destination
- [ ] GET /tracking/:tripId/history returns all tracking logs for a trip
- [ ] Tracking history supports time-window filtering via `from` and `to` params
- [ ] Tracking history is paginated
- [ ] COMPANY can only view tracking for their own trips
- [ ] DRIVER can only post tracking for trips assigned to them
- [ ] Only ASSIGNED or IN_PROGRESS trips accept tracking updates
- [ ] Server `serverRecordedAt` is set automatically and is the authoritative timestamp
- [ ] WebSocket stub documented for V2 future implementation