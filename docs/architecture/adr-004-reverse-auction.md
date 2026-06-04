# ADR-004 — Reverse Auction Model

**Status:** Accepted
**Date:** 2026-06-04

---

## Context

Spottruck's core insight: **companies post trips, drivers compete on price.** This is the opposite of a traditional auction where bidders compete upward. We need the auction model to reflect this.

---

## Decision

**Reverse Auction (Dutch-style downward):**

- Company sets a `basePrice` (maximum they're willing to pay)
- Drivers submit bids **lower** than the current price (not higher)
- **Lowest** bid wins (or first to accept in Dutch mode)
- Anti-sniping: auction extends 2 minutes if a bid arrives in the last 5 minutes
- Maximum 3 anti-sniping extensions per auction

**Auction Types:**
| Type | Bidding Model | Winner Selection |
|------|--------------|-----------------|
| `OPEN` | Open lowering bids | Lowest bid at close |
| `DUTCH` | Price descends automatically | First to accept wins |
| `SEALED` | Hidden bids | Highest bid at close |

---

## Consequences

**Positive:**
- Natural fit for the use case — companies want lowest price
- Creates urgency — drivers want to bid first to lock in low price
- Anti-sniping prevents last-second sniping that frustrates participants

**Negative:**
- Less intuitive for new users (bidding DOWN is unusual)
- Anti-sniping rules must be very clearly explained
- Dutch auction can feel "stressful" with a descending price clock

**Mitigation:**
- Clear UI explaining "you bid lower to win"
- Countdown timer prominently displayed
- Anti-sniping shown as "auction extended" notification
- Tutorial in onboarding flow

---

## Alternatives Considered

- **Forward auction (price goes up):** Rejected — companies set the ceiling, drivers compete down naturally
- **Fixed price:** Rejected — no competition mechanism, loses the core value prop
