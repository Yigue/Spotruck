---
title: "Spottruck - Edge Cases Analysis"
date: 2026-06-03
author: "Jarvis Agent"
status: "completed"
tags: ["spottruck", "edge-cases", "failure-modes", "circuit-breakers", "resilience"]
---

# Spottruck - Edge Cases Analysis

## 1. Introduction

**Purpose:** This document catalogs critical edge cases, failure modes, and resilience patterns for the Spottruck platform. It serves as a reference for development, testing, and operational procedures.

**Scope:** Covers system failures, business logic edge cases, concurrency issues, data consistency scenarios, and circuit breaker patterns.

---

## 2. Auction Edge Cases

### 2.1 Bid Conflicts

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              BID CONFLICT SCENARIOS                                                ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   SCENARIO: Two drivers place bids at the exact same timestamp                                    ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  Detection:                                                                                 │ ║
║   │  ─────────                                                                                  │ ║
║   │  • Database UNIQUE constraint on (auction_id, driver_id) for non-auto-bids                  │ ║
║   │  • Optimistic locking with version field on bids table                                      │ ║
║   │  • Race condition detected via INSERT failure                                                │ ║
║   │                                                                                             │ ║
║   │  Resolution:                                                                                │ ║
║   │  ─────────                                                                                  │ ║
║   │  • Accept first successful INSERT (by database timestamp)                                    │ ║
║   │  • Reject second bid with HTTP 409 Conflict                                                  │ ║
║   │  • Return error: "Another bid was placed at the same time. Please retry."                   │ ║
║   │                                                                                             │ ║
║   │  Code Pattern:                                                                              │ ║
║   │  ─────────────                                                                              │ ║
║   │  try {                                                                                      │ ║
║   │      INSERT INTO bids (auction_id, driver_id, amount) VALUES (?, ?, ?);                    │ ║
║   │  } catch (UniqueViolationException e) {                                                    │ ║
║   │      throw new BidConflictException("Another bid was placed at the same time");             │ ║
║   │  }                                                                                          │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
║   SCENARIO: Auto-bid and manual bid at the same time                                              ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  Detection:                                                                                 │ ║
║   │  • Auto-bid has auto_bid = TRUE flag                                                        │ ║
║   │  • System processes auto-bids first, then manual bids                                       │ ║
║   │                                                                                             │ ║
║   │  Resolution:                                                                                │ ║
║   │  • If auto-bid wins, manual bid rejected with "Auction price updated"                        │ ║
║   │  • If manual bid is higher, auto-bid may trigger again (if within budget)                  │ ║
║   │                                                                                             │ ║
║   │  Edge: Auto-bid max_amount equals manual bid amount                                         │ ║
║   │  • Manual bid accepted (user explicitly chose higher amount)                                │ ║
║   │  • Auto-bid record stays but is inactive for this auction                                  │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 2.2 Auction Timing Edge Cases

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUCTION TIMING EDGE CASES                                         │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   CASE: Clock skew between servers                                                            │
│   ──────────────────────────────────────────────────────────────────────────────────────────   │
│   Problem: App server time differs from database server time                                 │
│   Solution:                                                                                  │
│   • All auction timing uses database server time (NOW())                                     │
│   • Cron job checks: `WHERE end_time <= NOW()` instead of application calculated             │
│   • Buffer of 5 seconds added to prevent race conditions                                     │
│                                                                                              │
│   CASE: Bid in final 2 minutes extends auction                                               │
│   ──────────────────────────────────────────────────────────────────────────────────────────   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │  ANTI-SNIPE LOGIC                                                                      │   │
│   │                                                                                        │   │
│   │  IF auction.time_remaining < 2 MINUTES THEN                                             │   │
│   │      new_end_time = auction.end_time + 5 MINUTES                                        │   │
│   │      SET auction.end_time = new_end_time                                                │   │
│   │      extension_count++                                                                  │   │
│   │      IF extension_count >= 3 THEN                                                        │   │
│   │          -- Stop extending, allow natural close                                         │   │
│   │          SET no_more_extensions = TRUE                                                  │   │
│   │      END IF                                                                             │   │
│   │      CREATE notification "Auction extended"                                            │   │
│   │  END IF                                                                                 │   │
│   └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│   CASE: Auction ends with no bids                                                            │
│   ──────────────────────────────────────────────────────────────────────────────────────────   │
│   • Status remains PENDING (company can relist or cancel)                                    │
│   • No winner determination                                                                  │
│   • Notify company: "Auction ended with no bids. What would you like to do?"                 │
│                                                                                              │
│   CASE: Auction ends with reserve not met                                                    │
│   ──────────────────────────────────────────────────────────────────────────────────────────   │
│   • Auction status = CLOSED                                                                   │
│   • winner_id = NULL                                                                          │
│   • Notify all bidders: "Reserve price was not met"                                          │
│   • Company receives: "Your reserve was not met. Consider adjusting or relisting"            │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Payment Edge Cases

