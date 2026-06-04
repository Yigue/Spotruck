# SPEC: Auction System

## 1. Feature

**Auction System** — Three auction modes for trip pricing. Drivers compete to win trips; the system automatically manages bid lifecycles, anti-sniping, and winner resolution.

---

## 2. User Story

> **COMO** transportista **QUIERO** pujar en subastas **PARA** ganar viajes a buen precio

---

## 3. Behavior

### 3.1 Auction Types

#### Open Auction (English Reverse)
- Drivers bid **downward** — lower price wins
- Minimum bid decrement enforced by server
- Auction has a fixed end time; highest score (lowest bid) at close wins
- **Anti-sniping:** If a bid is placed within the **last 5 minutes**, the auction extends by **2 minutes**. Maximum **3 extensions** per auction. Extension counter resets after each qualifying bid.

#### Dutch Auction (Descending Price)
- System starts at `startPrice` and descends at `priceDecrementPerInterval`
- Price displayed; drivers **accept** (not bid) — first acceptance wins immediately
- No anti-sniping needed (price descending, not ending time-based)

#### Sealed Bid
- All bids are hidden until auction close
- Drivers submit one bid; server stores it encrypted/invisible
- On close: highest bid (lowest price, since reverse) wins
- No anti-sniping (bid visibility is hidden)

### 3.2 Bid Lifecycle

1. Driver places bid (`OPEN` auction) or accepts (`DUTCH`)
2. System validates: bid < current best, bid ≥ minimum allowed
3. Bid stored: `PENDING`
4. If winning: previous winner's bid status → `OUTBID`
5. On auction close: winner's bid status → `WON`, trip status → `ASSIGNED`, payment hold created

### 3.3 Winner Resolution

When auction closes:
1. Determine winner (lowest unique bid for OPEN/SEALED; first acceptance for DUTCH)
2. Trip status → `ASSIGNED`, `assignedDriverId` set
3. Payment `Hold` created for winner (see Payments spec)
4. All losing bids → `LOST`
5. All other trips with same winner → not affected (parallel auctions)

### 3.4 Anti-Sniping Edge Cases

**Case: Two bids arrive at the exact same second**
- Server processes in received order (database `createdAt` timestamp with millisecond precision)
- First received wins; second gets `OUTBID` immediately
- Extensions apply per bid that qualifies, not per bid received

**Case: Bid received after max extensions exhausted**
- Auction is already `CLOSED` → bid rejected with `410 Gone`

**Case: Network latency skews bid timing**
- Server relies on its own `createdAt`, not client-provided time
- Client timestamps are logged but not authoritative

---

## 4. API Contract

### GET /auctions/:tripId

**Auth:** DRIVER or COMPANY (own trip only)

**Response `200`:**
```json
{
  "id": "uuid",
  "tripId": "uuid",
  "type": "OPEN",
  "status": "ACTIVE",
  "startPrice": 20000.00,
  "currentPrice": 15000.00,
  "minPrice": 8000.00,
  "endTime": "2026-06-04T14:00:00Z",
  "extensionCount": 1,
  "maxExtensions": 3,
  "bids": [
    {
      "id": "uuid",
      "amount": 15000.00,
      "status": "PENDING",
      "createdAt": "2026-06-04T11:30:00Z"
    }
  ]
}
```

**Notes:**
- `bids` array shows only the authenticated driver's own bids (or all bids if COMPANY viewing own auction)
- In `SEALED` mode, bids are hidden until `CLOSED`
- `currentPrice` = lowest qualifying bid for OPEN; current descending price for DUTCH

**Errors:** `404` | `403`

---

### POST /auctions/:tripId/bids

**Auth:** DRIVER only

**Request:**
```json
{
  "amount": 14500.00
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "auctionId": "uuid",
  "amount": 14500.00,
  "status": "PENDING",
  "createdAt": "2026-06-04T11:35:00Z",
  "auction": {
    "endTime": "2026-06-04T14:02:00Z",
    "extensionCount": 2
  }
}
```

**Errors:** `400` amount too high or below minimum | `401` | `403` | `404` | `409` auction not ACTIVE | `410` auction closed

---

### POST /auctions/:tripId/accept

**Auth:** DRIVER only — for DUTCH auctions only

