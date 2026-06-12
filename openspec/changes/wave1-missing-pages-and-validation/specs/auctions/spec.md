# Auctions — Wave 1 Delta

## Purpose

Delta from base spec at `docs/specs/03-auctions-spec.md`. Lists the Wave 1 additions to the FRONT-END rendering of the three auction types. The backend contract (auction creation, bid acceptance, winner resolution) is unchanged.

## ADDED Requirements

### Requirement: AuctionType-Aware UI Components

The system SHALL branch the `AuctionCard`, `BidForm`, and `BidList` components on `auction.type` so each of the three types (`OPEN`, `DUTCH`, `SEALED`) renders distinctly.

#### Scenario: OPEN renders default behavior

- **GIVEN** an auction with `type = OPEN`
- **WHEN** the auction page renders
- **THEN** the BidForm shows amount + note + truck + "Realizar oferta" button
- **AND** the BidList shows all bids with their real amounts and badges
- **AND** the AuctionCard shows a "Abierta" type badge and the current best price.

#### Scenario: DUTCH renders live price and Tomar button

- **GIVEN** an auction with `type = DUTCH` and `status = OPEN`
- **WHEN** the auction page renders
- **THEN** the AuctionCard shows a "Holandesa" type badge and a small "Precio baja en vivo" label
- **AND** the BidForm renders a single "¡Tomar!" button (no amount input, no note, no truck picker)
- **AND** clicking "¡Tomar!" SHALL show a confirm dialog with the current price, and on confirm SHALL submit `amount = auction.currentPrice` to `POST /auctions/:id/bid`.

#### Scenario: SEALED renders the privacy message

- **GIVEN** an auction with `type = SEALED`
- **WHEN** the auction page renders
- **THEN** the BidForm shows the message "Oferta sellada — tu propuesta es privada" alongside the amount / note / truck fields and the "Realizar oferta" button
- **AND** the form MUST NOT display the current best price or other bidders' amounts
- **AND** the BidList SHALL render "Oferta sellada" instead of the numeric amount for every bid the viewing driver does not own
- **AND** the BidList SHALL show a small disclosure: "Las ofertas de otros transportistas se muestran como 'Oferta sellada' en esta pantalla. La Redacción definitiva se aplica del lado del servidor en una próxima versión."

### Requirement: Real-Time Price Updates (DUTCH)

The system SHALL update the displayed `currentPrice` on a DUTCH auction page whenever the WebSocket `broadcastToAuction` event reports a new `currentPrice`. (Backend already publishes the event; this is the client wiring.)

#### Scenario: Driver watches a DUTCH auction

- **GIVEN** a DRIVER is on an open DUTCH auction page
- **WHEN** the backend broadcasts `{ currentPrice: <new> }` to the auction room
- **THEN** the page SHALL update the displayed price without a full reload
- **AND** the "¡Tomar!" button SHALL submit the latest price on click.

## MODIFIED Requirements

### Requirement: BidList Visibility Rules

The system SHALL re-read visibility in `BidList` so that the rule is: a viewing user always sees their OWN bids in full; bids they do NOT own have their `amount` replaced with the placeholder "Oferta sellada" when the auction is `SEALED`.
(Previously: BidList showed all amounts to all viewers regardless of auction type, except for phone redaction in the existing trips route.)

#### Scenario: Driver views SEALED bid list with other drivers' bids

- **GIVEN** a DRIVER is viewing a SEALED auction's BidList and there are bids from other drivers
- **WHEN** the list renders
- **THEN** each non-owner bid shows "Oferta sellada" in the amount cell
- **AND** the driver's own bid row (if any) shows the real amount.

#### Scenario: Owner company views SEALED bid list

- **GIVEN** a COMPANY who owns the trip tied to a SEALED auction
- **WHEN** the BidList renders
- **THEN** all bid amounts are visible (the redaction rule is for non-owners only).

## REMOVED Requirements

None — the existing OPEN behavior remains the default path, and the existing winner-resolution semantics (lowest bid wins for OPEN/SEALED, first acceptance wins for DUTCH) are unchanged.
