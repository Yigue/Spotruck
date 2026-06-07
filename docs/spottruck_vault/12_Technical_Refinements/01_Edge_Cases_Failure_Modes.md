# Análisis de Casos Extremos y Modos de Fallo — Spottruck

## 1. Casos Extremos en Subastas

### 1.1 Envío Simultáneo de Ofertas

**Escenario**: Dos transportistas envían una oferta con el mismo precio exactamente al mismo milisegundo.

**Prevención**: Se utiliza una transacción de base de datos con `SELECT FOR UPDATE` sobre la publicación. Este mecanismo de bloqueo a nivel de fila garantiza que solo una transacción pueda modificar el estado de la publicación simultáneamente. Cuando ambos procesos intentan adquirir el lock, el segundo queda en espera hasta que el primero libere el recurso.

**Resolución**: En caso de simultaneous bids, gana la oferta cuyo `trace_id` sea anterior. Para determinar la prioridad se comparan timestamps a nivel de microsegundo. El sistema de logging registra el momento exacto de recepción de cada oferta mediante reloj atómico sincronizado con NTP.

**Alternativa**: Como estrategia secundaria, se puede implementar first-come-first-served basado en el orden de commit en la base de datos. Esto requiere que la capa de persistencia registre el orden de confirmación de cada transacción.

**Métricas de monitoreo**: Se registren el número de condiciones de carrera detectadas, el tiempo promedio de espera para adquisición de lock, y el porcentaje de ofertas afectada por este escenario.

### 1.2 Oferta Durante Ventana de Extensión

**Escenario**: Una oferta se coloca en t-10 segundos, provocando una extensión de 5 minutos. Luego, otra oferta llega en t+4:55 (dentro de la nueva ventana).

**Comportamiento**: Se dispara otra extensión, ya que la nueva oferta cae dentro de los últimos 5 minutos del nuevo período. El sistema recalcula el tiempo restante y aplica la misma regla de extensión.

**Límite**: Se establece un máximo de 3 extensiones consecutivas para prevenir extensiones infinitas. Este límite se aplica por sesión de auction, no por oferta individual. Una vez alcanzado el límite de extensiones, ninguna oferta adicional puede extender la duración.

**Visualización**: Se muestra el contador de extensiones a todos los participantes de la auction. La interfaz presenta un indicador visible de "Extensión #X de 3" para mantener transparencia.

**Comunicación**: Cada extensión genera una notificación a todos los participantes registrados. El mensaje incluye el nuevo tiempo de finalización y el precio actual de la oferta más alta.

### 1.3 Falla de Red Durante la Oferta

**Escenario**: El transportista envía una oferta, pero la red falla antes de recibir la confirmación.

**Comportamiento del cliente**: Se muestra el estado pending al usuario. El cliente implementa un mecanismo de retry con hasta 3 intentos y exponential backoff (1s, 2s, 4s). Durante el período de retry, la UI muestra un indicador de "Confirmando oferta...".

**Comportamiento del servidor**: La creación de ofertas es idempotente. Si el cliente recibe un `bid_id` de vuelta, la oferta fue procesada exitosamente. El servidor utiliza el `idempotency_key` proporcionado por el cliente para detectar duplicados.

**Recuperación**: Después de agotar los retries, el cliente debe hacer polling del estado de la publicación. Se implementa un endpoint `/publications/{id}/status` que devuelve el estado actual incluyendo la oferta del usuario si fue confirmada.

**Logs de auditoría**: Cada intento de oferta genera un log con el idempotency_key, el resultado, y el tiempo transcurrido. Estos logs permiten reconstruir la historia de cualquier problema de conectividad.

### 1.4 Publicación Modificada Durante la Auction

**Escenario**: Una empresa-editar la publicación (tipo de carga, peso) mientras la auction está activa.

**Regla**: Solo se permiten modificaciones en campos no críticos como descripción y fotos. Cualquier cambio que no afecte la naturaleza fundamental de lo que se está subastando está permitido.

**Prohibido**: No se puede cambiar origen/destino, tipo de carga o peso después de que se haya recibido la primera oferta. Esta restricción se aplica incluso si la oferta fue posteriormente retirada.

