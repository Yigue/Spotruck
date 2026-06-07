# Stack Tecnológico Spottruck

## 1. Resumen Ejecutivo del Stack

La selección del stack tecnológico de Spottruck está fundamentada en criterios estrictos de rendimiento, escalabilidad, mantenibilidad y adaptabilidad al mercado latinoamericano de transporte de carga. Cada componente del stack ha sido evaluado considerando la madurez del proyecto, el soporte comunitario y comercial disponible, la curva de aprendizaje del equipo de desarrollo y la compatibilidad con los requisitos regulatorios locales.

El stack combina tecnologías probadas en entornos de producción a gran escala con herramientas modernas de desarrollo que maximizan la productividad del equipo. La arquitectura de microservicios permite que cada servicio utilice el lenguaje y framework más apropiado para su función específica, evitando el enfoque de一刀切 que limitaría las capacidades del sistema.

## 2. Lenguajes de Programación y Frameworks

### 2.1 Go para Servicios de Alto Rendimiento

Go es el lenguaje elegido para los servicios que requieren procesamiento intensivo de datos y alta concurrencia, específicamente el servicio de telemática que debe manejar ingestión de datos de miles de dispositivos GPS simultáneamente. La elección de Go se fundamenta en su excelente rendimiento comparable a lenguajes compilados como C++, su manejo nativo de concurrencia a través de goroutines que lo hace ideal para procesamiento paralelo de eventos, y su recolección de basura optimizada que minimiza pausas en el procesamiento.

El framework principal utilizado es Gin para la creación de APIs HTTP, elegido por su rendimiento superior en benchmarks comparativos y su API minimalista que no añade overhead innecesario. Para la capa de persistencia se utiliza la biblioteca estándar database/sql con el driver pgx para PostgreSQL, evitando ORMs que introducirían overhead en operaciones bulk tan frecuentes en el servicio de telemática.

La estructura de directorios sigue el patrón de diseño estándar de proyectos Go, con separación clara entre cmd para puntos de entrada, pkg para bibliotecas reutilizables, internal para código específico del dominio y api para definiciones de protocolos. Las pruebas unitarias se escriben utilizando el paquete testing nativo y testify para assertions avanzadas.

### 2.2 Java y Spring Boot para Servicios de Negocio

Los servicios que implementan lógica de negocio compleja utilizan Java 17 LTS con Spring Boot 3, aprovechando el ecosistema maduro de bibliotecas y herramientas disponibles para este lenguaje. El servicio de gestión de vehículos y el servicio financiero son los principales representantes de este grupo.

Spring Boot proporciona configuración automática sensata que reduce el código repetitivo, integración profunda con el ecosistema Spring incluyendo Spring Data para persistencia y Spring Security para autenticación, y excelente soporte para patrones de microservicios como Circuit Breaker con Resilience4j y Client-Side Load Balancing con Spring Cloud LoadBalancer.

La capa de persistencia utiliza Spring Data JPA con Hibernate como implementación de ORM, generando consultas optimizadas a partir de métodos de repositorio declarados por nombre. Las migraciones de esquema se gestionan con Flyway, manteniendo versionado de cambios de base de datos junto con el código fuente.

### 2.3 Python para Procesamiento de Datos y Machine Learning

Python 3.11+ es el lenguaje elegido para el servicio de optimización de rutas y para tareas de procesamiento de datos analíticos. La riqueza del ecosistema de bibliotecas científicas de Python, particularmente Pandas, NumPy, SciPy y scikit-learn, lo hace incomparable para algoritmos de optimización combinatoria y análisis estadístico.

El framework FastAPI se utiliza para exponer los endpoints del servicio de rutas, aprovechando su rendimiento asíncrono nativo y su validación de tipos con Pydantic. La documentación automática de APIs con OpenAPI y la capacidad de generación de clientes son beneficios adicionales que aceleran el desarrollo.

Para la optimización de rutas se utiliza OR-Tools de Google, una biblioteca de código abierto que implementa algoritmos de última generación para problemas de enrutamiento de vehículos con restricciones. Las capacidades incluyen enrutamiento con ventanas de tiempo, flota heterogénea, múltiples depósitos y limitaciones de capacidad de carga.

### 2.4 Node.js para APIs de Integración

