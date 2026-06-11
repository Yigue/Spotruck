# Auditoría — Bugs, Fallas y Mejoras (Visual + Funcional)

**Fecha:** 2026-06-11 · **Rama:** `claude/optimistic-fermat-f62yt2`
**Método:** revisión manual del código + barrido automatizado independiente. Sin cambios aplicados (solo diagnóstico).

---

## 🔴 CRÍTICOS — rompen el flujo principal o la plata

### C1. El flujo principal está roto: las publicaciones nuevas quedan en DRAFT para siempre
- `POST /trips` crea el viaje en `DRAFT` (default del schema). `POST /auctions` exige `status: OPEN`. **No existe ningún endpoint ni botón en la UI que pase un viaje de DRAFT a OPEN, y el frontend nunca llama a `POST /auctions`.**
- Consecuencia: una empresa crea una publicación desde la UI → nunca entra en subasta → los transportistas **nunca la ven** (Explore filtra `status=AUCTION`). Todo el circuito funcionó hasta ahora solo con datos del seed.
- Archivos: `backend/src/routes/trips.ts` (POST), `routes/auctions.ts:91`, `frontend/src/pages/NewTripPage.tsx`.
- **Fix sugerido:** replicar la app original — al crear la publicación, crearla ya "En Subasta" (transacción: trip OPEN→AUCTION + auction con `endTime = endDate ?? +24h`). Opcional: mantener DRAFT como "guardar borrador".

### C2. Race condition entre el cron de cierre y la aceptación manual → pagos duplicados
- `auctionCron` (cada 60s) ejecuta `closeAuction()` y `bidService.acceptBid()` puede correr en simultáneo sobre la misma subasta. Ambos chequean `status === 'OPEN'` antes de sus transacciones y **ambos crean `Payment`**; el hold además se crea **fuera** de la transacción de `acceptBid`.
- Escenario: subasta vence a las 00:00, la empresa acepta a las 23:59:58 → dos adjudicaciones/pagos posibles. También: si `createHold` falla, el viaje queda ASSIGNED sin pago.
- Archivos: `services/bidService.ts`, `services/auctionService.ts:62-87`, `jobs/auctionCron.ts`.
- **Fix sugerido:** `updateMany` condicional como lock optimista (`WHERE id = X AND status = 'OPEN'` → si count 0, abortar) y crear el pago dentro de la misma transacción; unificar la creación de pagos en `paymentService` (hoy hay lógica duplicada y divergente entre `closeAuction` y `createHold`).

### C3. `GET /payments/:tripId` sin autorización
- Cualquier usuario autenticado ve los montos, comisión y estado del pago de **cualquier** viaje. `routes/payments.ts` (GET). Restringir a empresa dueña, transportista asignado o admin.

### C4. `POST /tracking/:tripId` no valida quién envía
- Cualquier usuario autenticado puede inyectar posiciones GPS falsas en cualquier viaje en curso (y además dispara el auto-ASSIGNED→IN_PROGRESS). `routes/tracking.ts`. Validar que `req.user` sea el transportista asignado (bid ACCEPTED).

### C5. `confirm-delivery` finaliza viajes con el pago sin hacer
- Con MercadoPago configurado el pago nace `PENDING`. Si la empresa nunca paga, igual puede confirmar la entrega: el viaje pasa a `SETTLED` y el pago queda `PENDING` para siempre — el transportista trabajó gratis. `routes/trips.ts` (confirm-delivery). Bloquear la confirmación (o al menos avisar) si hay un pago `PENDING` con MP activo.

---

## 🟠 ALTOS — seguridad y privacidad

