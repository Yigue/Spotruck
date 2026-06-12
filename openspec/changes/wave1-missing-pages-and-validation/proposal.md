# Proposal: Wave 1 — Missing Pages and Validation

## Intent

Close six legacy gaps: bid list page, "Mis viajes" filter, DUTCH/SEALED UI, avatar upload, document upload, CUIT mod-11. Smallest viable surface; no schema breakage.

## Scope

### In Scope
- `/my-bids` page (DRIVER) with withdraw.
- "Mis viajes" tab inside `/trips`.
- DUTCH live decrement + "¡Tomar!". SEALED hides other amounts.
- Avatar upload (multipart, local disk, 2MB, jpg/png/webp).
- DRIVER doc upload (multipart, 5MB, jpg/png/pdf).
- `validateCuit()` in register + profile.

### Out of Scope
- S3/Cloudinary; backend SEALED redaction; Waves 2 & 3.

## Capabilities

### New Capabilities
- `driver-bids-page`, `auction-type-ui`, `user-avatar-upload`, `driver-document-upload`, `cuit-validation`.

### Modified Capabilities
- `trips`: `GET /trips?mine=true`; delta on `docs/specs/02-trips-spec.md`.
- `profile`: avatar + docs sections.
- `docs/specs/03-auctions-spec.md`: DUTCH/SEALED UI delta.

## Approach

- `MyBidsPage` → existing `GET /bids/me` + `PATCH /bids/:id/withdraw`.
- `TripsPage` tab → `mine=true`; `GET /trips` scopes `where.userId`.
- `BidForm` branches on `auction.type`; `BidList` shows "Oferta sellada" for non-owners in SEALED (frontend only; backend leak deferred).
- `POST /users/me/avatar` (multer 2MB) → `uploads/avatars/<uid>.<ext>`, `User.avatarUrl`, `express.static('/uploads')`.
- `POST /users/me/documents` (multer 5MB) → `User.documentsUrl[]`; `request-verification` unchanged.
- `utils/cuit.ts` → `validateCuit(raw)`; called in `RegisterPage` step 2 and `ProfilePage` save.

## Affected Areas

- `src/frontend/src/App.tsx` (M): `/my-bids` route.
- `src/frontend/src/pages/MyBidsPage.tsx` (N): driver bid list.
- `src/frontend/src/pages/TripsPage.tsx` (M): "Mis viajes" toggle.
- `src/frontend/src/pages/ProfilePage.tsx` (M): avatar + docs.
- `src/frontend/src/pages/RegisterPage.tsx` (M): CUIT on submit.
- `src/frontend/src/components/auctions/{BidForm,BidList,AuctionCard}.tsx` (M): DUTCH/SEALED branches.
- `src/frontend/src/components/ui/Avatar.tsx` (M): read avatarUrl.
- `src/frontend/src/utils/cuit.ts` (N): mod-11 + prefix.
- `src/backend/src/routes/{users,trips}.ts` (M): avatar/doc, `mine`.
- `src/backend/src/index.ts` (M): static `/uploads`.
- `src/backend/prisma/schema.prisma` (M): `avatarUrl`, `documentsUrl[]`.
- `docs/specs/02-trips-spec.md`, `03-auctions-spec.md` (D): `mine`, DUTCH/SEALED.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Multipart blocks event loop | Med | multer cap; 413 early. |
| SEALED amounts leak via `auction.bids` | Med | Frontend placeholder; backend deferred. |
| `avatarUrl` nullable breaks consumers | Low | Field nullable. |
| `uploads/` lost on container restart | Low | Volume; out of scope. |
| CUIT false positives | Low | Unit tests on AFIP samples. |

## Rollback Plan

- `/my-bids` + "Mis viajes" tab: revert commit (additive).
- DUTCH/SEALED UI: revert `BidForm` + `BidList`; OPEN resumes.
- Avatar/doc upload: revert route + UI; `migrate resolve --rolled-back`.
- CUIT: revert util + callsites; field stays free text.

## Dependencies

- `multer` (npm). Local `uploads/`. Existing `GET /bids/me`, `PATCH /bids/:id/withdraw`, `POST /users/me/request-verification`.

## Success Criteria

- [ ] DRIVER at `/my-bids` can withdraw a PENDING bid → `WITHDRAWN`.
- [ ] `/trips` "Mis viajes" shows only own/assigned trips.
- [ ] DUTCH: decrementing `currentPrice`; only `¡Tomar!` button.
- [ ] SEALED: other amounts hidden; "sellada — tu propuesta es privada" shown.
- [ ] Avatar upload jpg/png/webp ≤2MB; URL persists.
- [ ] DRIVER uploads license/cedula/seguro (≤5MB); PENDING; verification works.
- [ ] CUIT `20-12345678-9` passes; `99-12345678-9` fails with Spanish error.
- [ ] Vitest + Jest green; no new lint warnings.