**Procedimiento de corrección**: Si se necesita cambiar un campo crítico, la publicación debe ser cancelada y se debe crear una nueva. El sistema invalidará todas las ofertas asociadas a la publicación cancelada y notificará a los transportistas afectados.

**Compensación**: La empresa no pierde el dinero depositado como garantía al crear la publicación original, ya que la cancelación fue por decisión propia. El historial de cancelaciones se registra para análisis futuro.

## 2. Casos Extremos de Pago

### 2.1 Doble Liberación de Pago

**Escenario**: El viaje se marca como completo dos veces (doble clic o condición de carrera).

**Prevención**: Se verifica el estado del pago antes de realizar la liberación. Se utiliza una transacción de base de datos con bloqueo pesimista. Antes de procesar el release, el sistema verifica que `payment_status = 'pending'` y establece `payment_status = 'released'` atómicamente.

**Idempotencia**: El segundo intento de liberación retorna el registro de pago existente sin realizar ninguna modificación. Se incluye el `original_payment_id` en la respuesta para indicar que la operación ya fue procesada.

**Auditoría**: Se registran todas las operaciones de pago con `trace_id` incluyendo timestamp, usuario, monto y resultado. Los logs de pago se almacenan en una tabla separada con retention de 7 años por requisitos regulatorios.

**Monitoreo**: Se configura una alerta cuando se detecta más de un intento de liberación para el mismo payment_id. Este patrón puede indicar un intento de fraude o un bug en la implementación del cliente.

### 2.2 Timeout de Custodia (Escrow)

**Escenario**: El pago permanece en custodia pero el viaje nunca se completa dentro de los 30 días.

**Regla**: Auto-liberación del escrow al transportista después de 30 días si el viaje no está en disputa. El sistema ejecuta un job nocturno que identifica custodias pendientes mayores a 30 días y procesa la liberación automática.

**Advertencia**: Se envía notificación por email al día 25提醒 al usuario sobre el deadline próximo. El email incluye un enlace directo para realizar la calificación o abrir una disputa.

**Excepción**: Si se abre una disputa, el escrow permanece bloqueado hasta que se resuelva. El estado de la disputa se registra junto con el escrow y no permite ninguna operación de liberación hasta resolución final.

**Resolución de disputas**: El equipo de soporte revisa las disputas manualmente. Se evalúa evidencia de ambas partes (chat, fotos de delivery, signatures) antes de tomar una decisión.

### 2.3 Falla del Gateway de Pago

**Escenario**: La API de MercadoPago devuelve 503 durante el procesamiento del pago.

**Retry**: Se intentan 3 intentos con exponential backoff (1s, 2s, 4s). Cada retry incluye un nuevo `request_id` para evitar problemas de duplicación en el lado del gateway.

**Fallback**: Se muestra un error al usuario con un mensaje claro. Se ofrece la opción de reintentar más tarde. El usuario recibe un código de referencia para soporte.

**Estado**: El estado del viaje permanece como 'confirmed' hasta que el pago se confirme. No se permite iniciar el viaje sin confirmación de pago.

**Monitoreo**: Se configura una alerta si el payment gateway está caído por más de 5 minutos. Esta alerta notifica al equipo de operaciones via PagerDuty. Se mantiene un dashboard de estado del gateway accesible al equipo.

### 2.4 Fondos Insuficientes en el Momento del Cargo

**Escenario**: El usuario tiene fondos insuficientes cuando se intenta cargar el hold inicial.

**Comportamiento**: El sistema registra el intento fallido y decrementa el contador de intentos del usuario. Se permite reintentar hasta 3 veces en 24 horas.

**Notificación**: Se envía un email al usuario explicando la situación. El email incluye las opciones disponibles: agregar fondos, usar otra tarjeta, o esperar hasta que tenga fondos disponibles.

**Impacto en la auction**: Si el hold no puede ser procesado, la empresa no puede crear nuevas publicaciones. Las publicaciones existentes no se ven afectadas.

### 2.5 Chargeback o Reversión de Pago

**Escenario**: El banco revierte un pago por motivo de disputa del titular de la tarjeta.

**Proceso de resolución**: Se abre un ticket de disputa en el sistema. Ambas partes (empresa y transportista) reciben notificación y pueden enviar evidencia.

