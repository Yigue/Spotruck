# Análisis de paridad de páginas — Legacy (PHP/HTML) vs App actual (React)

Fecha: 2026-07-02
Metodología: SDD (spec-driven) según `skills/sdd-workflow`. Este análisis alimenta el change
OpenSpec `wave1-missing-pages-and-validation` (proposal + design + 8 specs ya aprobados).

Estados: ✅ Completa · 🟡 Parcial (falta funcionalidad del legacy) · ❌ Falta

## Mapa página por página

| # | Página legacy | Función en legacy | Equivalente actual | Estado |
|---|---|---|---|---|
| 1 | `index.html` / `Vista/Menu/index.html` | Landing / menú de entrada | Redirect a `/login` → `/dashboard` | ✅ (decisión de diseño: app autenticada, sin landing pública) |
| 2 | `Vista/Login/login.html` | Login email+password | `LoginPage.tsx` | ✅ Moderna, con forgot/reset password que el legacy no tenía |
| 3 | `Vista/register.html` | Registro con elección de rol | `RegisterPage.tsx` (multi-step) | 🟡 Falta validación CUIT mod-11 (legacy: `Control/cuit_validator.php`) |
| 4 | `Vista/Empresa/registerEmpresa.html` | Alta de empresa (CUIT, datos) | `RegisterPage.tsx` paso 2 rol COMPANY | 🟡 Mismo gap de CUIT |
| 5 | `Vista/Camionero/registerCamion.html` | Alta de camión | `ProfilePage.tsx` sección flota (CRUD camiones) | ✅ |
| 6 | `Vista/Camionero/Camiones.html` | "Mis Camiones" listar/borrar/modificar | `ProfilePage.tsx` flota | ✅ |
| 7 | `Vista/Camionero/paginaCamionero.html` | Home camionero: publicaciones para postularse | `ExplorePage.tsx` + `DashboardPage.tsx` | ✅ |
| 8 | `Vista/Camionero/postularse.html` | Form de postulación (camión, precio, aclaración) | `TripDetailPage.tsx` + `BidForm.tsx` | 🟡 Solo cubre subasta OPEN; falta UI diferenciada DUTCH (¡Tomar!) y SEALED (oferta privada) |
| 9 | `Vista/Camionero/misPostulaciones.html` | "Mis Postulaciones" con modificar/retirar | — | ❌ **Falta página `/my-bids`** (backend `GET /bids/me` + `PATCH /bids/:id/withdraw` ya existen) |
| 10 | `Vista/Empresa/paginaEmpresa.html` | Home empresa | `DashboardPage.tsx` | ✅ Con stats y gráficos (mejora sobre legacy) |
| 11 | `Vista/Empresa/publicaciones.html` | Crear publicación (origen/destino/fechas/carga) | `NewTripPage.tsx` | ✅ Con mapa y geocoding (mejora) |
| 12 | `Vista/Empresa/verPublicacion.html` | Ver postulantes, aceptar/rechazar | `TripDetailPage.tsx` + `BidList.tsx` + `BidDetailModal.tsx` | ✅ |
| 13 | `Vista/Empresa/verViaje.html` | Datos publicación + camionero + camión | `TripDetailPage.tsx` (stepper + tracking GPS) | ✅ Mejora: tracking en vivo |
| 14 | `Vista/perfil.html` | Perfil: correo, CUIT, nombre, teléfono, avatar | `ProfilePage.tsx` | 🟡 Falta subida de avatar (legacy tenía `img/avatar/`), subida de documentación del chofer y validación CUIT al guardar |
| 15 | Listado propio de viajes (mezclado en `publicaciones.html`) | Ver mis publicaciones | `TripsPage.tsx` | 🟡 Falta filtro "Mis viajes" (`?mine=true`) — hoy la lista mezcla todos |

## Gaps a cerrar (Wave 1 — spec aprobada en `openspec/changes/wave1-missing-pages-and-validation`)

1. **`/my-bids` (MyBidsPage)** — página nueva DRIVER con filtros por estado y retiro de oferta.
2. **Toggle "Mis viajes"** en `TripsPage` — `GET /trips?mine=true` scoping por rol.
3. **UI DUTCH/SEALED** — `BidForm` ramifica por `auction.type`; `BidList` redacta montos en SEALED.
4. **Avatar upload** — `POST /users/me/avatar` (multer, 2MB, jpg/png/webp) + sección en perfil.
5. **Documentación del chofer** — `POST /users/me/documents` (multer, 5MB, jpg/png/pdf) + sección en perfil.
6. **Validación CUIT mod-11** — `utils/cuit.ts` usado en registro y perfil (paridad con `cuit_validator.php`).

## Mejoras de la app actual sobre el legacy (ya presentes)

- Subastas con anti-sniping, countdown y tiempo real (WebSocket).
- Tracking GPS en vivo con Leaflet.
- Pagos MercadoPago con hold/release y comisión 8%.
- Ratings bidireccionales, notificaciones, estadísticas con gráficos, PWA.
- Verificación de email, reset de contraseña, verificación de transportistas.

## Deuda conocida (fuera de Wave 1, ver `docs/AUDITORIA_FRONTEND.md`)

Tokens en localStorage, Dockerfile prod, redacción SEALED server-side, S3 para uploads.
