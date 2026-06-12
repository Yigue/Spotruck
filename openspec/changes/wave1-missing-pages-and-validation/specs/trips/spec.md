# Trips — Wave 1 Delta

## Purpose

Delta from base spec at `docs/specs/02-trips-spec.md`. Lists the Wave 1 additions only. The base contract (CRUD, state machine, validations) is unchanged.

## ADDED Requirements

### Requirement: My Trips Filter

The system SHALL let an authenticated user filter the `GET /trips` list to only the trips they own or are assigned to, via the `mine=true` query parameter. For a DRIVER, "mine" means the trips on which they are the assigned driver (i.e. where the trip's accepted bid's `userId` is theirs). For a COMPANY, "mine" means trips they created (`trip.userId === currentUser.id`).

#### Scenario: DRIVER requests own assigned trips

- **GIVEN** an authenticated DRIVER
- **WHEN** the client calls `GET /trips?mine=true&page=1&limit=20`
- **THEN** the server returns only trips whose accepted bid has `userId = currentUser.id`
- **AND** the response includes the standard `{ data, pagination }` shape.

#### Scenario: COMPANY requests own created trips

- **GIVEN** an authenticated COMPANY
- **WHEN** the client calls `GET /trips?mine=true`
- **THEN** the server returns only trips where `trip.userId = currentUser.id`
- **AND** the response includes the standard `{ data, pagination }` shape.

#### Scenario: ADMIN can use mine with any userId

- **GIVEN** an authenticated ADMIN
- **WHEN** the client calls `GET /trips?mine=true`
- **THEN** the server SHALL treat the ADMIN's call as "all trips where the ADMIN is the userId", which returns no rows for an admin who has never created a trip
- **AND** the existing `/users` admin listing remains the way to view a specific user's trips.

#### Scenario: Unauthenticated request

- **GIVEN** no `Authorization: Bearer <accessToken>` header
- **WHEN** a request to `GET /trips?mine=true` is sent
- **THEN** the server responds `401 Unauthorized` (the underlying `GET /trips` requires authentication, unchanged from the base spec).

#### Scenario: mine combined with other filters

- **GIVEN** an authenticated DRIVER
- **WHEN** the client calls `GET /trips?mine=true&status=ASSIGNED`
- **THEN** the server returns only the DRIVER's assigned trips in `ASSIGNED` status
- **AND** the `status` filter is applied on top of the `mine` filter (logical AND).

#### Scenario: mine=false is identical to no mine param

- **GIVEN** an authenticated user
- **WHEN** the client calls `GET /trips?mine=false` (or omits the param)
- **THEN** the server behaves exactly as the base spec: a DRIVER sees only `OPEN` / `AUCTION` trips, a COMPANY sees all trips.

### Requirement: Mis Viajes Tab in TripsPage

The system SHALL add a "Mis viajes" toggle to the existing `TripsPage` that, when active, sends `mine=true` to the server and otherwise behaves like the existing page.

#### Scenario: User toggles Mis viajes on

- **GIVEN** a DRIVER is on `/trips`
- **WHEN** the DRIVER clicks the "Mis viajes" toggle
- **THEN** the page sets `mine=true` on the next `GET /trips` request
- **AND** the page re-renders with the user's own assigned trips
- **AND** the existing status / cargo / price filters SHALL continue to work alongside `mine=true`.

#### Scenario: User toggles Mis viajes off

- **GIVEN** a DRIVER is on `/trips` with the "Mis viajes" toggle on
- **WHEN** the DRIVER clicks the toggle again to turn it off
- **THEN** the page reverts to the base `GET /trips` behavior (DRIVER sees OPEN/AUCTION trips).

#### Scenario: Toggle label adapts to role

- **GIVEN** a COMPANY is on `/trips`
- **WHEN** the toggle renders
- **THEN** the label SHALL read "Mis viajes" (trips I published) — the same label works for both roles; the underlying query differs.

## MODIFIED Requirements

None — the base spec's requirements for `POST /trips`, `GET /trips/:id`, `PUT /trips/:id`, `DELETE /trips/:id`, and `PATCH /trips/:id/status` are unchanged. The `mine=true` query param is purely additive on `GET /trips`.

## REMOVED Requirements

None.
