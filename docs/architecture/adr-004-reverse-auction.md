# ADR-004: Reverse Auction Model

**Status:** Accepted  
**Date:** 2026-06-04

## Context

Spottruck connects **companies** (shippers) with **drivers** (carriers) for cargo transport. The business model requires:

- **Companies post trips**: Origin, destination, cargo type, date, base price
- **Drivers compete**: Multiple drivers bid to win the job
- **Price goes DOWN**: Like a Dutch auction, drivers underbid each other

Traditional forward auction (highest price wins) doesn't fit:
- Companies have fixed budgets
- Supply of trucks exceeds demand in many routes
- Drivers need to fill return trips economically

## Decision

We implement a **Reverse Auction** model where:

1. **Company creates trip** with a `basePrice` (maximum they're willing to pay)
2. **Auction opens** at `basePrice`
3. **Drivers bid DOWN**: Each bid must be lower than current price
4. **Anti-sniping rules** prevent last-second bids
5. **Lowest unique bid wins** (or lowest bid with tiebreakers)

```
┌─────────────────────────────────────────────────────────────────┐
│                   Reverse Auction Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Company creates trip: basePrice = $100,000                     │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  AUCTION OPENS @ $100,000                               │    │
│  │                                                         │    │
│  │  Driver A bids: $95,000  ──▶ Current: $95,000          │    │
│  │         │                                               │    │
│  │  Driver B bids: $90,000  ──▶ Current: $90,000          │    │
│  │         │                                               │    │
│  │  Driver C bids: $88,000  ──▶ Current: $88,000          │    │
│  │         │                                               │    │
│  │  Driver A bids: $87,000  ──▶ Current: $87,000  ⏰       │    │
│  │                           (anti-snipe: extends time)    │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│  AUCTION CLOSES ──▶ Winner: Driver A @ $87,000                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Anti-Sniping Rules

To prevent drivers from gaming the auction with last-second bids:

| Rule | Value | Rationale |
|------|-------|-----------|
| Anti-snipe window | Last 5 minutes | Prevents sniping |
| Auto-extend | +2 minutes per bid | Allows counter-bids |
| Maximum extensions | 10 per auction | Prevents infinite extension |
| Minimum bid decrement | basePrice × 1% | Prevents tiny increments |

### Bid Validation Rules

```typescript
interface Bid {
  auctionId: string;
  driverId: string;
  amount: number;          // Must be < currentPrice
  timestamp: Date;
}

// Validation
const MINIMUM_BID_DECREMENT = 0.01; // 1% of current price
const ANTI_SNIPE_WINDOW_MINUTES = 5;
const ANTI_SNIPE_EXTENSION_MINUTES = 2;
const MAX_EXTENSIONS = 10;

function isValidBid(currentPrice: number, bidAmount: number, auction: Auction): boolean {
  // Bid must be lower
  if (bidAmount >= currentPrice) return false;

  // Must exceed minimum decrement
  const minAllowed = currentPrice * (1 - MINIMUM_BID_DECREMENT);
  if (bidAmount < minAllowed) return false;

  return true;
}
```

### Auction States

```
DRAFT ──▶ OPEN ──▶ CLOSED ──▶ ASSIGNED ──▶ IN_PROGRESS ──▶ DELIVERED ──▶ SETTLED
 │       │                              │
 │       │                              └─▶ CANCELLED
 │       └─▶ EXPIRED (no bids)
 └─▶ CANCELLED (company cancels before opening)
```

### Winner Selection Algorithm

When auction closes:

1. Select lowest bid amount
2. If tie: driver with fewer active trips wins
3. If still tie: earliest bid wins
4. If driver is unresponsive (24h): next lowest bid wins

## Consequences

### Positive
- **Market efficiency**: Price discovery happens naturally
- **Driver motivation**: Compete on price to win jobs
- **Company benefit**: Get competitive rates
- **Anti-sniping**: Fair chance for all drivers

### Negative
- **Complexity**: More complex than fixed pricing
- **Risk of collusion**: Drivers could coordinate (monitor for this)
- **Undercutting**: Race to bottom may harm driver earnings
- **Bid manipulation**: Fake bids to drive prices up (detect & ban)

### Tie-Breaking Rules

| Rank | Criterion | Weight |
|------|-----------|--------|
| 1 | Lowest bid amount | Primary |
| 2 | Driver trust score | Secondary |
| 3 | Earliest bid timestamp | Tertiary |

## References

- [Reverse Auction Wikipedia](https://en.wikipedia.org/wiki/Reverse_auction)
- [Anti-Sniping Auction Strategies](https://www.ebay.com/sch/antisnipe)
- [Dutch Auction Wikipedia](https://en.wikipedia.org/wiki/Dutch_auction)