**Resultado posible**: Si el chargeback es resuelto a favor de Spottruck, se mantiene el pago. Si se resuelve a favor del cliente, se genera un debit note y se retiene de futuros pagos al transportista.

**Medida preventiva**: Se implementa un sistema de reputación donde transportistas con múltiples chargebacks recibe warnings y eventualmente suspensión.

## 3. Casos Extremos de Ratings

### 3.1 Ambas Partes Califican Simultáneamente

**Cálculo**: Las calificaciones son individuales y no se bloquean mutuamente. Cada calificación se procesa de forma independiente y se persiste inmediatamente.

**Visualización**: Se muestra la calificación parcial cuando solo se ha recibido una. La interfaz presenta "¿Esperando calificación de [Nombre]?" con el estado actual de la rating.

**Cálculo de promedio**: Se incluyen las calificaciones parciales en el promedio. El promedio pondera por cantidad de calificaciones recibidas, no por tiempo. Un transportista con 4.5 de 2 calificaciones se muestra diferente a uno con 4.5 de 50 calificaciones.

**Métricas de transparencia**: Se muestra la cantidad total de calificaciones recibidas junto con el promedio. Esto ayuda a los usuarios a contextuar el rating.

### 3.2 Calificación Después del Deadline

**Escenario**: El usuario intenta enviar una calificación 31 días después de la completion.

**Respuesta**: Se rechaza con un mensaje explicando la ventana de 30 días. El mensaje incluye la fecha límite exacta y la fecha de completion del viaje.

**Evidencia**: Se almacena el timestamp de completion en el registro del viaje. Este timestamp es inmutable y se utiliza para calcular la elegibilidad de rating.

**Extensión por dispute**: Si hay una disputa abierta, la ventana de rating se pausa. Una vez resuelta la disputa, el usuario tiene 30 días desde la resolución para completar la calificación.

### 3.3 Intento de Auto-Calificación

**Prevención**: No se puede calificarse a uno mismo. Se implementa una validación `from_user_id != to_user_id` en la capa de aplicación y como constraint de base de datos.

**Respuesta**: Se retorna un error de validación con código `RATING_001`. El mensaje indica que no es posible calificarse a uno mismo y sugiere dejar la calificación para la otra parte.

### 3.4 Calificación de Viajes Cancelados

**Regla**: Solo los viajes completados pueden ser calificados. Los viajes cancelados antes de ser asignados a un transportista no son elegibles para rating.

**Cancelación después de asignación**: Si el viaje se cancela después de que el transportista aceptó, se permite al transportista dejar feedback sobre la experiencia. Este feedback no afecta el rating de la empresa pero se registra para análisis.

## 4. Casos Extremos de Sesión y Auth

### 4.1 Login Concurrente

**Máximo de sesiones**: 3 por usuario. Este límite es configurable por rol de usuario.

**Cuarta sesión**: Se invalida la sesión más antigua (LRU - Least Recently Used). El sistema identifica la sesión con el timestamp `last_access` más antiguo y la invalida automáticamente.

**Visualización**: Se muestra la lista de sesiones activas en el perfil del usuario. Cada sesión muestra: dispositivo, ubicación aproximada, última actividad y opción de invalidar manualmente.

**Seguridad adicional**: Se envía una notificación por email cuando se detecta una nueva sesión desde un dispositivo no reconocido. El email incluye detalles de la sesión y un link para invalidar si no fue el usuario.

### 4.2 Condición de Carrera en Refresh Token

**Escenario**: Dos requests intentan hacer refresh del token simultáneamente.

**Prevención**: Se utiliza rotación de refresh token. Cada uso genera un nuevo refresh token. El refresh token anterior se incluye en una blacklist inmediatamente después de su uso.

**Token anterior**: Una vez que el refresh token es usado, se blacklista. Cualquier uso posterior del token antiguo será rechazado con `AUTH_004`.

**Detección**: Si un nuevo refresh token se usa después de haber sido reemplazado, se invalidan todas las sesiones del usuario como medida de seguridad. Este comportamiento indica potencial compromiso del token.

**Logging de seguridad**: Cada intento de uso de token invalidade se loguea con IP, device fingerprint, y timestamp. Estos logs se revisan para detectar patrones de ataque.

### 4.3 Refresh Token Expirado

