# Auditoría frontend — `src/frontend/`

Fecha: 2026-06-11
Alcance: revisión estática completa (config, build, utils, hooks, páginas, componentes, estilos, PWA, Docker, tests).
Sin ejecución de build ni de tests (el usuario pidió solo informe).

Convención de severidad:

- **CRÍTICO** — rompe funcionalidad, expone datos, o bloquea CI/prod.
- **ALTO** — bug visible o de comportamiento con impacto real para el usuario.
- **MEDIO** — calidad, DX, consistencia, deuda técnica.
- **BAJO** — limpieza, convenciones, cosas menores.

Cada item referencia `file:line` para que sea accionable.

---

## CRÍTICO

### 1. Tokens persistidos en `localStorage` en texto plano
- **Archivo:** `src/frontend/src/hooks/useAuthStore.ts:30`
- **Detalle:** Zustand `persist` guarda `{token, refreshToken, user}` bajo la clave `spottruck-auth`. Cualquier XSS roba la sesión.
- **Fix sugerido:** mover a cookie `httpOnly + secure + SameSite=Lax` emitida por el backend. El frontend solo lee el usuario actual vía `/users/me` con la cookie.

### 2. Tokens accesibles desde el bundle vía parseo manual
- **Archivo:** `src/frontend/src/utils/api.ts:10-19` y `src/frontend/src/utils/api.ts:30-41`
- **Detalle:** los interceptores de axios leen y mutan `localStorage` directamente con la clave hardcodeada, en vez de pasar por el store. Doble persistencia, doble acoplamiento, y deja el path abierto a robo.
- **Fix sugerido:** eliminar la manipulación de `localStorage`; usar cookie httpOnly (ver #1). Si se mantiene JWT en cliente, al menos leerlo del store vía `useAuthStore.getState()`.

### 3. CI se cae en `npm run build`
- **Archivo:** `src/frontend/package.json:8` corre `tsc && vite build`
- **Config:** `src/frontend/tsconfig.json:14-16` activa `strict + noUnusedLocals + noUnusedParameters`.
- **Detalle:** varios imports/vars sin usar (ej. `Spinner` en `RegisterPage.test.tsx`, `tsconfig.app.json` no existe, `lucide-react` v1.17.0 pinneado). El typecheck rompe antes de bundling.
- **Fix sugerido:** limpieza de imports + agregar `tsconfig.app.json` siguiendo la convención Vite 5, o relajar las reglas hasta tener todo verde.

### 4. PWA rota en Docker prod
- **Archivo:** `src/frontend/Dockerfile:19-22`
- **Detalle:** el stage runner copia solo `dist`, `package.json`, `index.html`. NO copia `public/` (icons, manifest, sw.js). El SW intenta registrar `/sw.js` que no existe → 404 silencioso.
- **Fix sugerido:** agregar `COPY --from=builder /app/public ./public` al stage runner, o servir `public/` desde el servidor estático.

### 5. Servidor de prod incorrecto
- **Archivo:** `src/frontend/Dockerfile:25`
- **Detalle:** usa `npm run preview` (Vite preview, no apto para prod). Además NO proxy-a `/api` ni `/ws`, así que ni siquiera el frontend podría hablar con el backend.
- **Fix sugerido:** reemplazar por nginx sirviendo `dist/` + `public/` con reverse proxy a `/api` y `/ws` hacia el backend.

### 6. Race condition en fetches de `TripsPage`
- **Archivo:** `src/frontend/src/pages/TripsPage.tsx:71-104`
- **Detalle:** dispara `api.get('/trips', { params })` en cada cambio de filtro sin `AbortController`. Cambios rápidos → respuestas en orden inverso → UI inconsistente.
- **Fix sugerido:** usar `AbortController` por efecto, abortar el anterior al re-correr el efecto. Idealmente con TanStack Query o SWR (react-query ya es patrón común en este tipo de apps).

### 7. Stale closure en `TripsPage`
- **Archivo:** `src/frontend/src/pages/TripsPage.tsx:71-104`
- **Detalle:** el `useEffect` depende de `pagination.page` pero usa `pagination.limit` desde el closure. Cambiar el `limit` no recarga.
- **Fix sugerido:** agregar `pagination.limit` a las deps, o derivar `page/limit` de `useSearchParams` y recomputar en cada render.

### 8. Imposible borrar campos en el perfil
- **Archivo:** `src/frontend/src/pages/ProfilePage.tsx:101-104`
- **Detalle:** `Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))` descarta cualquier string vacío antes de mandar al backend. Para blanquear `address`, `website` o `sector` el usuario no puede.
- **Fix sugerido:** enviar `null` explícito cuando el campo está vacío, o un set de campos "dirty" para que el PUT borre lo que el usuario tocó.

### 9. Marcadores de mapa sin popup
- **Archivos:** `src/frontend/src/components/maps/TripDetailMap.tsx:48-53` y `src/frontend/src/components/trips/TripMap.tsx:49-54`
- **Detalle:** usan `<div>{originAddress}</div>` como child de `<Marker>`. Leaflet ignora divs sueltos; tiene que ser `<Popup>`. El click no muestra nada.
- **Fix sugerido:** envolver en `<Popup>{originAddress}</Popup>`.

### 10. Leak de subscriptions WebSocket
- **Archivo:** `src/frontend/src/pages/TripDetailPage.tsx:152-162`
- **Detalle:** suscribe a `auction` y `trip` cuando cambian sus IDs, pero NO desuscribe del anterior. Si el viaje pasa por varios estados (o si `id` cambia), acumulás subs.
- **Fix sugerido:** agregar cleanup en el mismo `useEffect` que llame a `unsubscribe(prevId, channel)`.

### 11. Cleanup faltante de geolocation
- **Archivo:** `src/frontend/src/components/maps/LiveTrackingMap.tsx:118-122`
- **Detalle:** el `clearWatch` solo corre en unmount del componente. Si `tripId` cambia sin unmount (caso real si navegás entre viajes rápido), el watcher anterior queda vivo → drena batería.
- **Fix sugerido:** mover el cleanup a un `useEffect` que dependa de `tripId`, o limpiar al inicio de `toggleSharing` cuando ya hay un watch activo.

---

## ALTO

### 12. Remontaje total del mapa en cada update
- **Archivo:** `src/frontend/src/components/maps/LiveTrackingMap.tsx:152`
- **Detalle:** `key={`${tripId}-${history.length > 0}`}` recrea el `MapContainer` cada vez que llega una posición. Tirá cámara, zoom, tiles cacheados.
- **Fix sugerido:** sacar la key dinámica; usar ref + `map.setView()` / marker `panTo()` para actualizar la cámara.

### 13. Bug de timing en WS subscribe
- **Archivo:** `src/frontend/src/utils/wsClient.ts:85`
- **Detalle:** `if (authed) send(...)`. Si llamás `wsSubscribe` entre `ws.onopen` y el procesamiento de `connected`, el mensaje se pierde porque `authed` todavía es `false`.
- **Fix sugerido:** guardar la intención siempre y enviarla en el `onmessage` cuando llega `connected` (la lógica ya existe para reconexión, replicar en subscribe normal).

### 14. `ExplorePage` puede romper con respuesta nula
- **Archivo:** `src/frontend/src/pages/ExplorePage.tsx:64-66`
- **Detalle:** `setTrips(data.data)` directo. Si la API responde `null` o cambia shape, `.length` revienta.
- **Fix sugerido:** `setTrips(data.data ?? [])` y agregar error boundary.

### 15. Botón "Siguiente" siempre habilitado en Register
- **Archivo:** `src/frontend/src/pages/RegisterPage.tsx:156`
- **Detalle:** la password puede no cumplir reglas y el botón sigue activo. UX confusa.
- **Fix sugerido:** `disabled={!rulesOk || form.password !== form.passwordRepeat || !terms}`.

### 16. Pago se re-fetchea en cada cambio de estado
- **Archivo:** `src/frontend/src/components/payments/PaymentCard.tsx:65-70`
- **Detalle:** el `useEffect` depende de `tripStatus`, que cambia 3-4 veces en el lifecycle. Refetch en cascada.
- **Fix sugerido:** depender solo de `tripId`; si necesitás refresh post-cambio, exponer un `key` reactivo desde el padre.

### 17. e2e sin seed
- **Archivos:** `src/frontend/tests/e2e/auth.spec.ts:6` y `src/frontend/tests/e2e/trips.spec.ts:6`
- **Detalle:** asumen que existe `test@company.com / Test1234!`. En CI limpio fallan.
- **Fix sugerido:** agregar `global-setup.ts` de Playwright que cree ese user vía API antes de la suite.

### 18. `TripStatusStepper` con 3 ConfirmDialogs hardcodeados
- **Archivo:** `src/frontend/src/components/trips/TripStatusStepper.tsx:150-176`
- **Detalle:** tres diálogos con el mismo handler, copy distinto. Cualquier cambio de UX hay que tocar tres lugares.
- **Fix sugerido:** declarar un array de `{key, title, description, confirmLabel, visible}` y mapear a `<ConfirmDialog>`.

### 19. `StatCard` con color sin narrow de tipo
- **Archivo:** `src/frontend/src/pages/DashboardPage.tsx:154`
- **Detalle:** `colors: Record<string, string>` con índice dinámico. Si pasás un typo, runtime undefined class (Tailwind no avisa).
- **Fix sugerido:** tipar `color: 'primary' | 'success' | 'accent' | 'warning'`.

---

## MEDIO

### 20. Clases Tailwind custom que no existen
- **Archivos:** `src/frontend/src/components/ui/Card.tsx:12`, `src/frontend/src/components/trips/TripCard.tsx:39`, `src/frontend/src/components/auctions/AuctionCard.tsx:43`, `src/frontend/src/pages/TripsPage.tsx:248`
- **Detalle:** `hover:shadow-card-hover`, `ring-offset-bg`. No están en `tailwind.config.js`. Tailwind los ignora silenciosamente.
- **Fix sugerido:** definir `boxShadow.card-hover` en la config o reemplazar por `shadow-md hover:shadow-lg`.

### 21. `lucide-react` v1.17.0 pinneado
- **Archivo:** `src/frontend/package.json:19`
- **Detalle:** versión del 2020. Se usa solo en `src/frontend/src/components/ui/Alert.tsx`, que no se monta en la app. Dead code.
- **Fix sugerido:** borrar `Alert.tsx` + la dep, o actualizar a una versión actual y empezar a usarla.

### 22. Config de Vite y Vitest duplicada
- **Archivos:** `src/frontend/vite.config.ts` y `src/frontend/vitest.config.ts`
- **Detalle:** mismo alias, mismo plugin, mismo setupFile. Cualquier cambio hay que hacerlo en dos lados.
- **Fix sugerido:** consolidar en `vite.config.ts` con `test: { ... }` dentro; borrar `vitest.config.ts`.

### 23. Componentes muertos
- **Archivos:** `src/frontend/src/components/trips/TripMap.tsx` y `src/frontend/src/components/auctions/BidHistory.tsx`
- **Detalle:** no se importan en ningún lado.
- **Fix sugerido:** borrar o usar.

### 24. `tsconfig.node.json` no incluye `tests/`
- **Archivo:** `src/frontend/tsconfig.node.json:10`
- **Detalle:** los specs e2e no se typechekkean.
- **Fix sugerido:** agregar `tests/**/*` al `include`.

### 25. ESLint config ausente
- **Archivo:** `src/frontend/package.json:10`
- **Detalle:** `lint` corre `eslint src --ext ts,tsx` pero no hay `.eslintrc*` ni `eslint.config.*` en `src/frontend/`. El script falla.
- **Fix sugerido:** agregar `eslint.config.js` flat config o `.eslintrc.cjs` legacy.

### 26. Polling duplica el WS de notificaciones
- **Archivo:** `src/frontend/src/components/notifications/NotificationBell.tsx:73`
- **Detalle:** polling cada 60s aunque el WS esté abierto. Si el WS está sano, trabajo al pedo y posibles race con updates del backend.
- **Fix sugerido:** trackear la última conexión WS exitosa; cortar el polling mientras esté abierto.

### 27. Enums de status desincronizados
- **Archivos:** `src/frontend/src/pages/TripsPage.tsx:31-41`, `src/frontend/src/pages/AuctionPage.tsx:25-31`, `src/frontend/src/utils/labels.ts`
- **Detalle:** cada página define su propio array de status. `tripStatusVariant` no incluye `AUCTION`. Status nuevo → N lugares para tocar.
- **Fix sugerido:** centralizar en `utils/labels.ts` con tipos `as const` y derivar options desde ahí.

### 28. `setAuth` sin validación de shape
- **Archivos:** `src/frontend/src/pages/LoginPage.tsx:18`, `src/frontend/src/pages/RegisterPage.tsx:70`
- **Detalle:** `setAuth(data.data, data.data.user)`. Si el backend cambia la forma, runtime error.
- **Fix sugerido:** definir un schema Zod en el boundary (ya tenés Zod como dep) y parsear antes de pasar al store.

### 29. `TripDetailPage` redefine labels que ya existen
- **Archivo:** `src/frontend/src/pages/TripDetailPage.tsx:62-79`
- **Detalle:** `statusLabels` y `cargoLabels` ya viven en `src/frontend/src/utils/labels.ts`. DRY violado.
- **Fix sugerido:** importar de `utils/labels.ts`.

### 30. `useWebSocket` y re-suscripción de listeners
- **Archivo:** `src/frontend/src/hooks/useWebSocket.ts:21`
- **Detalle:** `useEffect(() => addWsListener(onMessage), [onMessage])`. Si el componente se olvida del `useCallback`, cada render agrega un listener.
- **Fix sugerido:** documentar el requisito o usar una `ref` interna para estabilizar el callback.

### 31. Asunciones de shape sin defensive coding
- **Archivos:** `src/frontend/src/pages/ExplorePage.tsx:64`, `src/frontend/src/pages/AuctionPage.tsx:58`
- **Detalle:** `setX(data.data)` directo, sin fallback a `[]`. Mismo riesgo que #14.
- **Fix sugerido:** `setX(data.data ?? [])` consistente en todos los handlers de `useEffect` de fetch.

### 32. `MapContainer` se re-monta por cambios de filtro
- **Archivos:** `src/frontend/src/pages/ExplorePage.tsx`, `src/frontend/src/pages/TripsPage.tsx` (si hubiera mapa)
- **Detalle:** `key` dinámica fuerza remontaje. Caro en CPU y reinicia tiles cacheados.
- **Fix sugerido:** usar keys estables; mutar datos sin remontar la instancia.

### 33. Service worker con scope assumptions
- **Archivo:** `src/frontend/public/sw.js:5`
- **Detalle:** `APP_SHELL` con rutas absolutas (`/`, `/manifest.webmanifest`). Si deployás bajo subpath, falla.
- **Fix sugerido:** detectar scope en `install` y prefijar rutas.

### 34. Cache de trips declarado pero nunca leído
- **Archivo:** `src/frontend/src/hooks/useTrips.ts:72`
- **Detalle:** `const [cache] = useState(() => new Map())` se popula pero nunca se consulta. Dead state.
- **Fix sugerido:** implementar lectura o borrar la variable.

---

## BAJO

### 35. `whatsappLink` sin validación
- **Archivo:** `src/frontend/src/utils/geo.ts:67`
- **Detalle:** acepta cualquier string, filtra no-dígitos, y abre `https://wa.me/123`. Acepta un input vacío o de 3 dígitos.
- **Fix sugerido:** validar longitud mínima (8-15 dígitos) antes de armar el link.

### 36. `Alert.tsx` no se usa
- **Archivo:** `src/frontend/src/components/ui/Alert.tsx`
- **Detalle:** sin imports en la app. Dead code (junto con #21).

### 37. Falta `preload` de fuentes críticas
- **Archivo:** `src/frontend/index.html:11-13`
- **Detalle:** se cargan Inter y JetBrains Mono con `&display=swap` ✓, pero no hay `preload` de la WOFF2 crítica. FCP podría mejorar.
- **Fix sugerido:** agregar `<link rel="preload" as="font" type="font/woff2" crossorigin>` para Inter 400/500.

### 38. Constantes mágicas en componentes
- **Archivos:** `src/frontend/src/components/payments/PaymentCard.tsx:89` (8%), `src/frontend/src/components/auctions/BidForm.tsx:32` (10%)
- **Detalle:** comisión y decremento hardcodeados en el front. Si cambia el backend, hay que acordarse de tocar acá.
- **Fix sugerido:** mover a `src/frontend/src/config.ts` o recibir del backend en el payload.

### 39. e2e frágiles a copy
- **Archivo:** `src/frontend/tests/e2e/trips.spec.ts:25`
- **Detalle:** assertea que `<h1>` contiene "Viajes". Cambio de copy = CI roto.
- **Fix sugerido:** agregar `data-testid="page-title"` o usar selectores semánticos.

### 40. Tres archivos de mapa para un caso
- **Archivos:** `src/frontend/src/components/maps/LiveTrackingMap.tsx`, `src/frontend/src/components/maps/TripDetailMap.tsx`, `src/frontend/src/components/trips/TripMap.tsx`
- **Detalle:** `TripMap` no se usa. `LiveTrackingMap` y `TripDetailMap` comparten iconos y setup.
- **Fix sugerido:** borrar `TripMap.tsx` y extraer el setup de iconos a un módulo común.

### 41. `Button` con default `type="button"` inconsistente con uso en forms
- **Archivo:** `src/frontend/src/components/ui/Button.tsx:36`
- **Detalle:** las páginas usan `<button>` raw para submits; `Button` no se usa en ningún submit. Diseño paralelo.
- **Fix sugerido:** o migrar todos los forms a `<Button type="submit">`, o aceptar que `Button` es solo para acciones y dejarlo.

### 42. `useTrip` y `useAuction` sin cleanup
- **Archivos:** `src/frontend/src/hooks/useTrips.ts:130-160`, `src/frontend/src/hooks/useAuctions.ts:78-108`
- **Detalle:** el `useEffect` de fetch no aborta al unmount → setState on unmounted (React 18 lo ignora, pero es leak del response body).
- **Fix sugerido:** usar `AbortController` o pasar a TanStack Query.

### 43. `confirm` como nombre de variable
- **Archivo:** `src/frontend/src/components/auctions/BidDetailModal.tsx:35` y `TripStatusStepper.tsx:58`
- **Detalle:** palabra reservada en algunos configs/lints. Mejor `pendingAction` o `decision`.
- **Fix sugerido:** renombrar.

### 44. `displayPrice` con `||` confunde zero
- **Archivo:** `src/frontend/src/components/trips/TripCard.tsx:36`
- **Detalle:** `displayPrice = trip.auction?.currentPrice || trip.basePrice`. Si `currentPrice` es 0 (recién creada), cae a `basePrice`. Probablemente intencional pero confunde.
- **Fix sugerido:** `??` (nullish coalescing) si querés ese comportamiento, o un ternario explícito.

### 45. CSS globales sin reset de headings
- **Archivo:** `src/frontend/src/styles/globals.css:12-14`
- **Detalle:** `@apply font-bold` a h1-h6 puede romper jerarquía visual si más adelante querés h3 de otro peso.
- **Fix sugerido:** definir tamaños por nivel (`text-2xl` a h1, etc.) en vez de solo `font-bold`.

### 46. Falta `aria-label` en botones de cerrar modal
- **Archivo:** `src/frontend/src/components/ui/Modal.tsx:41`
- **Detalle:** tiene `aria-label="Close modal"` ✓, pero el ícono es `×` (caracter unicode), no un screen-reader-friendly name.
- **Fix sugerido:** usar `aria-label="Cerrar"` en español para consistencia con el resto de la app.

---

## Top 5 para fixear ya (orden de impacto)

1. **Tokens fuera de localStorage** (#1, #2) — seguridad real, base para todo lo demás.
2. **Dockerfile + PWA** (#4, #5) — prod se rompe silenciosa; impacta deploy.
3. **CI build verde** (#3) — si esto no pasa, nada de lo demás se valida en pipeline.
4. **Mapa con popup** (#9) y **remontaje de mapa** (#12) — bugs visibles, usuarios los ven.
5. **Perfil: borrar campos** (#8) — bug funcional, va a llegar como ticket de soporte.

---

## Métricas rápidas

- Archivos `.tsx` revisados: ~40
- Tests: 3 archivos (2 e2e, 1 unit de store, 2 de páginas)
- Cobertura observable: mínima. No hay reporte de coverage generado.
- Líneas de código aprox: ~2.7k en `src/`.
- Dependencias prod: 11. Dev: 21.
- Dead code detectado: `Alert.tsx`, `TripMap.tsx`, `BidHistory.tsx`, lucide-react v1.

---

## Próximos pasos sugeridos

- [ ] PR #1: seguridad (cookies httpOnly + limpieza de localStorage).
- [ ] PR #2: fix Dockerfile + nginx config.
- [ ] PR #3: build verde (unuseds, tsconfig, eslint).
- [ ] PR #4: bugs funcionales (mapa popup, profile clear, WS leak).
- [ ] PR #5: refactor (consolidar configs, eliminar dead code, centralizar enums).