Node.js con TypeScript se utiliza para servicios de integración que actúan como agregadores o que requieren conexión con sistemas externos. El servicio de portal BFF y el servicio de integración con sistemas de terceros son ejemplos de esta categoría.

Express.js proporciona el framework base por su flexibilidad y el vasto ecosistema de middlewares disponibles. TypeScript añade verificación de tipos en tiempo de compilación que reduce errores y mejora la documentación del código a través de tipos explícitos. La integración con sistemas legacy se facilita mediante el uso de bibliotecas específicas del protocolo de cada sistema, todas disponibles en el ecosistema npm.

## 3. Bases de Datos y Almacenamiento

### 3.1 PostgreSQL como Base de Datos Principal

PostgreSQL es la base de datos transaccional elegida para la mayoría de los servicios de Spottruck, funcionando en configuración de alta disponibilidad con replicación síncrona y failover automático gestionado por Patroni. La decisión se basa en la robustez del motor, su soporte para tipos avanzados como JSONB para flexibilidad de esquemas, las capacidades de Full-Text Search integradas, y la extensiones geoespaciales con PostGIS.

El dimensionamiento de las bases de datos PostgreSQL sigue las mejores prácticas de configuración para workloads de OLTP, incluyendo connection pooling con PgBouncer para optimizar el uso de conexiones, configuración de shared_buffers合适的 para el tamaño de memoria disponible, y tunin de parámetros de Write-Ahead Logging según el perfil de escritura de cada servicio.

La estrategia de backups implementa tanto backups lógicos diarios con retención de 30 días como backups físicos continuos con Point-in-Time Recovery habilitado para los últimos 7 días. Los backups se almacenan en S3 compatible storage con cifrado del lado del cliente antes de la subida.

### 3.2 TimescaleDB para Series Temporales

El servicio de telemática utiliza TimescaleDB como base de datos secundaria para el almacenamiento de datos históricos de ubicación y sensórica. TimescaleDB es una extensión de PostgreSQL que añadeoptimizaciones específicas para datos de series temporales, incluyendo compresión automática que reduce el almacenamiento en un 90% para datos antiguos y políticas de retención configurables por tabla.

La arquitectura de almacenamiento divide los datos en chunks temporales, típicamente de una semana cada uno, lo que permite operaciones eficientes de drop de datos antiguos y mantenimiento de índices. Las queries analíticas sobre datos históricos utilizan la capacidad de TimescaleDB de paralelizar la ejecución a través de múltiples chunks.

Los datos más recientes, típicamente los últimos 7 días, se mantienen también en Redis para acceso en tiempo real con latencias sub-milisecond. Este patrón híbrido optimiza costos manteniendo datos históricos en almacenamiento barato comprimido mientras se garantiza rendimiento para consultas operativas actuales.

### 3.3 Redis para Caché y Estado Compartido

Redis funciona como caché de múltiples niveles y como almacenamiento de estado transitorio para coordinación entre instancias de servicios. Las configuraciones incluyen Redis Cluster para escalamiento horizontal y Sentinel para alta disponibilidad con failover automático.

Los casos de uso principales incluyen caché de consultas frecuentes como información de vehículos activos y conductores asignados, caché de resultados de APIs costosas como cálculos de distancias y optimizaciones de ruta, storage de sesiones de usuarios cuando el servicio de identidad está temporalmente no disponible, y pub/sub para notificaciones en tiempo real a través de WebSocket.

La política de evictión de caché se configura por caso de uso, utilizando políticas LRU para datos que pueden regenerarse y políticas TTL definidas para datos con validez temporal intrínseca. El monitoramento dehit rate se интегрирует en los dashboards de Grafana para identificar oportunidades de optimización de caché.

### 3.4 Elasticsearch para Búsqueda y Logs

Elasticsearch proporciona capacidades de búsqueda full-text y análisis de logs para toda la plataforma. El stack ELK completo (Elasticsearch, Logstash, Kibana) se utiliza para centralización de logs, búsqueda distribuida y visualización de datos operativos.

Los logs de aplicación se envían a Logstash a través de Beats, se procesan y enriquecen con metadatos de contexto, se almacenan en Elasticsearch indexado por fecha y aplicación, y se visualizan en Kibana con dashboards predefinidos para detección de errores, análisis de rendimiento y auditoría de operaciones.

