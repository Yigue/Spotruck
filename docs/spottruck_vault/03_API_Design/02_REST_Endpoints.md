# 02 - Endpoints REST de Spottruck

## 1. Estructura General de Endpoints

La API de Spottruck organiza sus endpoints en grupos funcionales que reflejan las diferentes áreas de negocio de la plataforma. Todos los endpoints comparten una estructura URL común: `https://api.spottruck.com/v1/{recurso}/{id_recurso}/{subrecurso}`. Los identificadores de recursos siguen el formato UUID v4, y se pasan como parte de la ruta URL cuando referencia recursos específicos, o como query parameters para filtros y búsquedas. La autenticación se realiza mediante el header `Authorization: Bearer {token_jwt}` en todos los endpoints excepto los de salud y autenticación inicial.

Los códigos de respuesta HTTP siguen las convenciones estándar de REST: 2xx indica éxito, 3xx indica redirección, 4xx indica errores del cliente (la solicitud es inválida), y 5xx indica errores del servidor (problemas internos). Las respuestas de éxito para operaciones de escritura devuelven el recurso creado o modificado completo en el body. Las respuestas de listado devuelven un objeto envolvente que incluye los datos, metadatos de paginación, y opcionalmente agregados o resumenes relacionados.

## 2. Autenticación y Gestión de Cuentas

### 2.1 Autenticación de Usuarios

**POST /v1/auth/register** — Registro de nuevo usuario. Body: `{ email, password, full_name, phone_number, user_type: "buyer" | "seller" }`. El email debe ser único en el sistema; si ya existe, devuelve 409 Conflict. La contraseña debe cumplir requisitos mínimos de 8 caracteres, al menos una mayúscula, un número y un carácter especial. En caso de éxito, devuelve `{ user_id, access_token, refresh_token, expires_in }`. El usuario creado queda automáticamente autenticado.

**POST /v1/auth/login** — Inicio de sesión. Body: `{ email, password, device_info: { platform, os_version, app_version } }`. Si las credenciales son válidas, devuelve tokens JWT y perfil de usuario básico. Si el account está bloqueado por múltiples intentos fallidos (bloqueo progresivo: 5 intentos = 15 min, 10 = 1 hora, 20 = 24 horas), devuelve 423 Locked con información del tiempo restante de bloqueo. El sistema detecta y registra dispositivos nuevos como medida de seguridad.

**POST /v1/auth/refresh** — Renovación de tokens. Body: `{ refresh_token }`. Utiliza el refresh token para obtener un nuevo par de access y refresh tokens. El refresh token utilizado queda invalidado y se genera uno nuevo (rotación). Si el refresh token ha expirado o es inválido, devuelve 401 Unauthorized requiriendo re-autenticación completa.

**POST /v1/auth/logout** — Cierre de sesión. Invalida el refresh token actual. No tiene body ni devuelve datos significativos, solo código 204 No Content. Esta operación permite al usuario cerrar sesión desde todos los dispositivos mediante el parámetro opcional `all_devices: true` en el body.

**POST /v1/auth/password/forgot** — Solicitud de recuperación de contraseña. Body: `{ email }`. Envía un email con un link de recuperación válido por 1 hora. El link contiene un token jwt específico para reset de contraseña con claim `purpose: "password_reset"`. Implementa rate limiting de 3 solicitudes por hora por IP para prevenir abuso.

**POST /v1/auth/password/reset** — Restablecimiento de contraseña. Body: `{ reset_token, new_password }`. El reset_token viene en el link enviado al email. Valida que el token sea válido, no haya sido utilizado, y no haya expirado. Tras el éxito, todas las sesiones existentes del usuario se invalidan por seguridad.

### 2.2 Perfil de Usuario

**GET /v1/users/me** — Obtiene el perfil del usuario autenticado. Devuelve datos completos del perfil incluyendo estadísticas agregadas (número de publicaciones activas, total de mensajes, fecha de registro). No requiere parámetros adicionales. Las respuestas se cachan en Redis durante 5 minutos para reducir carga en la base de datos.

**PATCH /v1/users/me** — Actualización parcial del perfil. Body: campos opcionales `{ full_name, phone_number, profile_picture_url, bio, location }`. Solo se actualizan los campos proporcionados. Los campos no enviados mantienen su valor actual. Valida formatos (teléfono con código de país, imagen URL con formato válido).

**DELETE /v1/users/me/account** — Eliminación de cuenta de usuario. Operation destructiva que requiere confirmación mediante password en el body: `{ password, confirmation_phrase: "ELIMINAR MI CUENTA" }`. La eliminación es suave (soft delete) y reversible durante 30 días; después, los datos se eliminan permanentemente de acuerdo a las políticas de retención.

## 3. Gestión de Publicaciones de Camiones

### 3.1 CRUD de Publicaciones