**Respuesta**: HTTP 401 Unauthorized con código de error `AUTH_005`. El response incluye información sobre cómo obtener nuevos tokens.

**Acción del cliente**: Redirigir al usuario a la pantalla de login. No intentar re-authentication automática para evitar loops.

**Preservación de datos**: Antes de proceder al login, el cliente guarda datos de draft en localStorage. Esto incluye formularios incompletos, navegación en progreso y cualquier dato de usuario no persistido.

### 4.4 Recuperación de Contraseña

**Flujo de recuperación**: El usuario solicita reset via email. Se genera un token válido por 1 hora. El usuario hace click en el link y proporciona nueva contraseña.

**Seguridad**: El token de reset es de un solo uso. Una vez utilizado, se invalida. Si el usuario no completa el proceso, el token expira después de 1 hora.

**Rate limiting**: Máximo 3 solicitudes de reset por hora por cuenta. Esto previene ataques de enumeración de cuentas.

## 5. Fallos de Consistencia de Datos

### 5.1 Conexión a Base de Datos Perdida Durante Transacción

**Comportamiento**: La transacción hace rollback automáticamente. El driver de base de datos detecta la desconexión y revierte todos los cambios pendientes.

**Cliente**: Se reintenta la operación completa. El cliente implementa idempotency_key para evitar efectos secundarios duplicados.

**Idempotencia**: Se incluye idempotency_key en requests de operaciones críticas. El servidor almacena estos keys con un TTL de 24 horas para detectar y rechazar duplicados.

**Verificación**: Después de cualquier error de red o timeout, el cliente puede hacer polling del estado de la operación usando el idempotency_key para confirmar si la operación fue completada o no.

### 5.2 Cache Miss en Datos Calientes (Redis)

**Escenario**: Estado de auction cacheado, Redis se reinicia o el cache expira.

**Recuperación**: Se repuebla el cache desde PostgreSQL. Se consulta la fuente de verdad y se reconstruye el estado del cache.

**Lock**: Se utiliza `SETNX` de Redis para evitar múltiples procesos reconstruyendo el mismo cache simultáneamente. Solo el primer proceso logra adquirir el lock.

**TTL**: Se establecen TTLs basados en la volatilidad del dato. Datos de auction tienen TTL de 60 segundos. Datos de usuario tienen TTL de 300 segundos.

**Stale-while-revalidate**: Para reducir latency, se sirve el dato stale mientras se actualiza el cache en background. Esto es aceptable para datos donde una pequeña staleness es tolerable.

### 5.3 Mensaje de Queue Perdido

**Escenario**: Un mensaje de RabbitMQ no es entregado al consumidor.

**Persistencia**: Los mensajes en cola son persistentes. Se configura `delivery_mode = 2` para todos los mensajes críticos.

**Consumidor**: Se hace acknowledge solo después de procesar exitosamente el mensaje. Si el procesamiento falla, no se hace ack y el mensaje permanece en la cola.

**Dead Letter Queue**: Mensajes que fallan después de 3 reintentos van a DLQ. Estos mensajes se revisan manualmente para identificar patrones de falla.

**Reintento configurado**: Se configuran reintentos automáticos con exponential backoff. Cada mensaje tiene un máximo de 3 intentos antes de ir a la DLQ.

## 6. Matriz de Modos de Fallo

| Modo de Fallo | Probabilidad | Impacto | Mitigación |
|---------------|-------------|---------|------------|
| Condición de carrera en ofertas | Media | Alto | Bloqueo transaccional en DB |
| Doble liberación de pago | Baja | Crítico | Operaciones idempotentes |
| Leak de token | Baja | Alto | Tokens de corta duración, HTTPS |
| Outage de base de datos | Muy Baja | Crítico | Multi-AZ, réplicas |
| Gateway de pago caído | Media | Medio | Retry, mensaje de fallback |
| Falla de cache | Media | Bajo | Repoblar desde DB |
| Pérdida de mensaje en cola | Baja | Medio | Persistencia, DLQ |
| Extensión infinita de auction | Muy Baja | Medio | Límite de 3 extensiones |
| Calificación fuera de deadline | Baja | Bajo | Validación de fecha, mensaje claro |
| Falla de red en bid | Media | Medio | Retry con backoff, polling |

