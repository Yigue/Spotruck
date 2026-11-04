# Plan de paridad completa con el proyecto original (informe + presentación) y diseño moderno

Fuentes: *Informe Proyecto Spotruck* (E.E.S.T. N°3 «Roberto Arlt», Malvinas Argentinas; Riedel, Basaldúa, Villanueva),
*presentación spotrack.pdf*, app legacy PHP (`legacy/`) y SDD (`openspec/`).

## 1. Qué prometía el proyecto original

**Problema:** industrias, productores agropecuarios e individuos no encuentran logística; los conductores no encuentran viajes
(ej.: el camión que lleva madera de Misiones a Buenos Aires necesita un viaje de **vuelta**; en cosecha hay alta demanda de logística).
**Objetivo:** acelerar el contacto y la intermediación entre ambos lados. **Método:** subastas — la empresa publica, los transportistas ofertan, la empresa elige.
**Beneficios declarados:** ahorra tiempo · comunicación rápida · más competitividad · ahorro de dinero · más posibilidades · estadísticas y gráficos.

## 2. Matriz de trazabilidad (guía de usuario del informe → app actual)

| # | Función original | Estado | Dónde está hoy |
|---|---|---|---|
| **Camionero** | | | |
| C1 | Registrarse como camionero | ✅ | `/register?role=DRIVER` |
| C2 | Registrar camión(es) y modificarlos/borrarlos | ✅ | `/profile` → flota (+ documentos por camión) |
| C3 | Ver publicaciones de su zona sobre un **mapa** con marcadores | ✅ → mejora | `/explore` (+ lista, búsqueda por destino/«viaje de vuelta», cercanía) |
| C4 | Detalle: origen, destino, **distancia**, fecha, peso, tipo de carga, **duración** | ✅ | `/trips/:id` |
| C5 | Ver perfil/estrellas de la empresa | ✅ | modal de perfil + opiniones |
| C6 | Postularse: elegir camión, precio, aclaración | ✅ | `BidForm` (OPEN / DUTCH / SEALED) |
| C7 | Mis postulaciones: modificar / retirar | ✅ | `/my-bids` |
| C8 | Esperar confirmación; ser aceptado | ✅ | notificaciones en tiempo real |
| C9 | Ir notificando estados: preparándose → en viaje → esperando confirmación → finalizado (con confirmaciones «¿Estás seguro?») | ✅ | `TripStatusStepper` |
| C10 | Calificar a la empresa con estrellas + comentario | ✅ | `RatingForm` |
| **Empresa** | | | |
| E1 | Registrarse como empresa (CUIT validado) | ✅ | `/register?role=COMPANY` |
| E2 | Publicar viaje con origen/destino sobre mapa, fecha, peso, carga | ✅ | `/trips/new` |
| E3 | Ver postulantes en tabla comparativa + «Nadie se postuló todavía» | ✅ | `BidList` |
| E4 | Detalle del postulante (viajes realizados, camión, capacidad, precio, fecha, aclaración, WhatsApp) | ✅ | `BidDetailModal` |
| E5 | Ver perfil y **opiniones** que dejaron sobre el transportista | 🟡 → ✅ | perfil público con reseñas (este plan) |
| E6 | Aceptar / rechazar con confirmación | ✅ | `BidDetailModal` |
| E7 | Seguir el estado del viaje hasta que finaliza y confirmar | ✅ | stepper + GPS en vivo |
| E8 | Calificar al transportista | ✅ | `RatingForm` |
| **Transversal** | | | |
| T1 | **Mapa / Satélite** en los mapas (original usaba Google Maps con ambas vistas) | ❌ → ✅ | selector de capas (este plan) |
| T2 | Estadísticas y gráficos | ✅ | `/stats` |
| T3 | Diseño mobile-first | ✅ | barra inferior + responsive |
| T4 | Portada / explicación del proyecto (problema, objetivo, beneficios) | 🟡 → ✅ | landing ampliada (este plan) |
| T5 | **Guía de usuario** (pasos por rol) | ❌ → ✅ | `/ayuda` pública (este plan) |
| T6 | «Viaje de vuelta»: el transportista busca por destino/zona | ❌ → ✅ | búsqueda de texto + cercanía (este plan) |

## 3. Mejoras ya presentes sobre el original
Subastas OPEN/DUTCH/SEALED con anti-sniping, GPS en vivo, pago en custodia (MercadoPago), notificaciones en tiempo real,
verificación de transportistas por admin, recuperación de contraseña, bcrypt + JWT + rate-limit, privacidad por rol, PWA.

## 4. Trabajo de esta etapa (orden de ejecución)
1. **Mapas:** selector Mapa/Satélite compartido (Explore, detalle, seguimiento, nuevo viaje).
2. **Explorar / «viaje de vuelta»:** vista Mapa|Lista, búsqueda por texto (origen/destino), «cerca de mí», orden por fecha/precio. Backend: parámetro `q` en `GET /trips`.
3. **Reseñas visibles:** el perfil público muestra las opiniones recibidas (`GET /ratings/user/:id`).
4. **Portada ampliada + Guía de usuario (`/ayuda`)** con el contenido del informe.
5. **Diseño:** revisión visual responsive de todas las pantallas, coherencia de componentes.
6. **Tests + docs:** unit/integration/e2e/browser; actualizar `docs/documentacion/`.