**GET /v1/trucks** — Listado de publicaciones con filtros. Query params: `limit` (default 20, max 100), `cursor`, `price_min`, `price_max`, `year_min`, `year_max`, `make`, `model`, `truck_type`, `condition`, `location_lat`, `location_lng`, `radius_km`, `status`, `sort_by` (relevance, price_asc, price_desc, date_desc, distance). Devuelve array de truck objects y pagination metadata con next_cursor y has_more.

**POST /v1/trucks** — Creación de nueva publicación. Body: `{ title, make, model, year, price, truck_type, condition, mileage, description, location: { lat, lng, address }, images: [url1, url2, ...], specifications: { engine, transmission, drivetrain, fuel_type, sleeper_cabin, axle_config } }`. El usuario debe tener rol seller o admin. Las imágenes se suben separadamente mediante el endpoint de upload (ver sección de medios). Valida que year no sea futuro, price sea positivo, y location sea coordenadas válidas.

**GET /v1/trucks/{truck_id}** — Detalle de publicación específica. Devuelve el truck object completo incluyendo todas las especificaciones, imágenes ordenadas (primera como封面), ubicación, stats de vistas y favoritos, información del vendedor (solo nombre y verificación, sin datos de contacto directos para proteger privacidad hasta que se establezca contacto). Incluye timestamps de creación y última modificación.

**PATCH /v1/trucks/{truck_id}** — Actualización de publicación. Body: campos a modificar del mismo esquema que POST (todos opcionales). Solo el dueño de la publicación o admins pueden modificarla. Si la publicación tiene vistas activas, los cambios menores no generan notifications; cambios significativos en precio o disponibilidad generan alertas a usuarios que han guardado la publicación.

**DELETE /v1/trucks/{truck_id}** — Eliminación de publicación. Elimina la publicación y todas sus imágenes asociadas. Requiere que el usuario sea dueño de la publicación o admin. Las imágenes en storage se marcan para eliminación asíncrona tras un período de gracia de 24 horas en caso de recuperación accidental.

### 3.2 Búsqueda y Filtrado Avanzado

**GET /v1/trucks/search** — Búsqueda textual avanzada. Query params: `q` (búsqueda en título y descripción), `limit`, `cursor`, más todos los filtros disponibles en GET /trucks. Utiliza Elasticsearch para búsqueda full-text con soporte de sinónimos (ej: "camión de carga" y "truck de carga" se consideran equivalentes), stemming en español, y fuzzy matching para manejar errores tipográficos.

**GET /v1/trucks/{truck_id}/similar** — Recomendaciones de camiones similares. Utiliza algoritmo de content-based filtering basado en especificaciones técnicas, precio y ubicación. Devuelve hasta 10 trucks relacionados ordenados por score de similitud. Este endpoint se utiliza para la sección "Camiones similares" en la vista de detalle.

**GET /v1/trucks/featured** — Publicaciones destacadas. Devuelve hasta 20 trucks marcados como featured por el algoritmo de curación o por pago de promoción. Estas publicaciones aparecen prioritariamente en listados públicos y en secciones promocionales de la aplicación.

## 4. Sistema de Mensajería

### 4.1 Conversaciones

**GET /v1/conversations** — Listado de conversaciones del usuario. Devuelve conversaciones ordenadas por última actividad. Incluye preview del último mensaje, contador de mensajes no leídos, y metadata del participante (para el caso de conversaciones buyer-seller, incluye información resumida del truck relacionado). Soporta paginación con cursor.

**POST /v1/conversations** — Creación de nueva conversación. Body: `{ recipient_user_id, truck_id, initial_message }`. Valida que el destinatario exista, que el truck_id corresponda a una publicación activa, y que el usuario no esté intentando iniciar conversación consigo mismo. Crea la conversación y envía el primer mensaje atómicamente.

**GET /v1/conversations/{conversation_id}** — Detalle de conversación con mensajes. Devuelve metadata de la conversación y los mensajes paginados. Los mensajes se cargan con cursor para permitir scroll infinito. Incluye información de ambos participantes y referencia al truck relacionado.

**PATCH /v1/conversations/{conversation_id}** — Actualización de ajustes de conversación. Body: `{ muted: boolean, blocked: boolean }`. Permite al usuario silenciar una conversación (desactiva notificaciones push) o bloquear al otro participante (previene futuros mensajes).

### 4.2 Mensajes

**GET /v1/conversations/{conversation_id}/messages** — Listado de mensajes en conversación. Query params: `limit` (default 50, max 200), `cursor` (basado en message_id y timestamp para estabilidad). Los mensajes incluyen: message_id, sender_id, content, timestamp, status (sent, delivered, read), y opcionalmente attachments.

**POST /v1/conversations/{conversation_id}/messages** — Envío de mensaje. Body: `{ content, attachments: [attachment_id, ...] }`. El contenido tiene límite de 2000 caracteres. Los attachments deben ser uploads previos completados. El mensaje se crea inmediatamente con status "sent", y el sistema procesa la entrega asíncronamente actualizando a "delivered" cuando el destinatario está conectado.