## 7. Estrategias de Recuperación

### 7.1 Circuit Breaker

Se implementa circuit breaker para integraciones externas críticas:
- Payment gateway: abre después de 5 failures en 10 segundos
- Notification service: abre después de 10 failures en 30 segundos
- Después de 30 segundos abierto, se permite un único request de prueba

**Estados del Circuit Breaker**:
- **Closed**: Operación normal, todas las requests pasan. Se cuenta failures. Si se alcanzan 5 failures en 10 segundos, se abre.
- **Open**:Todas las requests fallan inmediatamente con 503. Después de 30 segundos, se pasa a Half-Open.
- **Half-Open**: Se permite una request de prueba. Si succeed, se cierra el circuit. Si falla, se abre nuevamente.

### 7.2 Bulkhead

Aislamiento de recursos mediante bulkhead pattern:
- Pool de conexiones separado para lecturas y escrituras
- Límite de concurrent requests por servicio
- Timeouts independientes por dependencia

**Implementación**: Cada servicio tiene su propio pool de conexiones a la base de datos. Los timeouts se configuran independientemente para cada integración externa.

### 7.3 Retry con Jitter

Los reintentos incluyen jitter aleatorio para evitar thundering herd:
- Base delay: exponential (1s, 2s, 4s)
- Jitter: ±25% del delay base
- Máximo delay: 30 segundos

**Fórmula de jitter**: `delay = base_delay * (0.75 + random() * 0.5) * exponential_base^attempt`

## 8. Monitoreo y Alertas

### 8.1 Métricas Clave

- Error rate por endpoint y código de respuesta
- Latencia p50, p95, p99
- Throughput de auction activas
- Estado de escrow pendiente
- Sessiones activas por usuario
- Tiempo de procesamiento de pagos
- Tasa de ofertas exitosas vs fallidas

### 8.2 Alerts

- PagerDuty para alertas críticas (pago, auth)
- Slack para alertas de warning
- Email para informes diarios de salud del sistema

**Alertas críticas**:
- Payment gateway down > 5 min
- Error rate > 5%
- Latencia p99 > 2s
- Número de chargebacks aumenta

### 8.3 Dashboards

- Auction health: ofertas por minuto, auctions activas, extensión count
- Payment health: transacciones por minuto, tasa de éxito, escrow pendiente
- System health: CPU, memoria, conexión DB, cache hit rate

## 9. Contenido Consolidado de 11_Refinements

*(Nota: El contenido adicional de 11_Refinements se ha integrado en las secciones pertinentes de este documento. Las secciones 1-8 de este archivo complementan y expanden el contenido previously definido en 11_Refinements/01_Technical_Refinements.md)*

### 9.1 Escenarios Adicionales de Edge Cases

**Subasta sin Ofertas al Expirar**:
- Sistema detecta expiración (cronjob cada 5 min)
- Publicación cambia status: 'published' → 'expired'
- Empresa recibe notificación: "Tu publicación no recibió ofertas"
- Sistema sugiere: reducir precio mínimo, extender duración, o convertir a publicación directa

**Oferta Ganadora Retirada Antes de Confirmación**:
- Se evalúa segunda mejor oferta válida (si existe dentro de 5% del precio máximo)
- Si no hay segunda oferta: se abre nueva fase de auction (48h)
- Transportista penalizado según matriz de cancelaciones

### 9.2 Estrategias Adicionales de Resiliencia

**Retry Policies Centralizadas**:
- Default: max 3 attempts, base delay 1s, exponential backoff
- Payment: max 5 attempts, base delay 5s
- Notification: max 3 attempts, base delay 10s

**Health Checks**:
- `/health/live`: Liveness probe (process alive)
- `/health/ready`: Readiness probe (DB + Redis connected)
- `/health/deep`: Deep check (can write to DB, can acquire lock)

## 10. Casos Extremos de GPS y Tracking

### 10.1 Dispositivo GPS Offline

**Escenario**: El dispositivo GPS del transportista pierde conectividad (túnel, zona rural, batería baja).

**Detección**: El sistema monitorea el último heartbeat del dispositivo. Si no se recibe ubicación por más de 5 minutos, se marca el dispositivo como `offline`.

