# Trip Auction Flow Diagram

## Complete Trip Lifecycle: Creation → Auction → Execution → Settlement

```
┌─────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│Company  │     │   Frontend   │     │   Backend API   │     │    Redis     │     │   PostgreSQL    │
└────┬────┘     └──────┬───────┘     └───────┬─────────┘     └──────┬───────┘     └───────┬─────────┘
     │                 │                      │                      │                      │
     │ ══════════════════════ PHASE 1: TRIP CREATION ════════════════════════│
     │                 │                      │                      │                      │
     │  1. Create Trip │                      │                      │                      │
     │   form data     │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  2. POST /trips      │                      │                      │
     │                 │   { origin, dest,    │                      │                      │
     │                 │    cargoType, date,  │                      │                      │
     │                 │    basePrice }       │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  3. Validate with   │                      │
     │                 │                      │     Zod schema       │                      │
     │                 │                      │                      │                      │
     │                 │                      │  4. Create trip +   │                      │
     │                 │                      │     auction record  │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │                 │                      │  5. Publish to      │                      │
     │                 │                      │     trip search     │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │  6. Trip created│                      │                      │                      │
     │   + auction     │                      │                      │                      │
     │◀────────────────│◀────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │ ══════════════════════ PHASE 2: AUCTION (REVERSE BIDDING) ══════════════════════════│
     │                 │                      │                      │                      │
     │  7. Auction     │                      │                      │                      │
     │   opens         │                      │                      │                      │
     │◀────────────────│                      │                      │                      │
     │                 │                      │                      │                      │
     │  8. Driver      │                      │                      │                      │
     │   views trips   │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  9. GET /auctions    │                      │                      │
     │                 │   ?status=OPEN       │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │  10. Fetch open     │                      │
     │                 │                      │     auctions        │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │                 │  11. Auction list   │                      │                      │
     │                 │◀─────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │                      │                      │
     │  12. Driver     │                      │                      │                      │
     │   places bid   │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  13. POST /auctions/ │                      │                      │
     │                 │       :id/bid        │                      │                      │
     │                 │   { amount }         │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  14. Validate bid:  │                      │
     │                 │                      │     - amount <      │                      │
     │                 │                      │       current       │                      │
     │                 │                      │     - min decrement │                      │
     │                 │                      │                      │                      │
     │                 │                      │  15. Check          │                      │
     │                 │                      │     anti-snipe:     │                      │
     │                 │                      │     if bid in last  │                      │
     │                 │                      │     5min → extend   │                      │
     │                 │                      │     auction +2min   │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │                 │                      │  16. Store bid     │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │                 │  17. Bid confirmed   │                      │                      │
     │                 │   (auction extended)│                      │                      │
     │                 │◀─────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │ (more bids...)  │                      │                      │                      │
     │                 │                      │                      │                      │
     │ ══════════════════════ PHASE 3: AUCTION CLOSE & ASSIGNMENT ═════════════════════════│
     │                 │                      │                      │                      │
     │                 │     ┌────────────────┼────────────────┐    │                      │
     │                 │     │ 17. AUCTION    │ CLOSES (cron)  │    │                      │
     │                 │     │   - Select     │                │    │                      │
     │                 │     │     lowest bid │                │    │                      │
     │                 │     │   - Create     │                │    │                      │
     │                 │     │     assignment│                │    │                      │
     │                 │     │   - Hold       │                │    │                      │
     │                 │     │     payment    │                │    │                      │
     │                 │     └────────────────┼────────────────┘    │                      │
     │                 │                      │                      │                      │
     │  18. Notified:  │                      │                      │                      │
     │   "You won!"    │  19. WebSocket      │                      │                      │
     │◀────────────────│◀────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │ ══════════════════════ PHASE 4: PAYMENT HOLD ══════════════════════════════════════│
     │                 │                      │                      │                      │
     │  20. Payment    │                      │                      │                      │
     │   initiated    │                      │                      │                      │
     │◀────────────────│                      │                      │                      │
     │                 │  21. POST /payments/ │                      │                      │
     │                 │       hold          │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  22. MercadoPago   │                      │
     │                 │                      │     POST /payments  │                      │
     │                 │                      │─────────────────────────────▶MercadoPago API
     │                 │                      │                      │                      │
     │                 │                      │  23. Payment held  │                      │
     │                 │                      │     (8% commission)│                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │  24. Payment    │                      │                      │                      │
     │   held          │                      │                      │                      │
     │◀────────────────│◀────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │ ══════════════════════ PHASE 5: TRIP EXECUTION ════════════════════════════════════│
     │                 │                      │                      │                      │
     │                 │                      │  25. Trip status:   │                      │
     │                 │                      │     IN_PROGRESS     │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │  26. GPS updates│                      │                      │                      │
     │   (WebSocket)   │                      │                      │                      │
     │◀────────────────│◀────────────────────│◀─────────────────────│                      │
     │                 │                      │                      │                      │
     │                 │  27. GET /tracking/ │                      │                      │
     │                 │       :tripId        │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │  28. Fetch from     │                      │
     │                 │                      │     Redis (latest) │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │  29. Track on   │                      │                      │                      │
     │   map           │                      │                      │                      │
     │◀────────────────│◀─────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │  30. Delivery   │                      │                      │                      │
     │   confirmed    │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  31. POST /trips/   │                      │                      │
     │                 │       :id/confirm   │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  32. Trip status:   │                      │
     │                 │                      │     DELIVERED       │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │ ══════════════════════ PHASE 6: PAYMENT RELEASE ══════════════════════════════════│
     │                 │                      │                      │                      │
     │  33. Company    │                      │                      │                      │
     │   confirms      │                      │                      │                      │
     │   delivery      │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  34. POST /payments/ │                      │                      │
     │                 │       release       │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  35. Release hold: │                      │
     │                 │                      │     - 92% to driver │                      │
     │                 │                      │     - 8% platform   │                      │
     │                 │                      │─────────────────────────────▶MercadoPago API
     │                 │                      │                      │                      │
     │                 │                      │  36. Payment       │                      │
     │                 │                      │     released       │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │  37. Settlement │                      │                      │                      │
     │   confirmed     │                      │                      │                      │
     │◀────────────────│◀─────────────────────│                      │                      │
     │                 │                      │                      │                      │
     │ ══════════════════════ PHASE 7: RATINGS ══════════════════════════════════════════│
     │                 │                      │                      │                      │
     │  38. Rate       │                      │                      │                      │
     │   driver        │                      │                      │                      │
     │────────────────▶│                      │                      │                      │
     │                 │  39. POST /ratings   │                      │                      │
     │                 │   { tripId, score,   │                      │                      │
     │                 │    comment }         │                      │                      │
     │                 │─────────────────────▶│                      │                      │
     │                 │                      │                      │                      │
     │                 │                      │  40. Store rating  │                      │
     │                 │                      │─────────────────────▶│─────────────────────▶│
     │                 │                      │                      │                      │
     │                 │                      │  41. Update trust  │                      │
     │                 │                      │     score (async)  │                      │
     │                 │                      │─────────────────────▶│                      │
     │                 │                      │                      │                      │
     │  42. Rating     │                      │                      │                      │
     │   submitted     │                      │                      │                      │
     │◀────────────────│◀─────────────────────│                      │                      │
     │                 │                      │                      │                      │
```