### 3.1 Payment Failures

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              PAYMENT FAILURE SCENARIOS                                            ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   CASE: MercadoPago API timeout during payment processing                                       ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                             │ ║
║   │   BEFORE: payment.status = 'pending'                                                       │ ║
║   │                                                                                             │ ║
║   │   ON API timeout:                                                                          │ ║
║   │   • Do NOT set status to 'failed' immediately                                             │ ║
║   │   • Set status = 'processing'                                                             │ ║
║   │   • Create idempotency_key for retry                                                       │ ║
║   │   • Schedule retry job (exponential backoff: 1m, 5m, 30m, 2h, 24h)                        │ ║
║   │   • After max retries: mark as 'failed' with reason "payment_provider_timeout"           │ ║
║   │                                                                                             │ ║
║   │   RECOVERY:                                                                                │ ║
║   │   • Cron job checks payments with status = 'processing' AND created_at < NOW() - 1h     │ ║
║   │   • Query MercadoPago API for transaction status using stored idempotency_key            │ ║
║   │   • Update accordingly (in_escrow, failed)                                                │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
║   CASE: Card declined (insufficient funds)                                                       ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                             │ ║
║   │   MercadoPago response:                                                                    │ ║
║   │   • status = 400 Bad Request                                                               │ ║
║   │   • code = "CC_REJECTED"                                                                   │ ║
║   │   • detail = "Insufficient funds"                                                         │ ║
║   │                                                                                             │ ║
║   │   Action:                                                                                 │ ║
║   │   • payment.status = 'failed'                                                            │ ║
║   │   • payment.failure_reason = "Payment declined: insufficient funds"                        │ ║
║   │   • Notify company: "Your payment was declined. Please update payment method."           │ ║
║   │   • Trip status remains ASSIGNED (not yet IN_PROGRESS)                                     │ ║
║   │   • Company has 48h to update payment method before auto-cancellation                     │ ║
║   │                                                                                             │ ║
║   │   Prevention:                                                                              │ ║
║   │   • Use pre-authorization before confirming trip assignment                                │ ║
║   │   • Store multiple payment methods                                                         │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
║   CASE: Payment succeeds but database commit fails                                              ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                             │ ║
║   │   Problem: Payment processor confirmed, but local DB commit fails                          │ ║
║   │                                                                                             │ ║
║   │   Solution: Two-phase commit pattern                                                        │ ║
║   │   • Phase 1: Create payment with status='pending' + idempotency_key                       │ ║
║   │   • Phase 2: Call payment processor                                                        │ ║
║   │   • Phase 3: On success, update status='in_escrow' in same transaction                     │ ║
║   │   • Phase 4: If commit fails, call payment processor REFUND immediately                    │ ║
║   │                                                                                             │ ║
║   │   Code:                                                                                    │ ║
║   │   BEGIN TRANSACTION                                                                        │ ║
║   │       UPDATE payments SET status='in_escrow' WHERE id=? AND status='pending'               │ ║
║   │       UPDATE trips SET payment_status='in_escrow' WHERE id=?                              │ ║
║   │   COMMIT  -- If this fails, trigger refund                                                 │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 3.2 Refund Edge Cases

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              REFUND EDGE CASES                                               │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   CASE: Cancel before trip starts (full refund)                                              │
│   ──────────────────────────────────────────────────────────────────────────────────────────   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │  IF trip.status IN ('PENDING', 'ASSIGNED') AND                                            │   │
│   │     NOW() < trip.departure_date - 24 HOURS THEN                                           │   │
│   │                                                                                        │   │
│   │     refund_amount = payment.amount  -- 100%                                             │   │
│   │     payment.status = 'refunded'                                                         │   │
│   │     mercadopago.refund(payment.mp_id, refund_amount)                                    │   │
│   │     trip.status = 'cancelled'                                                           │   │
│   │     trip.cancellation_reason = 'company_cancelled_before_start'                          │   │
│   │  END IF                                                                                │   │
│   └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│   CASE: Cancel within 24h of departure (50% penalty)                                          │
│   ──────────────────────────────────────────────────────────────────────────────────────────   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │  IF trip.status IN ('PENDING', 'ASSIGNED') AND                                            │   │
│   │     NOW() >= trip.departure_date - 24 HOURS THEN                                          │   │
│   │                                                                                        │   │
│   │     refund_amount = payment.amount * 0.50  -- 50% retained as penalty                   │   │
│   │     platform_commission += payment.amount * 0.50                                         │   │
│   │     payment.status = 'refunded'                                                          │   │
│   │     mercadopago.refund(payment.mp_id, refund_amount)                                    │   │
│   │     trip.status = 'cancelled'                                                           │   │
│   │     trip.cancellation_reason = 'company_cancelled_within_24h'                           │   │
│   │  END IF                                                                                │   │
│   └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│   CASE: Driver no-show (no refund to company, driver penalized)                               │
│   ──────────────────────────────────────────────────────────────────────────────────────────   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │  IF trip.status = 'ASSIGNED' AND trip.departure_time < NOW() - 30 MINUTES AND           │   │
│   │     trip.driver_id confirmed NOT arrived THEN                                           │   │
│   │                                                                                        │   │
│   │     -- Company gets full refund                                                          │   │
│   │     refund_amount = payment.amount                                                      │   │
│   │     mercadopago.refund(payment.mp_id, refund_amount)                                   │   │
│   │                                                                                        │   │
│   │     -- Driver penalized                                                                  │   │
│   │     driver.cancellation_strikes += 1                                                    │   │
│   │     IF driver.cancellation_strikes >= 3 THEN                                             │   │
│   │         driver.status = 'suspended'                                                     │   │
│   │     END IF                                                                             │   │
│   │                                                                                        │   │
│   │     trip.status = 'cancelled'                                                          │   │
│   │     trip.cancellation_reason = 'driver_no_show'                                         │   │
│   │  END IF                                                                                │   │
│   └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Concurrency Edge Cases