**Request:**
```json
{
  "acceptedPrice": 12000.00
}
```

**Response `200`:**
```json
{
  "id": "uuid",
  "status": "WON",
  "auctionId": "uuid",
  "tripId": "uuid",
  "paymentHoldId": "uuid"
}
```

**Errors:** `400` price mismatch (already descended further) | `403` | `404` | `409` not a DUTCH auction or already closed

---

### GET /auctions/:tripId/bids

**Auth:** DRIVER (own bids) or COMPANY (all bids for own trip, SEALED: hidden until close)

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "driverId": "uuid",
      "amount": 14500.00,
      "status": "PENDING",
      "createdAt": "2026-06-04T11:35:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
}
```

---

### PATCH /auctions/:tripId/close

**Auth:** COMPANY (own trip) or SYSTEM

**Behavior:** Manually close auction early (e.g., after finding alternative carrier)

**Response `200`:**
```json
{
  "auctionId": "uuid",
  "status": "CLOSED",
  "winnerId": "uuid",
  "winningBidId": "uuid"
}
```

**Errors:** `404` | `409` already closed

---

## 5. Data Model

### Auction

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `tripId` | UUID | FK → Trip, unique |
| `type` | enum | `OPEN`, `DUTCH`, `SEALED` |
| `status` | enum | `SCHEDULED`, `ACTIVE`, `CLOSED`, `CANCELLED` |
| `startPrice` | decimal | not null |
| `currentPrice` | decimal | not null |
| `minPrice` | decimal? | nullable (for Dutch decrement floor) |
| `priceDecrementInterval` | int? | seconds (Dutch) |
| `priceDecrementAmount` | decimal? | (Dutch) |
| `endTime` | DateTime | not null |
| `extensionCount` | int | default 0 |
| `maxExtensions` | int | default 3 |
| `createdAt` | DateTime | auto |

### Bid

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `auctionId` | UUID | FK → Auction |
| `driverId` | UUID | FK → User |
| `amount` | decimal | not null |
| `status` | enum | `PENDING`, `OUTBID`, `WON`, `LOST` |
| `createdAt` | DateTime | auto |

**Indexes:** `(auctionId, status)` | `(driverId, createdAt)` | `(auctionId, amount ASC)` for winner resolution

---

## 6. Edge Cases

- **Driver bids on their own trip** → `403 Forbidden`
- **Driver bids below minimum increment** → `400` with required increment amount
- **Driver bids equal to current best** → `400` must be lower
- **Auction already closed when bid arrives** → `410 Gone`
- **Anti-sniping: bid in last 5min** → extend 2min, increment extension counter
- **Anti-sniping: max 3 extensions reached** → no further extension, auction closes at scheduled end
- **Two identical bids from same driver** → second rejected as duplicate
- **Dutch auction: price already descended below accepted price** → `400`
- **Sealed bid: driver tries to see others' bids before close** → `403`
- **Sealed bid: winner has tied high bid** → lowest `createdAt` wins (earliest bid wins tie)
- **Auction close with no bids** → trip returns to `OPEN` status, no payment hold created
- **Driver banned during active auction** → all their active bids → `LOST`, anti-snipe extensions still apply for remaining bidders

---

## 7. Acceptance Criteria

- [ ] Open auction: driver can place a downward bid lower than current best
- [ ] Open auction: anti-sniping extends auction by 2 min if bid in last 5 min
- [ ] Open auction: maximum 3 anti-snipe extensions enforced
- [ ] Open auction: two bids at same second are ordered by server `createdAt`
- [ ] Dutch auction: driver can accept current descending price
- [ ] Dutch auction: first acceptance wins immediately
- [ ] Sealed bid auction: bids are hidden until close
- [ ] Sealed bid auction: winner is highest (lowest) bidder at close
- [ ] Auction close: winner's bid status → `WON`, trip → `ASSIGNED`
- [ ] Auction close: payment hold created for winner
- [ ] Auction close: all losing bids → `LOST`
- [ ] DRIVER cannot bid on COMPANY's auction without a trip
- [ ] DRIVER cannot bid on their own trip
- [ ] Invalid bid amounts (too high, too low) return `400`
- [ ] Bids after auction close return `410 Gone`
- [ ] Manual close: company can close auction early