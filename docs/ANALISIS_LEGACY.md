# Análisis del proyecto legacy (PHP 2022) vs versión nueva

**Fecha:** 2026-06-12 · Legacy en `legacy/` (MVC PHP: API/Control/Model/Vista/JS + MySQL)

## Arquitectura legacy
Vista (HTML+JS vanilla) → fetch a `API/*.php?modo=...` → Control (sesiones PHP) →
Model (mysqli **sin prepared statements**) → MySQL. Tablas: Usuario, Empresa,
Trasportista, Publicacion, Subasta, Oferta, Viaje, Camion, Localidad, Provincia,
TipoDeCamion, TipoDecarga, Estado.

## Reglas de negocio rescatadas del legacy → estado en la nueva

| Regla legacy (archivo) | Nueva versión |
|---|---|
| **CUIT módulo 11** (`Control/validar.php:13-34`): multiplicadores [5,4,3,2,7,6,5,4,3,2], 11→0, 10→9 | ✅ Portado a `utils/cuit.ts` (back+front) + chequeo de prefijo; valida en register, perfil y zod |
| Contraseña fuerte (mayúsc/minúsc/dígito/especial, 8-20) | ✅ (sin el especial; agregar si querés paridad exacta) |
| Activación de cuenta por email con token | ✅ verify-email con token de 1 uso |
| Aceptar oferta = rechazar resto + cerrar subasta + crear viaje (`Model_subastas.php:130-139`) | ✅ idéntico + lock atómico + pago en custodia |
| Mis Postulaciones del camionero (`JS/Camionero/misPostulaciones.js`) | ✅ **implementado ahora**: página `/my-bids` con retiro de ofertas |
| Cascada Provincia→Localidad (`JS/Empresa/publicaciones.js:38-113`) | ✅ con API Georef (mejor que la tabla estática) |
| Borrar camión / borrar oferta | ✅ DELETE /trucks + PATCH /bids/:id/withdraw |
| Foto de perfil | ✅ **implementado ahora**: POST /users/me/avatar (multer, 2MB) |
| Distancias con Google Geocoding (`api_ubicacion.php`) | ✅ superado: OSRM con ruta real + tracking GPS en vivo |

## Lo que la nueva versión SUPERA al legacy
Subasta inversa con anti-sniping y countdown, tracking GPS en vivo, pagos con
custodia (MercadoPago), notificaciones en tiempo real, estadísticas, PWA,
verificación admin, y toda la seguridad: el legacy tenía **MD5 sin salt**,
**SQL injection** en todos los Models (concatenación directa), `mysql_escape_string`
deprecado, sin CSRF ni expiración de sesión — todo resuelto por diseño
(bcrypt, Prisma parametrizado, JWT, rate limiting).

## Wave1 del SDD (openspec) — estado

| Capability | Estado |
|---|---|
| `cuit-validation` | ✅ back + front (register, perfil) |
| `driver-bids-page` (/my-bids) | ✅ página + retiro con confirmación |
| `trips` mine=true ("Mis viajes") | ✅ backend + pestañas en /trips |
| `user-avatar-upload` | ✅ multer 2MB jpg/png/webp + UI en perfil + static /uploads |
| `driver-document-upload` | ✅ multer 5MB jpg/png/pdf + UI en perfil (User.documentsUrl[]) |
| `auction-type-ui` — SEALED | ✅ completo: montos ajenos redactados **en el backend** (no solo UI) + aviso de privacidad |
| `auction-type-ui` — DUTCH | ✅ completo: selector de tipo al publicar, motor de decremento determinístico (tick cada 15s), botón "¡Tomar!" con confirmación y adjudicación inmediata con lock |
| selección de tipo de subasta al publicar | ✅ `NewTripPage` + `POST /trips`/`/publish` aceptan `auctionType` y `reservePrice` (antes estaba hardcodeado OPEN) |
| documentos de camión | ✅ upload real con multer (reemplazó el placeholder fake-S3) |

## Bug crítico encontrado y corregido en esta pasada
El commit que agregó wave1 al backend declaró `driverLicenseUrl`/`documentsUrl`
en el schema **sin crear la migración** → las columnas no existían y **todas**
las queries que devolvían el modelo completo fallaban (register, login, trucks,
perfil…). Era la causa de "el register no funciona y los endpoints dan error".
Fix: migraciones `20260612090000_wave1_document_urls` y
`20260612091000_wave1_avatar_user_documents`.
