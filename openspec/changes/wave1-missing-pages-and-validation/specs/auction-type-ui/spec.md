# Auction Type UI Spec — Wave 1 Delta

## Purpose

Make the three auction types in `AuctionType` (OPEN, DUTCH, SEALED) visibly distinct in the bidding UI so the driver understands how to participate. The change is presentation-only: the backend already accepts all three types and already updates `auction.currentPrice` for DUTCH (live decrement) and stores sealed amounts server-side. Backend redaction of SEALED amounts is **out of scope** (deferred); the frontend will hide the amount of bids the driver does not own, while still being honest that server-side redaction is not in place.

## Requirements

### Requirement: AuctionCard Type Awareness

The system SHALL render `AuctionCard` so the type (`OPEN | DUTCH | SEALED`) is visually obvious to the driver.

#### Scenario: Card shows type badge for any auction

- **GIVEN** an `Auction` object with `type` set to one of `OPEN`, `DUTCH`, `SEALED`
- **WHEN** the card is rendered
- **THEN** a localized badge SHALL appear with one of "Abierta", "Holandesa", "Cerrada".

#### Scenario: DUTCH card emphasises live price

- **GIVEN** an `Auction` with `type = DUTCH` and `status = OPEN`
- **WHEN** the card is rendered
- **THEN** the card SHALL display the `currentPrice` in a prominent style (e.g. larger font, accent color) AND a small label "Precio baja en vivo" or equivalent so the driver knows the price is descending.

### Requirement: BidForm Branches on Auction Type

The system SHALL branch the bid form's input and submit behavior on `auction.type`.

#### Scenario: OPEN auction shows amount input

- **GIVEN** a DRIVER is viewing a `type = OPEN` auction
- **WHEN** `BidForm` renders
- **THEN** it shows an amount input, a note textarea, a truck select, and a submit button "Realizar oferta" that calls `POST /auctions/:id/bid`.

#### Scenario: DUTCH auction shows only an accept button

- **GIVEN** a DRIVER is viewing a `type = DUTCH` auction
- **WHEN** `BidForm` renders
- **THEN** the amount input, note textarea, and truck select SHALL NOT render
- **AND** a single button labeled "¡Tomar!" (accept current price) SHALL render
- **AND** clicking that button SHALL submit `amount = auction.currentPrice` to `POST /auctions/:id/bid`.

#### Scenario: SEALED auction shows the privacy message

- **GIVEN** a DRIVER is viewing a `type = SEALED` auction
- **WHEN** `BidForm` renders
- **THEN** the form shows an explanatory message: "Oferta sellada — tu propuesta es privada"
- **AND** the form shows an amount input, note textarea, and submit button that call `POST /auctions/:id/bid`
- **AND** the form MUST NOT show the current best price or other bidders' amounts.

### Requirement: BidList Hides Other Drivers' Amounts in SEALED

The system SHALL, in `BidList`, redact the `amount` field of any bid the viewing driver does not own when the parent auction is `SEALED`. The driver's own bid SHALL remain visible.

#### Scenario: Driver views own SEALED bid

- **GIVEN** a DRIVER is viewing a `type = SEALED` auction's `BidList`
- **AND** the driver has at least one bid on that auction
- **WHEN** the list renders
- **THEN** each of the driver's own bids shows the real `amount`
- **AND** every other driver's bid shows a placeholder string (e.g. "Oferta sellada") instead of the numeric `amount`.

#### Scenario: Company owner views SEALED bids

- **GIVEN** a COMPANY user owns the trip tied to a `type = SEALED` auction
- **WHEN** the company's `BidList` renders
- **THEN** all bids show their real `amount` (the company sees all bids; the SEALED hide rule applies only to non-owner drivers).

#### Scenario: OPEN auction shows all amounts

- **GIVEN** an `OPEN` auction
- **WHEN** `BidList` renders
- **THEN** every bid shows its real `amount` regardless of viewer.

### Requirement: Dutch Accept Confirmation

The system SHALL confirm a DUTCH "¡Tomar!" click to prevent accidental immediate accept, because the first acceptance wins.

#### Scenario: Driver clicks Tomar

- **GIVEN** a DRIVER is viewing a `type = DUTCH` auction
- **WHEN** the DRIVER clicks the "¡Tomar!" button
- **THEN** a confirmation dialog SHALL appear with the current price and the message "Vas a aceptar el precio actual de <monto>. ¿Confirmás?"
- **AND** on confirm, the accept bid is submitted to the backend
- **AND** on cancel, no request is sent and the dialog closes.

### Requirement: Honesty Disclosure for SEALED Backend Leak

The system SHALL display a small notice on the SEALED bid list acknowledging that other drivers could theoretically see the bid list in the network response, until backend redaction ships.

#### Scenario: SEALED disclosure on BidList

- **GIVEN** a DRIVER is viewing a `type = SEALED` auction's `BidList`
- **WHEN** the list renders
- **THEN** a small notice SHALL appear: "Las ofertas de otros transportistas se muestran como 'Oferta sellada' en esta pantalla. La Redacción definitiva se aplica del lado del servidor en una próxima versión."
