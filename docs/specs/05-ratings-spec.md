# SPEC: Ratings & Trust

## 1. Feature

**Ratings & Trust** — Bidirectional rating system after trip delivery. Trust score calculated from rating history and trip participation.

---

## 2. User Story

> **COMO** empresa y transportista **QUIERO** calificarnos mutuamente **PARA** construir confianza en la plataforma

---

## 3. Behavior

### 3.1 Rating Submission

- After a trip reaches `DELIVERED` status, both company and driver may submit a rating
- One rating per trip per direction (unique constraint: `tripId + raterId`)
- Rating window: within **7 days** of delivery
- Scores: 1–5 (integer) for overall rating
- Optional sub-scores: `punctuality`, `communication`, `cargoCondition` (1–5 each)

### 3.2 Trust Score (Elo-like)

Calculated per user (driver or company) as:

```
trustScore = weightedAverage(
  avgRating = average of all overall scores,
  ratingCount = number of ratings received,
  tripsCompleted = number of trips with status DELIVERED or SETTLED
)
```

Formula:
```
score = (avgRating × 0.5) + (min(ratingCount / 10, 1) × 2.5) + (min(tripsCompleted / 50, 1) × 2.0)
```

Ranges 0–5, displayed to 1 decimal place. Updates on each new rating.

### 3.3 Visibility

- A user's trust score is public (displayed on profiles)
- Individual ratings are visible on the rated user's profile (latest 10)
- Rater identity is visible to the rated user
- Sub-scores are visible only to rated user (not public)

---

## 4. API Contract

### POST /ratings

**Auth:** COMPANY or DRIVER

**Request:**
```json
{
  "tripId": "uuid",
  "score": 5,
  "punctuality": 4,
  "communication": 5,
  "cargoCondition": 5,
  "comment": "Excellent driver, on time and careful with cargo."
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "raterId": "uuid",
  "ratedId": "uuid",
  "tripId": "uuid",
  "score": 5,
  "punctuality": 4,
  "communication": 5,
  "cargoCondition": 5,
  "comment": "Excellent driver, on time and careful with cargo.",
  "createdAt": "2026-06-04T15:00:00Z"
}
```

**Errors:** `400` score out of range, sub-scores out of range | `401` | `403` not participant | `404` trip not found | `409` already rated this trip | `410` outside 7-day window

---

### GET /ratings/user/:userId

**Auth:** Any authenticated user

**Query Params:** `page`, `limit`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "raterId": "uuid",
      "raterRole": "COMPANY",
      "score": 5,
      "punctuality": 4,
      "communication": 5,
      "cargoCondition": 5,
      "comment": "Excellent driver, on time and careful with cargo.",
      "createdAt": "2026-06-04T15:00:00Z"
    }
  ],
  "summary": {
    "trustScore": 4.7,
    "avgRating": 4.5,
    "ratingCount": 12,
    "tripsCompleted": 28
  },
  "pagination": { "page": 1, "limit": 10, "total": 12, "pages": 2 }
}
```

**Note:** Sub-scores (`punctuality`, `communication`, `cargoCondition`) only shown to the rated user themselves.

---

### GET /ratings/trip/:tripId

**Auth:** COMPANY or DRIVER (must be participant)

**Response `200`:**
```json
{
  "companyRating": {
    "id": "uuid",
    "score": 4,
    "comment": "Good trip"
  },
  "driverRating": {
    "id": "uuid",
    "score": 5,
    "comment": "Excellent driver"
  }
}
```

**Errors:** `403` not a participant

---

## 5. Data Model

### Rating

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID | PK |
| `raterId` | UUID | FK → User |
| `ratedId` | UUID | FK → User |
| `tripId` | UUID | FK → Trip |
| `score` | int | not null, 1–5 |
| `punctuality` | int? | nullable, 1–5 |
| `communication` | int? | nullable, 1–5 |
| `cargoCondition` | int? | nullable, 1–5 |
| `comment` | string? | nullable, max 1000 chars |
| `createdAt` | DateTime | auto |

**Constraints:** Unique together `(tripId, raterId)` — one rating per trip per direction

**Indexes:** `ratedId` | `raterId` | `tripId`

---

## 6. Edge Cases

- **User rates before trip is DELIVERED** → `403` (trip not in deliverable state)
- **User rates after 7-day window** → `410 Gone`
- **User tries to rate same trip twice** → `409 Conflict`
- **User tries to rate themselves** → `403 Forbidden`
- **User rates non-participant** → `403 Forbidden`
- **Sub-score out of 1–5 range** → `400` validation error
- **Comment exceeds 1000 chars** → `400` validation error
- **Trust score calculation with zero ratings** → default `0.0`
- **User with no trips completed** → tripsCompleted component = 0
- **Trip cancelled before delivery** → rating not allowed (only DELIVERED trips)

---

## 7. Acceptance Criteria

- [ ] Only DELIVERED trips are ratable
- [ ] Rating window is 7 days from delivery timestamp
- [ ] Each user can submit exactly one rating per trip (direction: rater→rated)
- [ ] Score must be 1–5; sub-scores optional but must be 1–5 if provided
- [ ] Comment is optional and max 1000 characters
- [ ] Trust score is recalculated after each new rating
- [ ] Trust score formula correctly weighs avgRating, ratingCount, and tripsCompleted
- [ ] Trust score is public on user profile
- [ ] Company can rate driver (and vice versa) for the same trip
- [ ] Sub-scores (punctuality, communication, cargoCondition) are only visible to the rated user
- [ ] GET /ratings/user/:id returns latest 10 ratings + summary
- [ ] Duplicate rating attempt returns `409`
- [ ] Rating outside time window returns `410`
- [ ] Self-rating returns `403`
- [ ] Non-participant cannot rate a trip