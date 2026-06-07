# 01 - Visión General de la API de Spottruck

## 1. Introducción y Principios de Diseño

La API de Spottruck constituye el núcleo central de comunicación entre todos los componentes del ecosistema tecnológico de la plataforma. Diseñada bajo principios de arquitectura RESTful, esta interfaz permite la interacción programa-a-programa (API) entre el cliente móvil, el panel administrativo web, los servicios backend y los sistemas externos de integración. El diseñoprioriza la escalabilidad horizontal, la consistencia en los formatos de respuesta y la seguridad en todos los endpoints.

Spottruck opera bajo el protocolo HTTPS exclusivamente, lo que garantiza que toda comunicación entre clientes y servidores se encuentra cifrada mediante TLS 1.3. La autenticación se gestiona a través de tokens JWT (JSON Web Tokens) que incluyenclaims específicos del usuario, permisos granulares y tiempos de expiración adaptados al tipo de sesión. Cada request debe incluir el token JWT en la cabecera Authorization como Bearer token, permitiendo así un modelo de seguridad stateless que facilita la escalabilidad y el balanceo de carga entre múltiples instancias del servidor.

El versionado de la API se implementa mediante URL path versioning, donde la versión mayor se incluye en la ruta base de cada endpoint. La versión actual es **v1**, y la URL base sigue la estructura `https://api.spottruck.com/v1/`. Cuando se introduzcan cambios incompatibles con versiones anteriores, se creará una nueva versión mayor (v2, v3) mientras se mantiene la versión antigua disponible durante un período de transición de至少 seis meses. Esta estrategia permite a los consumidores de la API planificar sus actualizaciones sin presiones de tiempo.

## 2. Arquitectura y Tecnologías

### 2.1 Stack Tecnológico del Backend

El backend de Spottruck está construido sobre una arquitectura de microservicios que separa claramente las responsabilidades funcionales. El API Gateway actúa como punto de entrada unificado, manejando la autenticación, el rate limiting y el enrutamiento hacia los servicios correspondientes. Los microservicios principales incluyen el Servicio de Autenticación, el Servicio de Usuarios y Perfiles, el Servicio de Publicación de Camiones, el Servicio de Búsqueda y Filtros, el Servicio de Messaging, el Servicio de Notificaciones Push, el Servicio de Pagos, y el Servicio de Analíticas y Reportes.

El lenguaje de programación principal es Go (Golang), seleccionado por su excelente rendimiento en procesamiento concurriente, su bajo consumo de memoria y su capacidad para manejar miles de conexiones simultáneas sin dependencia de un runtime pesado. La base de datos principal es PostgreSQL para datos transaccionales y relacionales, mientras que Redis se utiliza para caché de sesiones, caché de consultas frecuentes y como store de datos temporales como verification codes y rate limiting counters. Elasticsearch alimenta el motor de búsqueda avanzada, permitiendo consultas full-text con filtros geoespaciales sobre publicaciones de camiones.

### 2.2 Formato de Datos y Convenciones

Todos los request y response bodies utilizan formato JSON (JavaScript Object Notation) con codificación UTF-8. El Content-Type header debe establecerse como `application/json` tanto en peticiones como en respuestas. Los timestamps se expresan en formato ISO 8601: `2026-06-04T14:30:00Z` (UTC). Los identificadores únicos de recursos utilizan formato UUID v4, garantizando unicidad global y permitiendo la generación descentralizada sin coordinación entre servicios.

Los nombres de campos en JSON siguen la convención camelCase. Los valores null deben representarse explícitamente como `null` y no como campos omitidos. Las respuestas de error siguen un formato estructurado que incluye un código de error interno, un mensaje amigable para el desarrollador, detalles adicionales opcionales, y un trace_id para facilitar la correlación de logs. Este formato estructurado permite que las aplicaciones cliente parseen los errores de manera Programática y proporcionen feedback adecuado al usuario final.

## 3. Autenticación y Autorización

### 3.1 Flujo de Autenticación

El sistema de autenticación de Spottruck soporta múltiples flujos de inicio de sesión adaptados a diferentes contextos de uso. El flujo principal para usuarios de la aplicación móvil es el registro/login con email y contraseña, complementado con opciones de autenticación social a través de proveedores OAuth 2.0 (Google, Apple). El flujo de autenticación utiliza la técnica de Password Verification usando bcrypt con un cost factor de 12, almacenando únicamente el hash en la base de datos y nunca la contraseña en texto plano.

Los tokens JWT emitidos tienen una validez de 15 minutos para access tokens y de 7 días para refresh tokens. El access token debe enviarse en cada request al API, mientras que el refresh token permite obtener un nuevo access token sin necesidad de volver a introducir credenciales. El endpoint de refresh acepta el refresh token y devuelve un nuevo par de tokens, invalidando el refresh token utilizado (rotación de tokens). Esta estrategia mitiga el riesgo de compromiso de tokens al limitar su ventana de utilidad.

### 3.2 Permisos y Roles