**Comportamiento**: Se muestra la última ubicación conocida en el mapa con un indicador de \"Última actualización: hace X minutos\". Se preservan los datos de la ruta planificada.

**Recuperación**: Cuando el dispositivo se reconecta, envía un batch de ubicaciones acumuladas. El sistema reconstruye la ruta y actualiza el tracking en tiempo real.

**Tolerance interval**: Se permite un gap máximo de 30 minutos sin generar alerta. Después de 30 min, se notifica a la empresa que el tracking está interrompido.

**Datos acumulados**: El dispositivo guarda hasta 2 horas de ubicaciones en memoria local. Una vez reconectado, se transmien TODAS las ubicaciones con timestamp original para reconstruir la trayectoria completa.

### 10.2 Datos de Ubicación Stale (Obsoletos)

**Escenario**: El sistema recibe una ubicación con timestamp de hace más de 2 minutos.

**Clasificación**: 
- Fresh: < 1 minuto
- Acceptable: 1-5 minutos
- Stale: > 5 minutos

**Comportamiento**: Para datos stale, se aplica extrapolación lineal basada en la última velocidad conocida. Se calcula una ubicación estimada y se marca con `is_estimated = true`.

**Visualización**: Se muestra un radio de incertidumbre alrededor de la ubicación estimada. El tamaño del radio aumenta proporcionalmente al tiempo de staleness.

**Precisión**: Si la staleness excede 15 minutos, se considera que el tracking está perdido y se inicia el protocolo de pérdida de tracking.

### 10.3 Gap de Ubicación (Location Gap)

**Escenario**: No se reciben ubicaciones durante más de 5 minutos en zona con cobertura.

**Causas posibles**: 
- Falla de hardware del dispositivo GPS
- Interferencia de señal en la zona
- Error de software en el cliente de tracking

**Acción inmediata**: Se verifica el estado del dispositivo. Se intenta un ping de configuración al dispositivo para diagnosticar el problema.

**Notificación**: Se notifica al transportista que su dispositivo no está transmitiendo. Se solicita que verifique el dispositivo o lo reinicie si es necesario.

**Impacto**: El viaje continúa pero sin tracking en tiempo real. Se preserva el estado del viaje y se permite la completion una vez llegado a destino.

**Verificación post-hoc**: A la llegada, se solicita evidencia de tracking alternativo (capturas de pantalla de otra app, fotos con timestamp geolocalizado) para validar la ruta tomada.

### 10.4 Drift de GPS (Desviación de Ruta)

**Escenario**: El vehículo se desvía significativamente de la ruta planificada (> 2 km de desviación).

**Causas**: Error de GPS, desvío por tráfico, toma de ruta alternativa intencional.

**Clasificación de desviación**:
- Minor (< 500m): Warning, posible tráfico
- Moderate (500m - 2km): Alerta, se verifica con transportista
- Major (> 2km): Investigación, posible problema de seguridad

**Respuesta para desviación moderada o mayor**:
- Se envía notificación a la empresa con la nueva ruta
- Se solicita confirmación del transportista sobre la razón de la desviación
- Se documenta la desviación en el registro del viaje

**Validación de llegada**: Si el vehículo llega a destino pero la ruta mostraba desviación, se requiere que el transportista explique el desvío antes de confirmar arrival.

### 10.5 Batería Baja del Dispositivo GPS

**Escenario**: El dispositivo GPS reporta batería < 20%.

**Advertencia**: Se envía notificación al transportista para que conecte el dispositivo a carga.

**Comportamiento en batería crítica (< 10%)**:
- El dispositivo aumenta frecuencia de heartbeat para enviar ubicación más seguido antes de apagarse
- Se reduce la precisión del GPS para ahorrar energía (si el dispositivo lo soporta)
- Se notifica a la empresa que el tracking puede perderse pronto

**Before shutdown**: El dispositivo envía un mensaje de shutdown imminent con su última ubicación. Esta ubicación se marca como `final_location_before_shutdown`.

**Post-recharge**: Al reconectar con batería cargada, el dispositivo envía un mensaje de status completo y reinicia el tracking normal.

### 10.6 Falla de GPS en Múltiples Dispositivos Simultáneamente

**Escenario**: Varios dispositivos de tracking fallan al mismo tiempo (posible problema de red del carrier).

