# Plan de fixes pendientes + Informe de testeo integral

**Fecha:** 2026-06-11 · **Rama:** `claude/optimistic-fermat-f62yt2`

> **Estado: ✅ AMBOS FIXES IMPLEMENTADOS** siguiendo este plan.
> - Decimal: migración `20260611120000_decimal_money`, aritmética con
>   `Prisma.Decimal` en los puntos de cálculo y `json replacer` global que
>   serializa como number (frontend sin cambios). Verificado con los asserts
>   de montos exactos de ambas suites.
> - Reset de contraseña: migración `20260611120100_password_reset`,
>   `POST /auth/forgot-password` (siempre 200) y `POST /auth/reset-password`
>   (token 1 uso / 1 h), páginas `/forgot-password` y `/reset-password`,
>   link en Login. Cubierto por la sección E8 de `edge-cases.mjs` (10 checks:
>   anti-enumeración, token inválido/vencido/reusado, reglas de contraseña,
>   login con la nueva, la vieja deja de servir).

---

## Parte 1 — Plan para los fixes pendientes (los "correctos")

### Fix 1: Migración de dinero `Float` → `Decimal` 🟠

Hoy los montos viven en `Float` (Double) con redondeo a centavos como mitigación.
La migración correcta, en 5 pasos seguros:

1. **Schema** — cambiar en `schema.prisma`:
   `basePrice`, `currentPrice`, `reservePrice`, `amount` (Bid y Payment),
   `platformFee`, `netAmount` → `Decimal @db.Decimal(12, 2)`.
2. **Migración SQL** — `ALTER TABLE ... ALTER COLUMN ... TYPE DECIMAL(12,2)`
   (PostgreSQL convierte Double→Decimal sin pérdida para valores ya redondeados;
   correr el redondeo de saneo antes: `UPDATE ... SET amount = ROUND(amount::numeric, 2)`).
3. **Backend** — el cliente Prisma devuelve `Prisma.Decimal`:
   - Aritmética: reemplazar `a * b` por `new Prisma.Decimal(a).mul(b)` SOLO en
     los 3 puntos que calculan (paymentService.createHold, payments POST /hold,
     reserva en POST /auctions). Comparaciones de ofertas: `.lessThan()/.gte()`.
   - Serialización: agregar un `replacer` global (o `superjson`) para que los
     `Decimal` salgan como **number** en JSON y el frontend no cambie:
     `app.set('json replacer', (k, v) => (v?.constructor?.name === 'Decimal' ? Number(v) : v))`.
4. **Frontend** — sin cambios si el paso 3 serializa como number (verificar con
   la suite de happy paths: los checks de montos exactos ya existen).
5. **Validación** — correr `scripts/happy-paths.mjs` y `scripts/edge-cases.mjs`:
   los asserts de montos exactos (`netAmount === 40480`, `amount === 17500`)
   detectan cualquier drift.

**Esfuerzo estimado:** medio día. **Riesgo:** bajo siguiendo el orden (la
serialización es el único punto que puede romper el frontend).

### Fix 2: Flujo de reset de contraseña 🔵 (feature nueva)

Toda la infraestructura ya existe (emailService, tokens de un solo uso del
mismo estilo que la verificación de email):

1. **Modelo** — en `User`: `passwordResetToken String? @unique` +
   `passwordResetExpires DateTime?` (expiración 1 h).
2. **Endpoints**:
   - `POST /auth/forgot-password { email }` → SIEMPRE responde 200 (sin revelar
     si el email existe — anti enumeración), genera token, manda email con
     `FRONTEND_URL/reset-password?token=...`. Cubierto por el rate limiter de /auth.
   - `POST /auth/reset-password { token, password }` → valida token no vencido,
     aplica las mismas reglas de contraseña del registro, limpia el token y
     (recomendado) invalida sesiones activas.
3. **Frontend**: link "¿Olvidaste tu contraseña?" en Login → página con email →
   página `/reset-password` (mismo patrón que `VerifyEmailPage`) con nueva
   contraseña + indicador de reglas.
4. **Tests**: agregar a `edge-cases.mjs`: token vencido → 400, token reusado →
   400, email inexistente → 200 igual.

**Esfuerzo estimado:** medio día.

---

## Parte 2 — Informe del testeo integral

### Herramientas creadas (quedan en el repo, repetibles)

| Suite | Cobertura | Resultado |
|---|---|---|
| `src/backend/scripts/happy-paths.mjs` | Los 9 recorridos felices completos (46 aserciones) | **46/46 ✓** |
| `src/backend/scripts/edge-cases.mjs` | Caminos infelices: validaciones, permisos/ownership, transiciones inválidas, dobles acciones, **concurrencia** (2 aceptaciones en paralelo), borradores, paginación (43 aserciones) | **43/43 ✓** |
| Jest backend / Vitest frontend | Suites existentes | Sin regresiones vs baseline |

### Bugs encontrados en esta ronda → ✅ corregidos

1. **500 por filtros con enums inválidos**: `GET /trips?status=NOEXISTE` (y los
   filtros de `/auctions` y `/users`) pasaban el valor crudo a Prisma →
   `INTERNAL_ERROR`. Ahora se validan con zod → 400.
2. **TripCard con estados sin traducir y colores muertos**: mostraba `AUCTION`/
   `BULK` en crudo y su mapa de colores comparaba contra `COMPLETED`/`PENDING`
   (estados que no existen en `TripStatus`) — mismo patrón que el bug de
   `AuctionCard`. Centralizado en `src/utils/labels.ts`.

### Limitación del entorno (testeo visual)

No hay navegador disponible en este contenedor (CDN de Playwright fuera del
allowlist de red; el chromium de apt es un shim de snap). El **testeo visual
con screenshots** debe correrse local:

```bash
cd src/frontend && npx playwright install chromium
docker compose up -d && (cd ../backend && npm run dev &) && npm run dev
npx playwright test          # specs e2e en tests/e2e/
```

Qué mirar a mano: responsive del stepper en 360px, popup del mapa en Explorar,
panel de notificaciones en mobile (abre hacia abajo), y el modal de postulante
con textos largos en "Aclaración".

### Revisión estática de diseño — mejoras sugeridas (no bloqueantes)

1. **Páginas sin skeleton** aún: TripsPage, StatsPage, ExplorePage usan spinner
   (TripDetail ya migró). Unificar con `<SkeletonCard/>`.
2. **`/trips?auction=` quedó huérfano**: AuctionPage ya navega directo al
   detalle; el highlight por query param en TripsPage es código muerto a limpiar.
3. **Dashboard**: las "Acciones rápidas" son iguales para ambos roles; para el
   transportista tendría más sentido "Explorar viajes" como primaria.
4. **Iconos emoji**: funcionan, pero para producción conviene migrar a
   `lucide-react` (ya instalada, la usa Alert) para consistencia visual.
5. **i18n**: todos los textos están hardcodeados en es-AR; si el V2 contempla
   i18n, conviene extraer a un diccionario antes de que crezca más.
6. **Accesibilidad**: falta `aria-live` en toasts/countdown y focus-trap en los
   modales (Escape ya funciona).
