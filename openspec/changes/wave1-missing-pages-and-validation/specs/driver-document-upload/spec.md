# Driver Document Upload Spec — Wave 1 Delta

## Purpose

Lets an authenticated DRIVER upload the verification documents required to enter the platform's "verified" workflow: driver's license (front and back), vehicle registration (cédula), and insurance (seguro). The existing `POST /users/me/request-verification` endpoint remains the trigger that flips `documentsStatus` to `PENDING`; this change only adds the actual file storage so drivers can hand in real files instead of relying on the existing fake-S3 placeholder. The verification request itself is **not** changed.

## Requirements

### Requirement: Document Upload Endpoint

The system SHALL expose `POST /api/v1/users/me/documents` that accepts `multipart/form-data` with one or more files under the field name `documents`, validates each file, persists the files under `uploads/documents/<userId>/<originalFilename>`, and updates the user's stored document URL list.

#### Scenario: Driver uploads three files

- **GIVEN** an authenticated user with role `DRIVER`
- **WHEN** the driver POSTs `multipart/form-data` to `/users/me/documents` with three files (license-front.jpg, license-back.jpg, cedula.pdf), each ≤ 5 MB
- **THEN** the server responds `200 OK` with body `{ data: { id, documentsUrl: [...] } }`
- **AND** the three files are saved under `uploads/documents/<userId>/license-front.jpg`, `license-back.jpg`, `cedula.pdf`
- **AND** `User.documentsUrl` (a `String[]` column added by this change) contains the corresponding `/uploads/documents/<userId>/<filename>` URLs.

#### Scenario: pdf and image types accepted

- **GIVEN** a DRIVER
- **WHEN** the driver uploads files whose mime types are `application/pdf`, `image/jpeg`, or `image/png`
- **THEN** each file is accepted, stored, and added to `documentsUrl`.

#### Scenario: One file over 5 MB

- **GIVEN** a DRIVER uploads a batch where one file exceeds 5 MB
- **WHEN** the request reaches the server
- **THEN** the server responds `413 Payload Too Large` with a Spanish error mentioning the 5 MB limit per file
- **AND** no file in the batch is persisted.

#### Scenario: Unsupported mime type

- **GIVEN** a DRIVER uploads a file with a mime type not in the allow-list (pdf / jpg / png)
- **WHEN** the request reaches the server
- **THEN** the server responds `400 Bad Request` with a Spanish error naming the allowed types
- **AND** no file is persisted.

#### Scenario: Non-driver cannot upload

- **GIVEN** an authenticated user with role `COMPANY` (or any role other than `DRIVER` / `ADMIN`)
- **WHEN** the user POSTs to `/users/me/documents`
- **THEN** the server responds `403 Forbidden` with a Spanish error message.

### Requirement: Documents Schema Field

The system SHALL add a new nullable `documentsUrl String[]` field to the `User` model. This is a per-user, per-document-set list, kept distinct from `Truck.documentsUrl` which already exists for truck-level paperwork.

#### Scenario: New field is nullable

- **GIVEN** a user created BEFORE this change ships (no `documentsUrl` set)
- **WHEN** the migration runs
- **THEN** the new column is added as `String[]` with default `[]` (or nullable), and existing rows survive intact.

#### Scenario: documentsUrl is per user, not per truck

- **GIVEN** a DRIVER with two trucks in their fleet
- **WHEN** the driver uploads verification documents to `/users/me/documents`
- **THEN** the files are stored under `uploads/documents/<userId>/...` (the DRIVER's directory)
- **AND** `User.documentsUrl` is appended, NOT `Truck.documentsUrl` for any specific truck.

### Requirement: Profile Documents Section

The system SHALL expose a "Documentación" section in `ProfilePage`, visible to DRIVERS only, that lets the driver upload the verification documents described in this spec and shows the list of already-uploaded files.

#### Scenario: DRIVER sees documents section

- **GIVEN** an authenticated DRIVER navigates to `/profile`
- **WHEN** the page renders
- **THEN** a "Documentación" Card SHALL be visible
- **AND** it SHALL contain a file input (multi-select) labeled "Subí tu licencia, cédula y seguro"
- **AND** it SHALL show a list of previously uploaded files (one row per URL in `documentsUrl`)
- **AND** below the list it SHALL keep the existing "Solicitar verificación" button (which POSTs to `/users/me/request-verification`).

#### Scenario: COMPANY does not see documents section

- **GIVEN** an authenticated COMPANY navigates to `/profile`
- **WHEN** the page renders
- **THEN** the "Documentación" Card SHALL NOT render
- **AND** the "Solicitar verificación" button SHALL NOT render.

#### Scenario: Successful upload updates list

- **GIVEN** a DRIVER on `/profile` with two documents already uploaded
- **WHEN** the driver selects two more files and clicks "Subir"
- **THEN** the page calls `POST /users/me/documents` with the files
- **AND** on success, the page re-fetches the user and the documents list grows to four entries.

#### Scenario: Server error during upload

- **GIVEN** a DRIVER on `/profile` tries to upload a 7 MB file
- **WHEN** the server returns `413`
- **THEN** the page shows a Spanish toast error mentioning the 5 MB limit
- **AND** the documents list is unchanged.

### Requirement: Verification Request Unchanged

The system SHALL NOT change the semantics of `POST /users/me/request-verification`. It still flips `documentsStatus` to `PENDING` if the driver has a license and at least one truck.

#### Scenario: Verification flow still requires uploaded files for a complete check

- **GIVEN** a DRIVER has uploaded all three required documents
- **WHEN** the DRIVER clicks "Solicitar verificación"
- **THEN** the existing flow runs unchanged and `documentsStatus` becomes `PENDING` so an admin can review.