| # | Problema | Dónde | Sugerencia |
|---|---|---|---|
| A1 | **Teléfonos expuestos** a cualquier autenticado en `GET /trips/:id` y `GET /auctions/:id` (de la empresa y de todos los postulantes) | `trips.ts`, `auctions.ts` selects | Teléfono del postulante: solo visible para la empresa dueña del viaje. Teléfono de la empresa: solo para postulantes/asignado |
| A2 | **JWT en query string del WebSocket** → queda en logs de servidor/proxies | `websocket/index.ts`, `useWebSocket.ts` | Pasar token en el primer mensaje (auth message) o usar subprotocolo; ticket de corta vida |
| A3 | **Webhook MP sin firma** si falta `MERCADOPAGO_WEBHOOK_SECRET` → cualquiera puede "aprobar" pagos | `mercadopagoService.verifyWebhookSignature` | En `NODE_ENV=production`, exigir el secret (fail-closed) |
| A4 | **Contraseña: backend solo valida min 8** — las reglas (mayúscula/número) viven solo en el front | `auth.ts registerSchema` | Replicar el regex en el schema zod |
| A5 | **Dinero como `Float`** (Double) en `basePrice`, `amount`, `platformFee`, `netAmount` | `schema.prisma` | Migrar a `Decimal(12,2)` |
| A6 | **Sin rate limiting** en `/auth/*` (el error 429 existe pero nunca se usa) | `index.ts` | `express-rate-limit` en login/register |

---

## 🟡 MEDIOS — funcionales

1. **`endDate` (fecha fin) de la publicación no se respeta**: no hay cron ni check que cierre publicaciones vencidas; solo vence la subasta (24h fijas). Conectar: `auction.endTime = trip.endDate`.
2. **Dashboard con métricas falsas**: `pendingBids` siempre 0 (comentario "no endpoint" — ahora los datos existen) y `auctionsWon` cuenta viajes SETTLED, sin sentido para empresas. `DashboardPage.tsx`.
3. **Dos conexiones WebSocket por página** (NotificationBell + TripDetailPage abren cada una la suya). Extraer a un provider/contexto compartido.
4. **`PUT /trips/:id` pasa fechas como string** directo a Prisma (funciona, pero frágil) y no recalcula distancia/duración si cambia el origen/destino.
5. **docker-compose.yml desactualizado**: sin `MERCADOPAGO_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `API_URL`; `JWT_SECRET` hardcodeado dev.
6. **Vite proxy sin `/ws`**: en dev el hook esquiva el proxy apuntando a `localhost:4000`, pero conviene proxear y documentar el reverse proxy de producción (`/ws` → backend).

---

## 🔵 MEJORAS VISUALES / UX

1. **`AuctionCard`**: el badge chequea `status === 'ACTIVE'`, valor que **no existe** (enum: PENDING/OPEN/CLOSED/SETTLED) → siempre gris; el status se muestra en inglés sin traducir; el tiempo restante es texto estático (ya existe `AuctionCountdown`, usarlo).
2. **`BidHistory`**: etiqueta **"Mayor"** sobre la oferta más reciente — en subasta inversa gana el **menor** precio y además ordena por fecha, no por monto. Debería ser "Mejor oferta" sobre el menor monto.
3. **`BidForm`**: el usuario no conoce el mínimo real (precio actual −10%); tipea, recibe error del servidor. Mostrar "Tu oferta debe ser menor a $X" calculado.
4. **`NewTripPage`**: permite fechas pasadas (sin `min` en los datetime-local ni validación) y no valida peso máximo razonable.
5. **Errores tragados**: `refreshTrip`, carga de notificaciones, etc. fallan en silencio — agregar toasts/estados de error.
6. **Skeleton loaders**: el SPEC los promete; hoy todo es `<Spinner/>` centrado. Agregar skeletons en listas y detalle.
7. **`AuctionPage`**: el click navega a `/trips?auction=ID` (lista filtrada) en vez del detalle del viaje directo; sin countdown en las cards.
8. **Tabla de postulantes en mobile**: scrollea horizontal; convertir a cards apiladas en `< md`.
9. **Empty states con CTA**: Explore sin resultados, viajes vacíos → botón de acción.
10. **`LoginPage`**: `import { Link }` al final del archivo (funciona por hoisting, pero es confuso); sin link "¿Olvidaste tu contraseña?" (no hay flujo de reset — candidato a próxima fase).
11. **Accesibilidad**: botones de ícono sin `aria-label` consistente; contrastes del sidebar (`text-secondary-500` sobre `secondary-900`) están al límite.

---

## Resumen

| Severidad | Cantidad |
|---|---|
| 🔴 Crítico | 5 |
| 🟠 Alto | 6 |
| 🟡 Medio | 6 |
| 🔵 UX/Visual | 11 |

**Orden de ataque sugerido:** C1 (publicar→subasta, desbloquea el producto) → C2-C5 (plata y autorización) → A1-A3 (privacidad) → mejoras UX en una pasada.