### 4.1 Race Conditions

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              CONCURRENCY RACE CONDITIONS                                          ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   CASE: Same offer accepted by two companies                                                     ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   Problem: Two companies try to accept the same offer simultaneously                             ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  Prevention:                                                                                 │ ║
║   │  ──────────                                                                                  │ ║
║   │  • offer.status has UNIQUE constraint via trigger                                          │ ║
║   │  • UPDATE offers SET status='accepted' WHERE id=? AND status='pending'                      │ ║
║   │  • If rows_affected = 0, offer was already accepted                                         │ ║
║   │                                                                                             │ ║
║   │  Resolution:                                                                                │ ║
║   │  • Second company receives HTTP 409: "Offer already accepted by another company"            │ ║
║   │  • Offer removed from second company's inbox                                                │ ║
║   │  • Second company can search for other offers                                               │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
║   CASE: Driver assigned to two trips simultaneously                                               ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  Prevention:                                                                                 │ ║
║   │  • Driver can only have ONE active trip at a time (status IN ('ASSIGNED', 'IN_PROGRESS'))  │ ║
║   │  • Before assignment, check:                                                                 │ ║
║   │    SELECT COUNT(*) FROM trips                                                                │ ║
║   │    WHERE driver_id = ? AND status IN ('ASSIGNED', 'IN_PROGRESS')                          │ ║
║   │                                                                                             │ ║
║   │  If count > 0:                                                                              │ ║
║   │    • Reject assignment with "Driver already has an active trip"                             │ ║
║   │    • Suggest next best driver based on scoring                                              │ ║
║   │                                                                                             │ ║
║   │  Database-level prevention:                                                                 │ ║
║   │  • Partial unique index: CREATE UNIQUE INDEX idx_driver_active_trip                         │ ║
║   │    ON trips(driver_id) WHERE status IN ('ASSIGNED', 'IN_PROGRESS')                        │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
║   CASE: Double rating submission                                                                  ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  Prevention:                                                                                 │ ║
║   │  • UNIQUE constraint: (trip_id, from_user_id) on ratings table                             │ ║
║   │  • Frontend disables submit button after first click                                        │ ║
║   │  • Backend: INSERT ... ON CONFLICT DO NOTHING pattern                                       │ ║
║   │                                                                                             │ ║
║   │  Resolution:                                                                                │ ║
║   │  • If constraint violation, return existing rating (don't create duplicate)                 │ ║
║   │  • User sees: "You have already rated this trip"                                            │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 4.2 Distributed Locking

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              DISTRIBUTED LOCKING PATTERNS                                      │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   Redis-based distributed lock for critical operations:                                       │
│                                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │  LOCK PATTERN:                                                                         │   │
│   │                                                                                        │   │
│   │  function acquireLock(lockName, ttlSeconds, retryCount):                              │   │
│   │      for i in range(retryCount):                                                       │   │
│   │          lockKey = f"lock:{lockName}"                                                   │   │
│   │          acquired = redis.set(lockKey, ownProcessId, nx=True, ex=ttlSeconds)           │   │
│   │          if acquired:                                                                   │   │
│   │              return True                                                               │   │
│   │          sleep(100ms * (i + 1))  -- Exponential backoff                                 │   │
│   │      return False                                                                       │   │
│   │                                                                                        │   │
│   │  function releaseLock(lockName):                                                        │   │
│   │      lockKey = f"lock:{lockName}"                                                        │   │
│   │      -- Only release if we own the lock                                                 │   │
│   │      if redis.get(lockKey) == ownProcessId:                                             │   │
│   │          redis.delete(lockKey)                                                          │   │
│   │                                                                                        │   │
│   └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│   CRITICAL OPERATIONS REQUIRING LOCKS:                                                       │
│   ────────────────────────────────────────                                                   │
│   • Auction close: prevent double close                                                       │
│   • Payment release: prevent double release                                                   │
│   • User rating update: prevent concurrent rating updates                                     │
│   • Driver assignment: prevent double assignment                                              │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Circuit Breaker Patterns

### 5.1 External Service Circuit Breakers

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              CIRCUIT BREAKER IMPLEMENTATION                                       ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │                                                                                             │ ║
║   │   STATE MACHINE:                                                                           │ ║
║   │                                                                                             │ ║
║   │         ┌─────────┐         ┌─────────┐         ┌──────────┐                               │ ║
║   │         │ CLOSED  │────────►│  OPEN   │────────►│ HALF-OPEN│                               │ ║
║   │         │         │  5 fails│         │ timeout │          │                               │ ║
║   │         │ Normal  │         │ Reject  │         │ Test     │                               │ ║
║   │         │ requests│         │ requests│         │ requests │                               │ ║
║   │         └─────────┘         └─────────┘         └────┬─────┘                               │ ║
║   │                                                        │                                    │ ║
║   │                               ◄────────────────────────┘                                    │ ║
║   │                                   success                                                   │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
║   CONFIGURATION:                                                                                   ║
║   ──────────────                                                                                  ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  MercadoPago Circuit Breaker:                                                              │ ║
║   │  ────────────────────────────────                                                           │ ║
║   │  • failureThreshold: 5 failures in 10 seconds                                             │ ║
║   │  • openTimeout: 30 seconds                                                                │ ║
║   │  • halfOpenRequests: 3 successful to close                                               │ ║
║   │  • fallback: Return "payment_pending" status, poll later                                  │ ║
║   │                                                                                             │ ║
║   │  Google Maps Circuit Breaker:                                                              │ ║
║   │  • failureThreshold: 10 failures in 60 seconds                                            │ ║
║   │  • openTimeout: 60 seconds                                                               │ ║
║   │  • halfOpenRequests: 5 successful to close                                               │ ║
║   │  • fallback: Use straight-line distance calculation, cache last known route                │ ║
║   │                                                                                             │ ║
║   │  Email Service Circuit Breaker:                                                            │ ║
║   │  • failureThreshold: 20 failures in 5 minutes                                             │ ║
║   │  • openTimeout: 5 minutes                                                                 │ ║
║   │  • halfOpenRequests: 10 successful to close                                               │ ║
║   │  • fallback: Queue emails for later delivery, SMS fallback for urgent                     │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 5.2 Fallback Behaviors

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              FALLBACK BEHAVIORS                                               │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   EXTERNAL SERVICE          FALLBACK BEHAVIOR                                                │
│   ─────────────────        ──────────────────────────────────────────                          │
│   MercadoPago down          • Payment marked 'pending'                                        │
│                              • Background job polls MP for status                             │
│                              • No trip start until payment confirmed                         │
│                                                                                              │
│   Google Maps down          • Use OSM as fallback                                            │
│                              • Fallback to straight-line distance                            │
│                              • Show "approximate route" badge                               │
│                                                                                              │
│   Email down               • Queue in Redis, retry with exponential backoff                  │
│                              • For critical (password reset): SMS fallback                   │
│                                                                                              │
│   SMS down                 • Email fallback for transactional                                 │
│                              • Push notification fallback for alerts                         │
│                                                                                              │
│   CDN (images) down        • Serve from local storage                                       │
│                              • Lazy load images with retry                                   │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Consistency Edge Cases

### 6.1 Stale Data Scenarios

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              DATA CONSISTENCY PATTERNS                                           ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   CASE: User deletes account while having active trips                                          ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  Business Rule: Account deletion requires NO active trips                                  │ ║
║   │                                                                                             │ ║
║   │  Check before deletion:                                                                    │ ║
║   │  SELECT COUNT(*) FROM trips                                                                 │ ║
║   │  WHERE (company_id = ? OR driver_id = ?)                                                   │ ║
║   │  AND status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS')                                     │ ║
║   │                                                                                             │ ║
║   │  If count > 0:                                                                              │ ║
║   │    • Reject deletion with clear message:                                                  │ ║
║   │    • "Cannot delete account: X active trips exist. Complete or cancel them first."         │ ║
║   │    • Show list of active trips with actions                                                │ ║
║   │                                                                                             │ ║
║   │  If count = 0:                                                                              │ ║
║   │    • Soft delete: user.status = 'deleted', anonymize PII                                  │ ║
║   │    • Keep user_id for audit trail (foreign keys)                                          │ ║
║   │    • Anonymize: email = 'deleted_{uuid}', phone = NULL                                    │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
║   CASE: Trip location data after trip completion                                                ║
║   ─────────────────────────────────────────────────────────────────────────────────────────────   ║
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  Data Retention:                                                                            │ ║
║   │  • Last known location kept for 30 days                                                   │ ║
║   │  • Full history (per-minute granularity) kept for 90 days                                  │ ║
║   │  • After 90 days: aggregate to hourly, keep for 1 year                                    │ ║
║   │  • After 1 year: delete, keep only summary statistics                                     │ ║
║   │                                                                                             │ ║
║   │  Cleanup Job:                                                                              │ ║
║   │  • Runs daily at 3am                                                                       │ ║
║   │  • Archives old locations to cold storage                                                  │ ║
║   │  • Updates trip_locations table with aggregated data                                      │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 6.2 Ghost Data Prevention

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              GHOST DATA PREVENTION                                             │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   ORPHAN RECORDS: Trip with non-existent company                                             │
│   ────────────────────────────────────────────────────────────────────────────────────────   │
│   SELECT t.* FROM core.trips t                                                                │
│   LEFT JOIN auth.users u ON t.company_id = u.id                                              │
│   WHERE u.id IS NULL;                                                                        │
│                                                                                              │
│   → Should not happen with FK constraints, but check for                                     │
│     manually inserted data or migration issues                                               │
│                                                                                              │
│   NOTIFICATION orphans: Notification for deleted user                                        │
│   ────────────────────────────────────────────────────────────────────────────────────────   │
│   SELECT n.* FROM notifications.items n                                                      │
│   LEFT JOIN auth.users u ON n.user_id = u.id                                                 │
│   WHERE u.id IS NULL;                                                                        │
│                                                                                              │
│   → When user deleted, notifications should cascade delete                                   │
│                                                                                              │
│   PREVENTION:                                                                                │
│   • All foreign keys use ON DELETE CASCADE                                                    │
│   • Regular integrity checks in cron job                                                      │
│   • Monitoring dashboard shows orphan count                                                   │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Time-Zone Edge Cases

### 7.1 Time-Zone Handling

```
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              TIME-ZONE HANDLING                                                  ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                     ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  RULE: All timestamps stored in UTC                                                        │ ║
║   │                                                                                             │ ║
║   │  Implementation:                                                                            │ ║
║   │  • Database column type: TIMESTAMP WITH TIME ZONE                                          │ ║
║   │  • Application stores: `new Date().toISOString()`                                          │ ║
║   │  • All comparisons use UTC                                                                  │ ║
║   │  • Display converts to user's timezone at presentation layer                               │ ║
║   │                                                                                             │ ║
║   │  User Timezone Storage:                                                                     │ ║
║   │  • auth.users.timezone = 'America/Argentina/Buenos_Aires'                                  │ ║
║   │  • Used only for display formatting                                                         │ ║
║   │  • Never used for storage or comparisons                                                    │ ║
║   │                                                                                             │ ║
║   │  Example:                                                                                   │ ║
║   │  • User in Buenos Aires creates trip for 9:00 AM local                                      │ ║
║   │  • Stored as: 2026-06-03T12:00:00Z (UTC, which is 9:00 AM ART -3)                         │ ║
║   │  • Display in Buenos Aires: 9:00 AM (ART)                                                  │ ║
║   │  • Display in Spain: 14:00 (CEST, UTC+2)                                                   │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
║   DAYLIGHT SAVING TIME TRANSITIONS:                                                            ║
║   ──────────────────────────────────                                                            ║
║   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ ║
║   │  Argentina does not observe DST (UTC-3 year-round)                                          │ ║
║   │  But drivers may travel to/from other countries:                                            │ ║
║   │                                                                                             │ ║
║   │  • Store departure timezone with trip                                                      │ ║
║   │  • For display: use trip.departure_timezone                                                 │ ║
║   │  • Auction end time: always UTC, convert at display                                        │ ║
║   │                                                                                             │ ║
║   │  DST edge case: Driver in Buenos Aires browsing trip in Mendoza                            │ ║
║   │  • Both are UTC-3, no issue                                                                │ ║
║   │  • If driver was in Chile (UTC-4 during winter):                                          │ ║
║   │    Show local time with timezone label: "14:00 ART (12:00 CLT)"                            │ ║
║   │                                                                                             │ ║
║   └─────────────────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                                     ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 8. Summary: Critical Edge Cases

| ID | Edge Case | Impact | Mitigation |
|----|-----------|--------|------------|
| EC-01 | Bid conflict (same timestamp) | High | DB unique constraint, optimistic locking |
| EC-02 | Payment succeeds, DB commit fails | Critical | Two-phase commit with immediate refund |
| EC-03 | Driver double-booking | High | Partial unique index on active trips |
| EC-04 | Offer accepted by two companies | High | Status-based locking on update |
| EC-05 | External service timeout | Medium | Circuit breaker + fallback behavior |
| EC-06 | Time-zone confusion | Low | UTC storage, timezone stored separately |
| EC-07 | User deletion with active trips | Medium | Pre-check before deletion |
| EC-08 | Clock skew on auction timing | Medium | DB server time, 5s buffer |
| EC-09 | Double rating submission | Low | Unique constraint + frontend disable |
| EC-10 | Ghost/orphan data | Low | CASCADE deletes, regular integrity checks |