## Trip Status State Machine

```
           ┌────────────────────────────────────────────────────────────────────┐
           │                                                                    │
           │    ┌──────┐                                                         │
           │    │DRAFT │                                                         │
           │    └──┬───┘                                                         │
           │       │ company saves but doesn't publish                           │
           │       ▼                                                             │
           │    ┌──────┐     auction starts      ┌─────────┐                    │
           │    │OPEN  │────────────────────────▶│ CLOSED  │                    │
           │    └──┬───┘                         └───┬─────┘                    │
           │       │ no bids after timeout            │ winner selected          │
           │       ▼                                  ▼                           │
           │    ┌───────┐                     ┌──────────┐                      │
           │    │EXPIRED│                     │ ASSIGNED │                      │
           │    └───────┘                     └────┬─────┘                      │
           │                                     │ payment held               │
           │                                     ▼                             │
           │                            ┌─────────────┐                        │
           │                            │ IN_PROGRESS │◀───┐                    │
           │                            └──────┬──────┘    │                    │
           │                                   │            │                    │
           │                                   │ trip       │ company            │
           │                                   │ complete   │ confirms           │
           │                                   ▼            │ delivery           │
           │                           ┌───────────┐        │                    │
           │                           │ DELIVERED │────────┘                    │
           │                           └─────┬─────┘                             │
           │                                 │ payment                          │
           │                                 │ released                         │
           │                                 ▼                                  │
           │                           ┌─────────┐                              │
           │                           │SETTLED │                               │
           │                           └─────────┘                              │
           │                                                                    │
           └────────────────────────────────────────────────────────────────────┘

           Any state can transition to CANCELLED (with penalties per Business Rules)
```

## Anti-Sniping Detail

```
┌─────────────────────────────────────────────────────────────────┐
│              Anti-Sniping Mechanism                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Auction timeline:                                              │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  10:00 ─────────────────────────────────────────────────────▶  │
│         ▲                                                       │
│         │ 14:55                                                 │
│         │                                                       │
│    Auction    │ 14:56          14:58      15:00                 │
│    starts     │    │              │          │                 │
│                │    │  Driver B   │ Driver A │                 │
│                │    │  bids $90k  │ bids $88k│                 │
│                │    │    │        │    │     │                 │
│                │    │    │  ┌─────┘    │     │                 │
│                │    │    │  │  +2min   │     │                 │
│                │    │    │  │  extends │     │                 │
│                │    │    │  ▼         ▼     ▼                 │
│  14:00 ───────┴────┴────┴──┴──────────┴─────┴─────────────▶  │
│       ▲                                         ▲              │
│       │                                         │              │
│       │              15:02                       │              │
│  Bid in       +2min extension if bid in  ───────┘              │
│  last 5min   last 5min of auction                        │
│  window      (anti-snipe trigger)                            │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  Rules:                                                         │
│  • If bid placed within 5 minutes of end time                  │
│  • Auction extends by 2 minutes                                │
│  • Maximum 10 extensions per auction                           │
│  • Minimum bid decrement: 1% of current price                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```