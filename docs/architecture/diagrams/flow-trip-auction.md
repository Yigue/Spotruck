# Spottruck — Trip + Auction Flow

```
Empresa                    Backend                    Camionero(s)
   │                           │                           │
   │                           │                           │
   │──POST /trips─────────────▶│                           │
   │  {origin, dest, cargo,    │                           │
   │   scheduledDate, price}   │                           │
   │                           │                           │
   │                           │──Trip stored (status=DRAFT)
   │◀──201 {trip}──────────────│                           │
   │                           │                           │
   │──POST /trips/:id (publish)▶│                          │
   │                           │                           │
   │                           │──status → OPEN───────────▶│ (polling/WS)
   │                           │                           │
   │                           │                           │
   │──POST /auctions──────────▶│                           │
   │  {tripId, type=OPEN}     │                           │
   │                           │                           │
   │                           │──Auction created (OPEN)   │
   │                           │──status → AUCTION────────▶│
   │◀──201 {auction}──────────│                           │
   │                           │                           │
   │                           │◀──POST /auctions/:id/bid──│
   │                           │  {amount: 38000}         │
   │                           │                           │
   │                           │──Anti-sniping check:      │
   │                           │  timeLeft < 5min?        │
   │                           │  → extend 2min           │
   │                           │──currentPrice = 38000    │
   │                           │                           │
   │                           │◀──201 {bid, newPrice}────│
   │◀──WS: price updated───▶ │                           │
   │                           │                           │
   │                           │◀──POST /auctions/:id/bid──│
   │                           │  {amount: 35000}         │
   │                           │◀──201 {bid}─────────────│
   │                           │                           │
   │◀──WS: price updated──────│                           │
   │                           │                           │
   │        [more bids...]     │                           │
   │                           │                           │
   │                           │                           │
   │                           │ [Auction Cron — 60s tick] │
   │                           │──auction.status=OPEN      │
   │                           │──endTime < now?           │
   │                           │──winner = lowest bid     │
   │                           │                           │
   │                           │──status → SETTLED        │
   │                           │──status → ASSIGNED       │
   │                           │──Payment Hold created     │
   │                           │                           │
   │◀──WS: auction closed──────│                           │
   │  winner: {name, price}    │                           │
   │                           │                           │
   │                           │                           │
   │                           │                           │
   │──POST /tracking/:tripId──▶│◀──POST /tracking/:tripId─│
   │  {lat, lng, speed}        │  {lat, lng, speed}        │
   │                           │                           │
   │                           │──trip.status ASSIGNED→    │
   │                           │  IN_PROGRESS             │
   │                           │                           │
   │◀──WS: truck en route──────│                           │
   │                           │                           │
   │                           │                           │
   │──POST /payments/release──▶│                           │
   │  {tripId}                │                           │
   │                           │──payment.status HELD→     │
   │                           │  RELEASED                │
   │                           │──trip.status → SETTLED    │
   │                           │                           │
   │                           │                           │
   │──POST /ratings───────────▶│                           │
   │  {toUserId, score, ...}  │                           │
   │                           │                           │
   │                           │──ratingAvg recalculated  │
   │                           │──trustScore recalculated │
   │                           │                           │
   │                           │◀──POST /ratings──────────│
   │                           │  {toUserId, score, ...}  │
   │                           │                           │
   │                           │──trustScore recalculated │
   │                           │                           │
```