**POST /v1/conversations/{conversation_id}/messages/{message_id}/read** — Marcación de mensaje como leído. Body vacío. Actualiza el status del mensaje a "read" y decrementa el contador de mensajes no leídos de la conversación. Cuando todos los mensajes de una conversación están leídos, la conversación pierde el badge de no leídos.

**DELETE /v1/conversations/{conversation_id}/messages/{message_id}** — Eliminación de mensaje (solo para el emisor). Solo el usuario que envió el mensaje puede eliminarlo. El mensaje se marca como eliminado para el emisor; el destinatario sigue viendo el contenido original (modelo de "deleted for me" pero no "deleted for everyone").

## 5. Gestión de Medios y Archivos

### 5.1 Upload de Imágenes

**POST /v1/media/upload** — Subida de archivo multimedia. Body: multipart/form-data con campo `file`. Soporta formatos JPEG, PNG, WebP con límite de 10MB por archivo. Devuelve `{ attachment_id, url, thumbnail_url, size_bytes, width, height }`. Las imágenes se procesan asíncronamente para generar thumbnails y optimizar el tamaño. El attachment_id se utiliza posteriormente para asociar la imagen a trucks o messages.

**DELETE /v1/media/{attachment_id}** — Eliminación de archivo multimedia. Solo usuarios que son dueños del recurso asociado (truck o message) pueden eliminar attachments. Los archivos se eliminan asíncronamente del storage; las URLs públicas pueden seguir funcionando hasta 1 hora adicional por caché.

### 5.2 Gestión de Avatares

**POST /v1/users/me/avatar** — Actualización de avatar de perfil. Body: `{ attachment_id }` (referencia a upload previo) o multipart/form-data con campo `file` para upload directo. Genera automáticamente thumbnail de 150x150px y avatar de 64x64px. Elimina el avatar anterior si existía.

## 6. Favoritos y Guardados

**GET /v1/users/me/favorites** — Listado de trucks guardados como favoritos. Devuelve trucks en formato estándar con pagination. Incluye fecha en que se agregó a favoritos.

**POST /v1/favorites** — Agregar truck a favoritos. Body: `{ truck_id }`. Si el truck ya está en favoritos, devuelve 200 OK sin duplicar. Creación atómica idempotente.

**DELETE /v1/favorites/{truck_id}** — Remover truck de favoritos. No devuelve body en caso de éxito (204). Silently succeed si el truck no estaba en favoritos (idempotente).

## 7. Notificaciones

**GET /v1/notifications** — Listado de notificaciones del usuario. Query params: `limit`, `cursor`, `unread_only` (boolean). Las notificaciones incluyen tipos: new_message, new_offer, price_change, truck_status_change, recommendation, y system. Cada notificación tiene un link_to que indica qué recurso se debe abrir al tocarla.

**PATCH /v1/notifications/{notification_id}** — Marcar notificación como leída. Body: `{ read: true }`.

**PATCH /v1/notifications/mark-all-read** — Marcar todas las notificaciones como leídas. Body vacío. Devuelve `{ updated_count: number }`.

**DELETE /v1/notifications/{notification_id}** — Eliminación de notificación individual. No afecta el contador de no leídos.

## 8. Pagos y Transacciones

**POST /v1/payments/initiate** — Iniciar proceso de pago para features premium. Body: `{ payment_type: "promote_listing" | "premium_subscription", item_id, payment_method: "card" | "bank_transfer" }`. Devuelve `{ payment_id, amount, currency, payment_url }` para métodos que requieren redirección fuera de la app.

**GET /v1/payments/{payment_id}** — Estado de transacción de pago. Devuelve `{ status: "pending" | "completed" | "failed" | "refunded", amount, currency, payment_method, transaction_date, receipt_url }`.

**GET /v1/users/me/payment-history** — Historial de pagos del usuario. Lista paginada de todas las transacciones. Useful para reportes financieros del lado del usuario.

## 9. Endpoints de Sistema y Utilidades

**GET /health** — Health check general. Devuelve `{ status: "ok", timestamp, version, environment }`. No requiere autenticación. Utilizado por load balancers y sistemas de monitoreo para determinar si el servicio está activo.

**GET /health/ready** — Readiness probe. Verifica conexiones a bases de datos, Redis, Elasticsearch, y servicios externos. Devuelve `{ status: "ready" | "not_ready", checks: { db: bool, cache: bool, search: bool } }`. Kubernetes utiliza este endpoint para determinar cuándo incluir el pod en el pool de tráfico.

**GET /v1/util/countries** — Lista de países soportados con sus códigos ISO. Útil para formularios de registro y configuración de ubicación.

**GET /v1/util/truck-makes** — Lista de marcas de camiones soportadas. Incluye tanto manufacturers populares como opciones para tipos específicos de trucks.

**GET /v1/util/truck-types** — Catálogo de tipos de trucks: semi-truck, box truck, flatbed, tanker, dump truck, pickup, etc. Cada tipo tiene identificadores que se usan en filtros y especificaciones.

---

*Última actualización: Junio 2026*
*Equipo de Ingeniería de Spottruck*
