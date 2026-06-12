# CUIT Validation Spec — Wave 1 Delta

## Purpose

Validate Argentinian CUIT numbers on input, in the frontend, before they reach the backend. Avoids storage of obviously-wrong CUITs, gives the user a clear Spanish error message at the moment of typing, and matches the public AFIP mod-11 algorithm. Used in `RegisterPage` step 2 (COMPANY) and `ProfilePage` save when the role is `COMPANY`.

## Requirements

### Requirement: validateCuit Pure Function

The system SHALL expose a pure function `validateCuit(raw: string)` in `src/frontend/src/utils/cuit.ts` that returns a discriminated result. The function MUST be side-effect free and synchronous.

#### Scenario: Valid formatted CUIT passes

- **GIVEN** the input string `"20-12345678-9"` (a real-format CUIT)
- **WHEN** `validateCuit("20-12345678-9")` is called
- **THEN** the result SHALL be `{ ok: true, formatted: "20-12345678-9" }`.

#### Scenario: Valid unformatted CUIT is normalized

- **GIVEN** the input string `"20123456789"` (11 digits, no dashes)
- **WHEN** `validateCuit("20123456789")` is called
- **THEN** the result SHALL be `{ ok: true, formatted: "20-12345678-9" }`.

#### Scenario: Wrong length rejected

- **GIVEN** the input string `"2012345678"` (10 digits) or `"201234567890"` (12 digits)
- **WHEN** `validateCuit(...)` is called
- **THEN** the result SHALL be `{ ok: false, error: "El CUIT debe tener 11 dígitos" }`.

#### Scenario: Non-digit characters rejected

- **GIVEN** the input string `"20-1234567A-9"` (contains a letter)
- **WHEN** `validateCuit(...)` is called
- **THEN** the result SHALL be `{ ok: false, error: "El CUIT solo puede tener números y guiones" }`.

### Requirement: Mod-11 Checksum

The system SHALL validate the CUIT's check digit using the AFIP mod-11 algorithm with multipliers `5, 4, 3, 2, 7, 6, 5, 4, 3, 2` applied left-to-right over the first 10 digits, modulo 11, where the expected check digit is `11 - (sum % 11)` (with the special-case mapping `11 → 0` and `10 → 9`).

#### Scenario: Correct checksum passes

- **GIVEN** a CUIT whose first 10 digits, when run through the mod-11 algorithm, produce a check digit equal to the 11th digit
- **WHEN** `validateCuit(...)` is called
- **THEN** the result SHALL be `{ ok: true, formatted: "XX-XXXXXXXX-X" }`.

#### Scenario: Bad checksum rejected

- **GIVEN** the input string `"20-12345678-0"` (last digit changed from the correct one)
- **WHEN** `validateCuit(...)` is called
- **THEN** the result SHALL be `{ ok: false, error: "El dígito verificador del CUIT no es válido" }`.

### Requirement: Prefix Allow-List

The system SHALL accept only the following CUIT prefixes (two-digit prefix at the start): `20, 23, 24, 25, 26, 27, 30, 33, 34`. Any other prefix SHALL be rejected with a Spanish error.

#### Scenario: Unknown prefix rejected

- **GIVEN** the input string `"99-12345678-9"` (prefix `99` not in the allow-list; checksum can be valid)
- **WHEN** `validateCuit(...)` is called
- **THEN** the result SHALL be `{ ok: false, error: "El prefijo del CUIT no es válido para empresas o personas físicas" }`.

#### Scenario: Known company prefix accepted at format level

- **GIVEN** the input string `"30-12345678-9"` (prefix `30`, a known company prefix)
- **AND** the checksum is correct
- **WHEN** `validateCuit(...)` is called
- **THEN** the result SHALL be `{ ok: true, formatted: "30-12345678-9" }`.

### Requirement: Empty / Whitespace Input

The system SHALL treat empty or whitespace-only input as invalid with a Spanish error.

#### Scenario: Empty string rejected

- **GIVEN** the input string `""` or `"   "`
- **WHEN** `validateCuit(...)` is called
- **THEN** the result SHALL be `{ ok: false, error: "Ingresá un CUIT" }`.

### Requirement: Wired into RegisterPage Step 2

The system SHALL call `validateCuit` on the `companyCuit` field during `RegisterPage` step 2 submission, when `role === 'COMPANY'`.

#### Scenario: Invalid CUIT blocks registration

- **GIVEN** a COMPANY registering with `companyCuit = "99-12345678-9"`
- **WHEN** the user clicks "Registrarse" on step 2
- **THEN** the page shows the Spanish error from `validateCuit` near the CUIT input
- **AND** the registration request to `POST /auth/register` SHALL NOT be sent.

#### Scenario: Valid CUIT allows registration

- **GIVEN** a COMPANY registering with `companyCuit = "20-12345678-9"` (valid)
- **WHEN** the user clicks "Registrarse" on step 2
- **THEN** the form submits and `POST /auth/register` includes the formatted `companyCuit` value.

### Requirement: Wired into ProfilePage Save

The system SHALL call `validateCuit` on the `companyCuit` field during `ProfilePage` save, when the role is `COMPANY`.

#### Scenario: Invalid CUIT blocks profile save

- **GIVEN** a COMPANY with `companyCuit` set to `"20-12345678-0"` (bad checksum)
- **WHEN** the user clicks "Guardar cambios"
- **THEN** the page shows the Spanish error from `validateCuit` near the CUIT input
- **AND** the request to `PUT /users/me` SHALL NOT be sent for the CUIT field (other valid fields MAY be saved in the same submit).

#### Scenario: CUIT field is not shown to DRIVER

- **GIVEN** an authenticated DRIVER on `/profile`
- **WHEN** the page renders
- **THEN** the CUIT input SHALL NOT be present
- **AND** `validateCuit` is not called for this role.
