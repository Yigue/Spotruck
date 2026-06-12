# User Avatar Upload Spec — Wave 1 Delta

## Purpose

Lets an authenticated user upload a profile avatar image so other users see a real face/logo instead of an initial. Local disk storage under `uploads/avatars/<userId>.<ext>`, served by `express.static('/uploads')`. Single file per user; re-uploading replaces the previous file.

## Requirements

### Requirement: Upload Endpoint

The system SHALL expose `POST /api/v1/users/me/avatar` that accepts a single `multipart/form-data` file under the field name `avatar`, validates the file, persists it under `uploads/avatars/<userId>.<ext>`, and updates `User.avatarUrl` with a publicly-served URL.

#### Scenario: Authenticated user uploads a valid jpg

- **GIVEN** an authenticated user of any role
- **WHEN** the user POSTs `multipart/form-data` to `/users/me/avatar` with field `avatar` containing a jpg image ≤ 2 MB
- **THEN** the server responds `200 OK` with body `{ data: { id, avatarUrl } }`
- **AND** the file is written to `uploads/avatars/<userId>.jpg`
- **AND** `avatarUrl` is set to a URL the browser can `GET` to retrieve the image (e.g. `/uploads/avatars/<userId>.jpg` or its absolute form).

#### Scenario: png and webp accepted

- **GIVEN** an authenticated user
- **WHEN** the user POSTs a png or webp file ≤ 2 MB as `avatar`
- **THEN** the server stores it under `uploads/avatars/<userId>.png` (or `.webp`) and returns the matching `avatarUrl`.

#### Scenario: File too large

- **GIVEN** an authenticated user
- **WHEN** the user POSTs a file whose size exceeds 2 MB
- **THEN** the server responds `413 Payload Too Large` with a Spanish error message that mentions the 2 MB limit
- **AND** no file is written and `avatarUrl` is unchanged.

#### Scenario: Unsupported mime type

- **GIVEN** an authenticated user
- **WHEN** the user POSTs a file whose mime type is not `image/jpeg`, `image/png`, or `image/webp`
- **THEN** the server responds `400 Bad Request` with a Spanish error message naming the allowed types
- **AND** no file is written and `avatarUrl` is unchanged.

#### Scenario: Missing file field

- **GIVEN** an authenticated user
- **WHEN** the user POSTs `multipart/form-data` to `/users/me/avatar` without a file under field `avatar`
- **THEN** the server responds `400 Bad Request` with a Spanish message like "Subí un archivo de imagen".

#### Scenario: Unauthenticated request

- **GIVEN** no `Authorization: Bearer <accessToken>` header
- **WHEN** a request is made to `POST /users/me/avatar`
- **THEN** the server responds `401 Unauthorized`.

### Requirement: Static Serving

The system SHALL serve the `uploads/` directory at the `/uploads` URL prefix with appropriate cache headers, so any avatar (or other uploaded asset) is reachable by URL.

#### Scenario: GET the uploaded avatar URL

- **GIVEN** the user just uploaded an avatar and received `avatarUrl = /uploads/avatars/<userId>.jpg`
- **WHEN** any browser issues `GET /uploads/avatars/<userId>.jpg`
- **THEN** the response is `200 OK` with `Content-Type: image/jpeg` and the file body.

### Requirement: Avatar Component

The system SHALL display the authenticated user's avatar wherever a user representation is rendered, preferring the uploaded `avatarUrl` over the initial fallback.

#### Scenario: ProfilePage header shows uploaded avatar

- **GIVEN** a user has uploaded an avatar
- **WHEN** `ProfilePage` renders
- **THEN** the page header SHALL render `Avatar` with `src` = the user's `avatarUrl`
- **AND** the initial letter fallback SHALL NOT be visible.

#### Scenario: Fallback to initial when no avatar

- **GIVEN** a user has never uploaded an avatar (`avatarUrl` is `null` / undefined)
- **WHEN** `Avatar` is rendered for that user
- **THEN** the initial letter of the user's display name is shown
- **AND** no broken-image icon appears.

### Requirement: Replace-on-Reupload

The system SHALL replace the user's previous avatar file when a new one is uploaded, so the `uploads/avatars/` directory does not grow unbounded per user.

#### Scenario: Second upload replaces the first

- **GIVEN** a user has previously uploaded `avatar.jpg`
- **WHEN** the user uploads `avatar.png`
- **THEN** the new file is saved as `uploads/avatars/<userId>.png`
- **AND** `User.avatarUrl` is updated to point to the new png
- **AND** only the latest file remains for that user (or both are kept but the URL points to the latest — see design).