El modelo de autorización implementa un sistema de permisos basados en roles (RBAC) con roles predefinidos que incluyen: Administrador (acceso total a todas las operaciones), Editor (puede gestionar publicaciones propias y mensajes), Comprador (puede ver camiones, contactar vendedores y gestionar compras), y Visitante (solo lectura limitada). Cada rol tiene asociado un conjunto de permissions específicas que se evaluan en cada endpoint protegido.

Los permisos se expresan mediante una estructura de capabilities que sigue el patrón `recurso:acción`. Por ejemplo, `truck:create` permite crear publicaciones, `truck:update` permite modificar publicaciones propias (o cualquier publicación si es administrador), y `truck:delete` permite eliminar publicaciones propias o de otros usuarios si tiene rol de administrador. Esta granularidad permite implementar controles de acceso finos sin necesidad de crear roles adicionales para cada combinación específica.

## 4. Rate Limiting y Cuotas

La API implementa rate limiting para prevenir abusos y garantizar la disponibilidad del servicio para todos los usuarios. Los límites se aplican por token de autenticación y por dirección IP para endpoints públicos. El tier gratuito permite 100 requests por minuto, el tier profesional permite 500 requests por minuto, y el tier empresarial permite 2000 requests por minuto. Estos límites se comunican mediante headers HTTP estándar: `X-RateLimit-Limit` indica el límite total, `X-RateLimit-Remaining` indica las requests restantes en la ventana actual, y `X-RateLimit-Reset` indica el timestamp Unix cuando se reinicia la ventana.

Cuando se excede el rate limit, la API responde con código HTTP 429 (Too Many Requests) incluyendo un header `Retry-After` que indica los segundos que deben esperarse antes de realizar una nueva solicitud. Las respuestas 429 no cuentan en la cuota de errores, pero sí en el contador total de requests a efectos del rate limit. El diseño permite bursts controlados mediante un algoritmo de token bucket que permite consumir hasta el doble del límite en bursts cortos cuando hay tokens disponibles.

## 5. Paginación y Filtros

Los endpoints que devuelven colecciones de recursos implementan paginación basada en cursor para garantizar estabilidad durante inserciones concurrentes. El tamaño de página predeterminado es 20 elementos, con un máximo de 100 elementos por solicitud. La estructura de paginación utiliza los parámetros `limit` (número de elementos, default 20, max 100), `cursor` (cursor opaco que codifica la posición), y `direction` (next o prev para navegación bidireccional).

Los endpoints de búsqueda avanzada soporta múltiples filtros combinables: filtrado por rango de precio, año de fabricación, marca, modelo, tipo de camión, estado de disponibilidad, ubicación geográfica (radio en kilómetros desde un punto), y palabras clave en descripción. Los filtros se pasan como query parameters siguiendo una convención de query params simples: `?price_min=10000&price_max=50000&year_gte=2020`. Los resultados se ordenan por relevancia en búsquedas con palabras clave, o por fecha de creación descendente en listados sin filtro de texto.

## 6. Versionado y backwards Compatibility

La estrategia de versionado de Spottruck sigue las mejores prácticas de la industria para APIs REST. Los cambios backward-compatible como nuevos campos opcionales, nuevos endpoints, o nuevos valores en enums no generan una nueva versión. Los cambios que rompen la compatibilidad hacia atrás incluyen: eliminar campos de respuesta, cambiar el tipo de datos de un campo existente, modificar la semántica de parámetros existentes, o cambiar códigos de error establecidos.

Cuando sea necesario introducir cambios breaking changes, se seguirá un proceso de deprecated notice que incluye: comunicación con al menos 90 días de anticipación a través del blog de desarrolladores y emails a usuarios de la API registrados, labels de deprecated en la documentación y respuestas de API (header Sunset), y retención completa de la funcionalidad anterior durante el período de transición. Este enfoque permite a los consumidores planificar migraciones sin突如其itos que rompan sus integraciones.

## 7. Monitorización y Observabilidad

Todo el tráfico de la API se instrumenta con trazabilidad distribuida mediante IDs de correlación (correlation IDs) que permiten seguir una solicitud a través de todos los microservicios involucrados. Cada request recibe un correlation_id generado en el API Gateway que se propaga en headers hacia abajo en la cadena de llamadas. Este correlation_id aparece en los logs de cada servicio, facilitando la identificación de cuellos de botella y la resolución de problemas de rendimiento.

Los endpoints de health check permiten a los operadores de infraestructura monitorear la disponibilidad del sistema: `/health` devuelve el estado general del sistema, `/health/ready` indica si el sistema está listo para recibir tráfico (todas las dependencias conectadas), y `/health/live` indica si el proceso está vivo (util para Kubernetes liveness probes). Estos endpoints no requieren autenticación y están pensados para monitoreo externo automatizado.

## 8. Environments y Endpoints Base

Spottruck mantiene tres ambientes diferenciados: development (https://api.dev.spottruck.com/v1/), staging (https://api.staging.spottruck.com/v1/), y production (https://api.spottruck.com/v1/). Cada ambiente tiene su propia base de datos, configuración de servicios externos, y credenciales de integración. Las claves de API de development y staging tienen prefijos que las distinguen claramente (sk_dev_*, sk_staging_*) para evitar publicaciones accidentales en producción.

---

*Última actualización: Junio 2026*
*Equipo de Ingeniería de Spottruck*
