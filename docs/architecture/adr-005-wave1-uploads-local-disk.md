# ADR-005 — Wave 1: uploads en disco local y decisiones asociadas

Fecha: 2026-07-02
Estado: Aceptada
Change: `openspec/changes/wave1-missing-pages-and-validation`

## Contexto

Wave 1 cierra seis gaps de paridad con la app legacy: página de postulaciones del
transportista, filtro "Mis viajes", UI diferenciada DUTCH/SEALED, subida de avatar,
subida de documentación y validación de CUIT.

## Decisiones

1. **AD-1 — Disco local para uploads (no S3/Cloudinary).** `uploads/avatars/<userId>.<ext>`
   y `uploads/documents/<userId>/<archivo>`, servidos por `express.static('/uploads')`
   con cache 7d. Cero infra nueva; volumen `./uploads:/app/uploads` en docker-compose
   evita perder archivos al reiniciar. Migrar a S3 solo cambia el storage de multer.
2. **AD-2 — `User.documentsUrl String[]` (sin modelo `Document`).** Un usuario tiene un
   set de documentos de verificación sin ciclo de vida individual; el precedente es
   `Truck.documentsUrl`.
3. **AD-3 — `mine=true` como query param (no ruta nueva).** Es un filtro, no un recurso:
   reutiliza scoping, filtros y paginación de `GET /trips`.
4. **AD-4 — Redacción SEALED solo en frontend (diferida en backend).** `BidList` muestra
   "Oferta sellada" para montos ajenos con un aviso explícito; la redacción server-side
   del SELECT compartido queda para una próxima wave.
5. **AD-5 — DUTCH sin cron.** El precio vigente lo actualiza cada oferta vía el broadcast
   WebSocket existente; el cliente re-fetchea en `auction_update`. "¡Tomar!" envía
   `amount = currentPrice`.
6. **AD-6 — Avatar reemplaza archivo por usuario.** Nombre canónico `<userId>.<ext>`;
   a lo sumo un huérfano por usuario si cambia la extensión.
7. **AD-7 — CUIT validado solo en frontend.** Mod-11 AFIP en `utils/cuit.ts`, usado en
   registro y perfil. El refinamiento Zod en backend queda para una wave futura.

## Nota sobre el spec de CUIT

El spec original traía como ejemplo "`20-12345678-9` pasa", pero ese dígito no cumple el
propio algoritmo mod-11 exigido por el mismo spec (el verificador correcto de
`2012345678` es **6**). Se implementó el algoritmo normativo y los tests usan CUITs
matemáticamente válidos (`20-12345678-6`, casos especiales 11→0 y 10→9).

## Consecuencias

- Los uploads viven en el contenedor del API: backups y GC de huérfanos quedan como deuda.
- Un cliente que no ejecute el JS puede enviar un CUIT inválido (se acepta hasta la wave
  que agregue `.refine` en el backend).
- Los montos SEALED siguen visibles en la respuesta de red hasta la redacción server-side.