Elasticsearch también alimenta las funcionalidades de búsqueda global dentro del portal Spottruck, permitiendo a los usuarios buscar vehículos, conductores, rutas y documentos utilizando lenguaje natural con corrección ortográfica y sugerencias自动izadas.

### 3.5 Almacenamiento de Objetos con S3

Los archivos estáticos, documentos adjuntos, reportes generados y archivos de configuración se almacenan en MinIO, una implementación de almacenamiento de objetos compatible con la API de S3. MinIO se despliega en modo distribuido con replicación para garantizar durabilidad de datos.

Los casos de uso incluyen almacenamiento de documentos de vehículos como pólizas de seguro, permisos de circulación y certificados de revisión técnica, storage de reportes financieros y operacionais en formato PDF y Excel, archival de证据 fotográficas y documentos de cumplimiento normativo, y almacenamiento de assets estáticos del portal web.

## 4. Mensajería y Event-Driven Architecture

### 4.1 Apache Kafka para Event Streaming

Apache Kafka es el backbone de comunicación asíncrona del ecosistema Spottruck, proporcionando pub/sub de alta capacidad y persistencia de eventos para procesamiento en tiempo real y diferido. El cluster de Kafka se despliega utilizando Strimzi, el operador de Kubernetes para Kafka, simplificando la gestión de brokers, topics y usuarios.

La arquitectura de topics sigue un patrón de dominio + evento, donde cada servicio publica en topics naming como vehicles.created, vehicles.maintenance_scheduled o telemetry.location_update. Los consumidores se subscribe a los topics relevantes para su procesamiento, con grupos de consumidores que permiten escalamiento horizontal del procesamiento.

El esquema de eventos se define utilizando Avro con Confluent Schema Registry, proporcionando validación automática de schemas en producción y consumo, evolución de schemas compatible hacia adelante y atrás, y serialización eficiente en formato binario que optimiza el throughput de red.

### 4.2 Apache ZooKeeper y KRaft para Coordinación

La coordinación entre componentes distribuidos de Spottruck utiliza ZooKeeper para casos de elección de líder y bloqueo distribuido, y el nuevo protocolo KRaft integrado en Kafka para la coordinación interna del cluster de mensajes.

ZooKeeper también se utiliza para la gestión de configuración distribuida a través de Apache Curator, permitiendo que los servicios almacenen y observen configuraciones que pueden actualizarse sin restart de los servicios. Este patrón se utiliza para feature flags, límites de tasa y configuraciones de negocio que requieren cambio dinámico.

## 5. Contenedores y Orquestación

### 5.1 Docker y Container Registry

Todos los servicios de Spottruck se distribuyen como imágenes Docker utilizando imágenes base minimalistas como Alpine para reducir superficie de ataque y tiempo de descarga. Los Dockerfiles siguen mejores prácticas de construcciónmulti-stage que mantienen las imágenes finales pequeñas y seguras.

Las imágenes se almacenan en un registry privado desplegado con Harbor, que proporciona scanning de vulnerabilidades con Trivy, firma de imágenes con Notary, y replicación entre regiones para optimizar latencia de despliegue. Cada imagen se construye automáticamente en el pipeline de CI/CD y se versiona con tags que incluyen el commit de Git y el número de build.

### 5.2 Kubernetes y Helm

Kubernetes proporciona la plataforma de orquestación de contenedores, desplegado en EKS para ambientes de producción en la nube y Rancher para ambientes On-Premise de clientes enterprise. La abstracción de Kubernetes permite que el mismo código se despliegue indistintamente en cualquier ambiente.

Los charts de Helm organizan la configuración de cada servicio con valores por defecto sensatos y overrides para cada ambiente. La estructura de charts incluye templates para Deployments con readiness y liveness probes configurados, Services con discovery basado en labels, HorizontalPodAutoscalers con métricas customizadas, y PodDisruptionBudgets para garantizar disponibilidad durante mantenimientos.

### 5.3 Service Mesh con Istio

Istio proporciona la service mesh que gestiona la comunicación entre servicios con capacidades de observabilidad, seguridad y control. La instalación de Istio se configura con un profile mínimo que activa solo los componentes necesarios, reduciendo overhead de recursos.

