# Driver Bids Page Spec — Wave 1 Delta

## Purpose

Lets a logged-in DRIVER see every bid they have placed, follow each bid's lifecycle status, and withdraw a PENDING bid while the auction is still OPEN. Closes the "I posted a bid, where do I see it now?" gap that existed because bids were only visible inside each individual trip.

## Requirements

### Requirement: My Bids List

The system SHALL provide a `/my-bids` page that lists the authenticated DRIVER's bids in reverse chronological order, scoped to the caller.

#### Scenario: Authenticated driver with bids

- **GIVEN** a DRIVER is authenticated and has placed one or more bids
- **WHEN** the DRIVER navigates to `/my-bids`
- **THEN** the page issues `GET /api/v1/bids/me` and renders one row per bid
- **AND** each row shows trip origin, trip destination, trip scheduled date, bid amount, bid status, and the auction id.

#### Scenario: Driver with no bids

- **GIVEN** a DRIVER is authenticated and has placed zero bids
- **WHEN** the DRIVER navigates to `/my-bids`
- **THEN** the page renders an empty state with the message "Aún no te postulaste a ningún viaje" and a CTA to explore trips.

#### Scenario: Status filter

- **GIVEN** a DRIVER is on `/my-bids`
- **WHEN** the DRIVER selects a status from the status filter (PENDING / ACCEPTED / REJECTED / WITHDRAWN)
- **THEN** the page re-issues `GET /api/v1/bids/me?status=<value>` and re-renders the list with only matching bids.

### Requirement: Withdraw Pending Bid

The system SHALL let a DRIVER withdraw a bid they own only while the bid is PENDING and the parent auction is OPEN; the API path is `PATCH /api/v1/bids/:id/withdraw` and the resulting status SHALL be `WITHDRAWN`.

#### Scenario: Withdraw a pending bid on an open auction

- **GIVEN** a DRIVER is on `/my-bids` and has a bid with `status = PENDING` whose auction `status = OPEN`
- **WHEN** the DRIVER clicks "Retirar oferta" and confirms
- **THEN** the page calls `PATCH /api/v1/bids/:id/withdraw`
- **AND** the bid row updates to `WITHDRAWN` with the warning badge label "Retirada".

#### Scenario: Withdraw button hidden for non-pending bids

- **GIVEN** a DRIVER is on `/my-bids`
- **WHEN** any bid has status `ACCEPTED`, `REJECTED`, or `WITHDRAWN`
- **THEN** the "Retirar oferta" button SHALL NOT be rendered for that row.

#### Scenario: Withdraw rejected by server

- **GIVEN** a DRIVER is on `/my-bids` and the bid was already moved out of PENDING by another actor
- **WHEN** the DRIVER clicks "Retirar oferta" and the server responds with `400` (e.g. "Only PENDING bids can be withdrawn" or "Auction is not OPEN")
- **THEN** the page shows a Spanish error toast with the server message
- **AND** the page re-fetches the bids list so the row reflects the new status.

### Requirement: Access Control

The system SHALL restrict the `/my-bids` page and the `GET /bids/me` endpoint to authenticated users with role `DRIVER`; the caller's `userId` MUST be used as the bid filter.

#### Scenario: Non-driver navigates to /my-bids

- **GIVEN** an authenticated user with role `COMPANY` (or `ADMIN`)
- **WHEN** that user navigates to `/my-bids`
- **THEN** the page either renders an "Acceso denegado" empty state or redirects to `/dashboard`
- **AND** the `GET /bids/me` endpoint SHALL respond `403 Forbidden` if called directly.

#### Scenario: Unauthenticated request

- **GIVEN** no `Authorization: Bearer <accessToken>` header
- **WHEN** a request to `GET /bids/me` is sent
- **THEN** the endpoint responds `401 Unauthorized`.

### Requirement: Row Details

The system SHALL display enough trip context on each bid row for the driver to identify the trip without leaving the page.

#### Scenario: Open trip detail from my-bids

- **GIVEN** a DRIVER is on `/my-bids`
- **WHEN** the DRIVER clicks the trip origin/destination cell of a row
- **THEN** the page navigates to `/trips/<tripId>` for that bid's trip.
