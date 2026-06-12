# Profile — Wave 1 Delta

## Purpose

Delta from base spec `docs/specs/01-auth-spec.md` (Get Profile section) and the current `ProfilePage` implementation in `src/frontend/src/pages/ProfilePage.tsx`. Lists the Wave 1 additions only. The existing edit-form behavior, the existing driver verification card, and the existing trucks list are preserved.

## ADDED Requirements

### Requirement: Avatar Section

The system SHALL add an "Avatar" section to `ProfilePage`, visible to BOTH roles (`COMPANY` and `DRIVER`), that lets the user upload an avatar image. The section MUST live above or beside the existing "Datos" edit form and MUST show the current avatar when one exists.

#### Scenario: User with no avatar opens profile

- **GIVEN** an authenticated user of any role whose `avatarUrl` is null
- **WHEN** the user navigates to `/profile`
- **THEN** the "Avatar" section renders an `Avatar` component showing the initial of the user's display name
- **AND** a file input labeled "Subir imagen (jpg, png, webp · máx 2 MB)" is visible
- **AND** a "Subir" button is visible.

#### Scenario: User with avatar opens profile

- **GIVEN** an authenticated user whose `avatarUrl` is set
- **WHEN** the user navigates to `/profile`
- **THEN** the "Avatar" section renders the actual image from `avatarUrl`
- **AND** the file input and "Subir" button remain visible so the user can replace the avatar.

#### Scenario: User uploads a valid avatar

- **GIVEN** a user is on `/profile`
- **WHEN** the user selects a jpg/png/webp file ≤ 2 MB and clicks "Subir"
- **THEN** the page calls `POST /users/me/avatar` with the file
- **AND** on success, the page re-fetches the user and the avatar image updates to the new URL
- **AND** a success toast appears: "Avatar actualizado".

#### Scenario: User uploads an oversized avatar

- **GIVEN** a user on `/profile`
- **WHEN** the user selects a file > 2 MB and clicks "Subir"
- **THEN** the server responds `413` and the page shows a Spanish error toast
- **AND** the existing avatar (if any) is unchanged.

#### Scenario: User uploads an unsupported type

- **GIVEN** a user on `/profile`
- **WHEN** the user selects a file whose mime type is not jpg/png/webp
- **THEN** the page shows a Spanish inline error mentioning the allowed types
- **AND** the request to `/users/me/avatar` is NOT sent.

### Requirement: Documents Section (DRIVER only)

The system SHALL add a "Documentación" section to `ProfilePage`, visible to DRIVERS ONLY, that lets the driver upload verification documents and shows the list of already-uploaded files. The section MUST live alongside the existing "Verificación de cuenta" card and MUST NOT change that card's behavior.

#### Scenario: DRIVER sees documents section

- **GIVEN** an authenticated DRIVER navigates to `/profile`
- **WHEN** the page renders
- **THEN** a "Documentación" Card SHALL be visible
- **AND** it SHALL contain a multi-file input labeled "Subí tu licencia, cédula y seguro"
- **AND** it SHALL show a list of previously uploaded files (one row per URL in `documentsUrl`)
- **AND** it SHALL keep the existing "Solicitar verificación" button (which POSTs to `/users/me/request-verification`) in the "Verificación de cuenta" card.

#### Scenario: COMPANY does not see documents section

- **GIVEN** an authenticated COMPANY navigates to `/profile`
- **WHEN** the page renders
- **THEN** the "Documentación" Card SHALL NOT render
- **AND** the "Solicitar verificación" button SHALL NOT render (it's driver-only).

#### Scenario: DRIVER uploads documents

- **GIVEN** a DRIVER on `/profile` with zero previously uploaded documents
- **WHEN** the DRIVER selects one or more pdf/jpg/png files each ≤ 5 MB and clicks "Subir"
- **THEN** the page calls `POST /users/me/documents` with the files
- **AND** on success, the page re-fetches the user and the documents list grows by the uploaded files
- **AND** a success toast appears: "Documentación subida".

#### Scenario: DRIVER upload rejected (size)

- **GIVEN** a DRIVER on `/profile`
- **WHEN** the DRIVER submits a file > 5 MB
- **THEN** the page shows a Spanish error toast mentioning the 5 MB limit
- **AND** the documents list is unchanged.

### Requirement: Existing Edit Form Preserved

The system SHALL preserve the existing `ProfilePage` edit-form behavior for all other fields (`companyName`, `companyCuit`, `phone`, `driverLicense`, `preferredZone`, `address`, `website`, `sector`) and the existing CUIT validation for the COMPANY's `companyCuit` field (see `cuit-validation` spec).

#### Scenario: COMPANY saves profile

- **GIVEN** a COMPANY on `/profile`
- **WHEN** the COMPANY changes any non-CUIT field and clicks "Guardar cambios"
- **THEN** `PUT /users/me` is called with the changed fields
- **AND** the existing field semantics from the base auth spec are preserved.

#### Scenario: CUIT validation runs on save

- **GIVEN** a COMPANY on `/profile`
- **WHEN** the COMPANY enters an invalid `companyCuit` and clicks "Guardar cambios"
- **THEN** the page shows a Spanish error from `validateCuit` near the CUIT input
- **AND** `PUT /users/me` is NOT sent for the CUIT field.

## MODIFIED Requirements

### Requirement: Get Profile Response

The system SHALL include `avatarUrl` in the `GET /users/me` response (in addition to the existing fields).
(Previously: `avatarUrl` was not part of the response.)

#### Scenario: User requests own profile

- **GIVEN** an authenticated user
- **WHEN** the user requests `GET /users/me`
- **THEN** the response SHALL include `avatarUrl` (null if no avatar uploaded).

## REMOVED Requirements

None — the existing `address`, `website`, `sector`, `phone`, `driverLicense`, `preferredZone`, `companyCuit` fields, the verification card, and the truck list are all preserved.
