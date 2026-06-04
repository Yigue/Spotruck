# SPEC: Payment & Settlement

## 1. Feature

**Payment & Settlement** — Platform fee collection via holds, release on delivery confirmation, penalties for cancellations, and refunds.

---

## 2. User Story

> **COMO** plataforma **QUIERO** gestionar pagos y liquidaciones **PARA** garantizar transparencia financiera entre empresas y transportistas

---

## 3. Behavior

### 3.1 Payment Hold

When an auction closes and a winner is determined:
1. A `Payment` record is created with status `HELD`
2. The full trip `price` is the gross amount
3. Platform fee of **8%** is calculated and held
4. Driver's net amount = `price - platformFee`
5. Funds are not transferred — only "held" (reserved) at this stage

### 3.2 Payment Release

When the company confirms delivery (`trip.status → DELIVERED`):
1. Payment status → `RELEASED`
2. Driver receives `netAmount` (price − 8% fee)
3. Platform fee retained by Spottruck
4. Trip status → `SETTLED`

### 3.3 Cancellation Penalties

Penalty rates depend on when cancellation occurs relative to `scheduledDate`:

| Timing | Penalty |
|---|---|
| > 24h before scheduled | 10% of trip price |
| 12–24h before scheduled | 20% of trip price |
| < 12h before scheduled | 30% of trip price |

**Who pays:**
- **Company cancels before pickup** → company pays penalty to driver (compensate for，空跑)
- **Driver cancels before pickup** → driver pays penalty to company (loses hold + additional fee)
- **Company cancels after IN_PROGRESS** → driver still gets paid in full (no penalty)
- **Force majeure** (system-defined) → full refund, no penalty

Penalty creates a separate `Payment` record with `type: PENALTY`.

### 3.4 Refunds

When a trip is cancelled and a `HELD` payment exists:
- If cancelled before delivery confirmation: payment `status → REFUNDED`
- Refund returns held amount to originating account
- Platform fee is not refunded (retained by platform for processing costs)

### 3.5 Disputes

- Either party can open a dispute within **72 hours** of delivery
- Dispute suspends final settlement
- `status → DISPUTED`; resolution by admin sets final status

---

## 4. API Contract

### GET /payments/:tripId

**Auth:** COMPANY (own trip) or DRIVER (own payment)

**Response `200`:**
```json
{
  "id": "uuid",
  "tripId": "uuid",
  "amount": 15000.00,
  "platformFee": 1200.00,
  "netAmount": 13800.00,
  "status": "HELD",
  "type": "TRIP",
  "createdAt": "2026-06-04T12:00:00Z",
  "updatedAt": "2026-06-04T12:00:00Z"
}
```

---

### POST /payments/:tripId/confirm-delivery

**Auth:** COMPANY only (own trip)

**Behavior:** Confirms delivery, releases payment to driver

**Response `200`:**
```json
{
  "id": "uuid",
  "status": "RELEASED",
  "netAmount": 13800.00,
  "platformFee": 1200.00
}
```

**Errors:** `400` trip not in ASSIGNED/IN_PROGRESS | `403` not owner | `404`

---

### POST /payments/:tripId/cancel

**Auth:** COMPANY or DRIVER (own trip participation)

**Request:**
```json
{
  "reason": "Vehicle breakdown"
}
```

**Response `200`:**
```json
{
  "id": "uuid",
  "status": "REFUNDED",
  "penalty": {
    "amount": 1500.00,
    "type": "COMPANY_CANCELLATION",
    "paidBy": "COMPANY"
  }
}
```

**Errors:** `400` trip already delivered/settled | `403` | `404`

---

### POST /payments/:tripId/dispute

**Auth:** COMPANY or DRIVER

**Request:**
```json
{
  "reason": "Cargo arrived damaged",
  "evidence": "photos URL or description"
}
```

**Response `200`:**
```json
{
  "id": "uuid",
  "status": "DISPUTED",
  "disputeReason": "Cargo arrived damaged"
}
```

**Errors:** `400` outside 72h window | `403` | `404`

---

## 5. Data Model

### Payment

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `tripId` | UUID | FK → Trip |
| `driverId` | UUID | FK → User |
| `companyId` | UUID | FK → User |
| `amount` | decimal | not null, > 0 |
| `platformFee` | decimal | not null, = amount × 0.08 |
| `netAmount` | decimal | not null, = amount − platformFee |
| `type` | enum | `TRIP`, `PENALTY`, `REFUND` |
| `status` | enum | `PENDING`, `HELD`, `RELEASED`, `REFUNDED`, `DISPUTED` |
| `penaltyRate` | decimal? | nullable, e.g., 0.10 |
| `paidBy` | enum? | `COMPANY`, `DRIVER` (for PENALTY type) |
| `disputeReason` | string? | nullable |
| `createdAt` | DateTime | auto |
| `updatedAt` | DateTime | auto-update |

**Indexes:** `tripId` (unique for TRIP type) | `driverId` | `companyId` | `status`

---

## 6. Edge Cases

- **Payment hold fails (payment gateway error)** → transaction rollback, auction remains OPEN, user notified
- **Company confirms delivery but driver already cancelled** → `400` invalid transition
- **Dispute filed after 72h window** → `400` with clear error message
- **Trip cancelled but no payment held** → no-op, still process cancellation
- **Driver cancels, HELD payment insufficient for penalty** → partial hold seized, remainder written off (future enhancement: debt tracking)
- **Company confirms delivery for wrong trip** → `403` not owner
- **Disputed payment cannot be released until admin resolves** → status stays `DISPUTED`
- **Penalty calculation rounds fractional cents** → round to 2 decimal places, always in platform's favor

---

## 7. Acceptance Criteria

- [ ] Payment is created and held (status `HELD`) when auction closes with a winner
- [ ] Platform fee of 8% is calculated correctly on each payment
- [ ] Company confirming delivery releases payment to driver (status `RELEASED`)
- [ ] Trip status transitions to `SETTLED` on payment release
- [ ] Company cancellation > 24h before scheduled → 10% penalty
- [ ] Company cancellation 12–24h before scheduled → 20% penalty
- [ ] Company cancellation < 12h before scheduled → 30% penalty
- [ ] Driver cancellation before pickup → penalized per tier
- [ ] Cancellation with active HELD payment → payment status → `REFUNDED`
- [ ] Refund excludes platform fee (fee retained)
- [ ] Dispute filed within 72h of delivery → status `DISPUTED`, settlement suspended
- [ ] Dispute resolved by admin → correct final status set
- [ ] GET /payments/:tripId returns correct fee breakdown for both parties
- [ ] Payment records are immutable except for status and dispute fields