Las capacidades principales utilizadas incluyen mTLS automático entre todos los servicios para cifrado de tráfico interno sin cambios de código, circuit breakers configurados por destino para prevenir fallos en cascada, retries automáticos con backoff exponencial para operaciones transient failures, y rate limiting basado en memoria para proteger servicios de sobrecarga.

## 6. CI/CD y DevOps

### 6.1 Jenkins y ArgoCD para Pipelines

El pipeline de CI/CD se construye utilizando Jenkins para la fase de integración continua, incluyendo compilación, ejecución de pruebas unitarias y de integración, análisis estático de código con SonarQube, y construcción de imágenes Docker. Los pipelines se definen como código en Jenkinsfiles versionados junto con el código fuente.

ArgoCD gestiona el despliegue continuo en los ambientes de staging y producción, monitoreando el repositorio GitOps y sincronizando cambios automáticamente al cluster Kubernetes. Los despliegues siguen estrategias de GitOps donde el estado desired se define en Git y ArgoCD se encarga de reconciliar el estado actual con el deseado.

### 6.2 Terraform para Infraestructura como Código

La infraestructura de Spottruck se define completamente en Terraform, incluyendo redes VPC, clusters de Kubernetes, bases de datos gestionadas, buckets de almacenamiento y servicios de caché. Los módulos de Terraform se versionan y se reutilizan entre ambientes para garantizar consistencia.

El state de Terraform se almacena en S3 con DynamoDB para lock de operaciones concurrentes, replicated entre regiones para disaster recovery. Los planes de Terraform se ejecutan automáticamente en el pipeline de CI/CD y requieren aprobación manual para aplicación en ambientes de producción.

### 6.3 Prometheus y Grafana para Monitoreo

El stack de monitoreo se basa en Prometheus para recolección de métricas y Grafana para visualización y alertas. Prometheus se configura con service discovery automático a través de Istio, descubriendo servicios y sus endpoints de métricas sin configuración manual.

Las métricas customizadas de negocio incluyen conteo de vehículos activos, viajes completados por período, tiempo promedio de entrega y revenue por hora. Las alertas se configuran con Prometheus RuleGroups y se integran con PagerDuty para escalamiento de incidentes fuera de horario.

## 7. Seguridad y Cumplimiento

### 7.1 HashiCorp Vault para Gestión de Secretos

HashiCorp Vault proporciona almacenamiento centralizado de secretos, credenciales de bases de datos, API keys de servicios externos y certificados TLS. Los secretos se injectan en los pods de Kubernetes a través del Vault Agent Injector, eliminando la necesidad de almacenar credenciales en código o configuración.

Las políticas de Vault definen acceso granular por servicio y por tipo de secreto, siguiendo el principio de mínimo privilegio. Los secretos dinámicos se utilizan para credenciales de bases de datos, generando credenciales de solo minutos de validez que rotan automáticamente.

### 7.2 OpenID Connect y OAuth 2.0

La autenticación de usuarios se gestiona a través de un servicio de identidad basado en Keycloak, que implementa OpenID Connect y OAuth 2.0. El servicio proporciona login social con Google y Microsoft para usuarios B2C, y integración con directorios corporativos para clientes enterprise mediante SAML.

Los tokens JWT se validan en cada request por los servicios backend, con validación de firma, fecha de expiración y claims personalizados que incluyen roles y permisos. El portal web delega completamente la autenticación a Keycloak y recibe tokens que se almacenan de forma segura en httpOnly cookies.

### 7.3 Security Scanning y Hardening

El pipeline de CI/CD incluye múltiples capas de seguridad, comenzando con análisis estático de código en busca de vulnerabilidades conhecidas mediante SonarQube, scanning de dependencias con OWASP Dependency-Check, análisis de imágenes Docker con Trivy que escanea el filesystem por vulnerabilidades conocidas en packages instalados, y escaneo deIaC templates con tfsec para Terraform.

Los contenedores se ejecutan con usuarios no-root y filesystem de solo lectura donde es posible, reduciendo la superficie de ataque en caso de compromiso. Las políticas de networkPolicy en Kubernetes restringen comunicación entre servicios a solo los puertos necesarios, implementando el principio de mínimo privilegio de red.