**Monitoreo de anomalía**: Se detecta cuando más del 5% de los dispositivos activos reportan problemas en un período de 5 minutos.

**Escalación**: Si se detecta anomalía, se revisa el estado del servicio de tracking. Se verifica si el problema es del lado del servidor o del carrier.

**Comunicación**: Se notifica proactivamente a las empresas afectadas sobre posible delay en tracking. Se proporciona ETAs basadas en la última ubicación conocida.

**Resolución**: El equipo de infrastructure investiga el problema del carrier. Mientras tanto, se mantiene la operabilidad del resto del sistema.

## 11. Patrones de Idempotencia

### 11.1 Idempotency Key Implementation

**Estructura del idempotency key**: UUID v4 combinado con timestamp del cliente. Formato: `{uuid_v4}_{timestamp_ms}_{device_id}`.

**Almacenamiento**: Se almacena en una tabla `idempotency_keys` con columnas: `key`, `operation_type`, `response`, `created_at`, `expires_at`.

**TTL por tipo de operación**:
- Bid: 5 minutos (operación rápida)
- Payment: 24 horas (mayor tiempo de resolución)
- Rating: 1 hora
- Generic: 1 hora

**Detección de duplicados**: Antes de procesar cualquier operación crítica, se verifica si el idempotency key ya existe. Si existe, se retorna el response almacenado sin volver a procesar.

### 11.2 Operaciones Críticas Cubiertas

| Operación | Tipo | Retry Policy | Idempotency TTL |
|-----------|------|--------------|-----------------|
| Place Bid | Write | 3 attempts, exp backoff | 5 min |
| Release Payment | Write | 5 attempts, exp backoff | 24 hours |
| Create Publication | Write | 3 attempts, exp backoff | 1 hour |
| Submit Rating | Write | 3 attempts, exp backoff | 1 hour |
| Confirm Arrival | Write | 3 attempts, exp backoff | 1 hour |
| Update Location | Write | 1 attempt (fire & forget) | N/A |

### 11.3 Manejo de Conflictos de Idempotency

**Conflictos de timestamp**: Si dos requests tienen el mismo idempotency key pero timestamps diferentes (reintento con clave generada nuevamente), se verifica el hash del contenido. Si el contenido es idéntico, se considera retry válido y se retorna el response original.

**Contenido diferente**: Si el idempotency key es el mismo pero el contenido difiere, se retorna error `409 Conflict` indicando inconsistencia.

## 12. Estrategias de Graceful Degradation

### 12.1 Degradación por Componente

**Payment Gateway caído**:
- Se permite a los usuarios ver el estado de sus viajes
- Se permite crear publicaciones con garantía pendiente
- Se bloquea la confirmación de viajes hasta que el pago esté confirmado
- Se muestra banner indicando delay en pagos

**Notification Service caído**:
- Los emails se encolan para envío posterior
- Se reduce frecuencia de notificaciones (solo críticas)
- Se priorizan notificaciones de pago y seguridad

**GPS Tracking Service degradado**:
- Se muestra última ubicación conocida con timestamp
- Se deshabilita el cálculo de ETA en tiempo real
- Se permite al transportista reportar ubicación manual via SMS fallback

### 12.2 Modo Offline para Cliente Móvil

**Capability detection**: El cliente detecta cuando la conectividad es limitada.

**Operaciones locales**: 
- Se permite crear drafts de publicaciones
- Se permite ver viajes programados (cached data)
- Se permite acceder a historial de viajes

**Sync al reconectar**: Cuando se recupera conectividad, el cliente sincroniza todos los cambios pendientes con el servidor.

**Indicador de modo offline**: Se muestra un banner consistente indicando que el dispositivo está offline y qué funcionalidades están disponibles.

### 12.3 Fallback a CDN

**Static assets**: Si el servidor de aplicaciones está caído, los assets estáticos se sirven desde CDN.

**Contenido dinámico cacheable**: Páginas de ayuda, FAQs, y términos de servicio se sirven desde cache de CDN.

**API fallback**: Para APIs de solo lectura (get public status, get publication details), se intenta servir desde cache de CDN si el API principal está caído.

---

*Documento generado: 2026-06-03*
*Autor: Hermes Agent*
*Estado: Completado*
*Versión: 1.0*