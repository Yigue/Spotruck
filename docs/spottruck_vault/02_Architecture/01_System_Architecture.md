# Arquitectura del Sistema Spottruck

## 1. Descripción General de la Arquitectura

Spottruck es una plataforma integral de gestión de flotas de transporte pesado que opera bajo una arquitectura de microservicios distribuida, diseñada específicamente para satisfacer las demandas del sector logístico y de transporte de carga en mercados latinoamericanos. La arquitectura está fundamentada en principios de escalabilidad horizontal, resiliencia distribuida y desacoplamiento total de servicios, lo que permite que cada componente del sistema evolucione de manera independiente sin impactar la estabilidad del conjunto.

El sistema está organizado en múltiples capas funcionales que trabajan de manera coordinada para proporcionar una experiencia unificada tanto para los operadores de flotas como para los conductores y los administradores de logística empresarial. La arquitectura utiliza un patrón de comunicación híbrido que combina mensajería síncrona mediante APIs REST para operaciones en tiempo real y mensajería asíncrona a través de un bus de eventos empresarial para procesos que no requieren respuesta inmediata.

La infraestructura base está desplegada sobre contenedores Docker orquestados mediante Kubernetes, lo que proporciona una portabilidad excepcional entre diferentes entornos de infraestructura, ya sea en la nube pública, privada o en configuraciones híbridas. Esta decisión arquitectónica permite a Spottruck escalar dinámicamente según la demanda, añadiendo o removiendo nodos de procesamiento sin interrumpir los servicios activos.

El diseño de la arquitectura contempla cinco dominios principales de negocio que funcionan como bounded contexts independientes: gestión de vehículos, seguimiento GPS y telemática, administración de rutas y dispatch, módulo financiero y facturación, y el portal de clientes con autoprotección. Cada dominio posee su propio modelo de datos, lógica de negocio y APIs dedicadas, manteniendo coherencia eventual a través de eventos publicados en el bus de mensajes central.

## 2. Arquitectura de Microservicios

### 2.1 Servicio de Gestión de Vehículos

El servicio de gestión de vehículos constituye el núcleo central de la plataforma Spottruck, siendo responsable de mantener el registro maestro de todas las unidades que conforman la flota de cada cliente. Este servicio está desarrollado utilizando Java con Spring Boot, aprovechando las capacidades de Spring Data JPA para la persistencia y Spring Web para la exposición de endpoints RESTful.

La base de datos asociada a este servicio es PostgreSQL, elegida por su robustez en entornos de alta disponibilidad y su soporte nativo para tipos de datos complejos como JSON para metadatos flexibles. El esquema de base de datos incluye tablas principales para vehículos, tipos de unidad, mantenimientos programados, inspecciones técnicas y documentos asociados a cada unidad. La estructura está normalizada hasta la tercera forma normal para garantizar la integridad referencial y minimizar redundancia.

El servicio expone un conjunto completo de endpoints que permiten crear, leer, actualizar y eliminar registros de vehículos, así como operaciones específicas como la asignación de vehículos a conductores, el registro de mantenimientos correctivos y preventivos, y la gestión del ciclo de vida completo de cada unidad desde su incorporación hasta su baja definitiva.

La comunicación con otros servicios se realiza principalmente a través del bus de eventos Apache Kafka, donde el servicio publica eventos relevantes como la incorporación de nuevas unidades, cambios de estado, alertas de mantenimiento próximo y desincorporaciones.同时, el servicio se suscribe a eventos de otros dominios que puedan afectar su información, como cambios en la estructura organizacional del cliente.

### 2.2 Servicio de Telemática y Seguimiento GPS

El servicio de telemática representa uno de los componentes más críticos del ecosistema Spottruck, siendo responsable de la ingestión, procesamiento y distribución de datos de ubicación y sensórica obtenidos de los dispositivos GPS instalados en los vehículos de la flota. Este servicio está desarrollado en Go, un lenguaje elegido por su excelente rendimiento en procesamiento paralelo y su bajo consumo de recursos, características fundamentales para manejar el alto volumen de datos generado por miles de dispositivos simultáneamente.

La arquitectura interna del servicio de telemática utiliza un patrón de streaming de eventos implementado con Apache Kafka Connect y Kafka Streams. Los dispositivos GPS envían datos cada 30 segundos aproximadamente, incluyendo coordenadas de latitud y longitud, velocidad actual, rumbo, estado del motor, nivel de combustible, temperatura de operación y códigos de diagnóstico OBD-II cuando están disponibles. El servicio debe ser capaz de ingestar y procesar estos datos en tiempo casi real, con latencias inferiores a los 5 segundos entre la recepción y la disponibilidad para consulta.

El almacenamiento de datos históricos de seguimiento se realiza en TimescaleDB, una extensión de PostgreSQL optimizada para series temporales, que permite consultas eficientes sobre enormes volúmenes de datos históricos manteniendo tiempos de respuesta aceptables. Los datos en tiempo real se mantienen en Redis para acceso inmediato, mientras que los datos históricos se comprimen y archivan periódicamente para optimizar costos de almacenamiento.

El servicio calcula en tiempo real métricas derivadas como consumo de combustible por kilómetro, tiempo de motor en ralentí, eventos de frenado brusco, acceleraciones agresivas, cumplimiento de velocidades máximas y geocercas definidas por el cliente. Estos cálculos se almacenan como agregaciones precomputadas para permitir dashboards de análisis con tiempos de carga instantáneos.

### 2.3 Servicio de Administración de Rutas y Dispatch

El servicio de rutas implementa la lógica de planificación y optimización de rutas utilizando algoritmos de última milla adaptados para el contexto de transporte de carga pesada. Este servicio está desarrollado en Python, aprovechando bibliotecas especializadas como OR-Tools de Google para la optimización combinatoria y GeoPandas para operaciones geoespaciales.

La arquitectura del servicio de rutas sigue un patrón CQRS (Command Query Responsibility Segregation) que separa claramente las operaciones de escritura, correspondientes a la creación y modificación de rutas, de las operaciones de lectura que alimentan los dashboards de seguimiento y los mapas de visualización en tiempo real. Los comandos se procesan de forma síncrona para garantizar consistencia inmediata, mientras que las proyecciones de lectura se actualizan de forma eventual a través del bus de eventos.

El servicio mantiene su propia base de datos PostgreSQL con extensiones PostGIS habilitadas para todas las operaciones geoespaciales. El esquema incluye tablas para rutas, paradas planificadas, ventanas de tiempo de entrega, restricciones vehiculares, perfiles de terreno y matrices de distancia y tiempo calculadas dinámicamente. Las consultas geoespaciales aprovechan los índices espaciales GiST para optimizar búsquedas por proximidad y operaciones de intersección.

La integración con servicios externos de mapas incluye la conexión a OpenStreetMap para datos cartográficos base y la integración opcional con servicios comerciales como Google Maps Platform y Mapbox para enriquecimiento de datos de navegación turn-by-turn. El servicio calcula rutas alternativas y permite la selección automática de la ruta óptima basada en múltiples criterios como distancia mínima, tiempo estimado, consumo de combustible proyectado y preferencias de carreteras autorizadas para vehículos pesados.

### 2.4 Servicio Financiero y Facturación

El módulo financiero de Spottruck maneja todos los aspectos relacionados con la estructura de costos, tarificación, facturación electrónica y gestión de cobros para las operaciones de la flota. Este servicio está desarrollado en Node.js con Express, aprovechando el modelo asíncrono de JavaScript para operaciones de entrada y salida intensivas como consultas a bases de datos y llamadas a servicios externos de facturación.

La arquitectura del servicio financiero implementa el patrón de domain-driven design con una clara separación entre la capa de aplicación, el dominio de negocio y la capa de infraestructura. El dominio incluye conceptos como contratos de servicio, estructuras tarifarias, liquidaciones de viaje, notas de crédito y facturas. La lógica de cálculo de costos integra variables como distancia recorrida, tiempo de utilización, consumo de combustible estimado, peajes, tiempos de espera y servicios adicionales solicitados.

La generación de facturas utiliza plantillas dinámicas que se adaptan a los requisitos específicos de cada país en cuanto a formato, impuestos aplicables y campos obligatorios. El servicio se integra con servicios de facturación electrónica certificados en cada jurisdicción donde opera Spottruck, manejando la generación, firmado digitalmente, transmisión y almacenamiento de comprobantes según las normativas locales vigentes.

El servicio financiero publica eventos de negocio relevantes como facturas emitidas, pagos recibidos, liquidaciones completadas y alertas de facturación pendiente.同时, se subscribe a eventos de otros servicios como viajes completados y distancias recorridas para generar automáticamente los cargos correspondientes según las tarifas pactadas.

### 2.5 Portal de Clientes y Experiencia de Usuario

El portal de clientes constituye la interfaz principal de interacción entre Spottruck y los usuarios finales, incluyendo administradores de flota, dispatchers, conductores y clientes corporativos que requieren visibilidad sobre sus envíos. Este componente es una aplicación web de página única desarrollada con React y TypeScript, construida sobre el framework Next.js para optimización de renderizado del lado del servidor y generación estática de páginas.

La arquitectura del portal sigue un patrón de diseño atómico con componentes reutilizables organizados en una biblioteca de diseño propia de Spottruck. El estado de la aplicación se gestiona utilizando Redux Toolkit para operaciones síncronas complejas y React Query para la sincronización con APIs backend, proporcionando caché automático, invalidación inteligente y actualización en segundo plano de datos del servidor.

El portal se comunica exclusivamente a través de APIs GraphQL federadas, utilizando Apollo Client como cliente GraphQL. Esta decisión arquitectónica permite que el frontend solicite exactamente los datos que necesita en cada vista, reduciendo el tamaño de las respuestas y mejorando los tiempos percibidos de carga. El esquema GraphQL integra datos de todos los microservicios backend a través de una capa de gateway que implementa el patrón schema stitching.

La autenticación y autorización se gestionan mediante un servicio de identidad dedicado construido sobre OpenID Connect y OAuth 2.0. El portal delega la autenticación a este servicio y recibe tokens JWT que se validan en cada request. Los permisos se definen basado en roles con granularidad a nivel de recursos y acciones, permitiendo configuraciones como acceso de solo lectura a ciertos módulos, permisos de aprobación de gastos o capacidad de modificar parámetros de configuración de rutas.

## 3. Patrones de Comunicación entre Servicios

### 3.1 API Gateway y BFF

Todas las comunicaciones externas al ecosistema Spottruck pasan a través de un API Gateway unificado basado en Kong, que actúa como punto de entrada único para todas las APIs públicas. El gateway implementa funcionalidades de seguridad como autenticación de tokens, limitación de tasa de solicitudes, validación de schemas de request y logging centralizado de todas las transacciones.

Para el portal de clientes se implementa el patrón Backend for Frontend, donde un servicio dedicado denominado BFF actúa como una capa intermedia entre el gateway y los microservicios internos. Este BFF está desarrollado específicamente para cada tipo de cliente (web, móvil iOS, móvil Android) y optimiza las consultas a los servicios internos según las necesidades específicas de cada interfaz, incluyendo transformación de datos, agregación de respuestas múltiples y caché específico por tipo de cliente.

### 3.2 Mensajería Asíncrona con Kafka

El bus de eventos centralizado está implementado utilizando Apache Kafka, proporcionando pub/sub de alta capacidad y persistencia de mensajes para procesamiento en caso de fallos. Cada servicio posee sus propios topics de publicación para eventos que genera y suscripciones a topics de otros servicios cuyos eventos pueden afectar su procesamiento.

La estrategia de versionado de eventos sigue el patrón de evolución de schemas, donde cada evento incluye un campo de versión que permite a los consumidores procesar versiones antiguas mientras completan su migración. Los schemas de los eventos se almacenan y versionan en un registro de esquemas centralizado basado en Confluent Schema Registry.

Los patrones de procesamiento de eventos incluyen tanto consumidores que procesan eventos de forma individual para operaciones que requieren respuesta inmediata, como consumidores basados en procesadores de streaming que agregan y correlacionan eventos a lo largo del tiempo para generar vistas materializadas y alertas complejas.

### 3.3 Contratos de API y Versionado

Los microservicios de Spottruck exponen sus funcionalidades a través de APIs RESTful con especificación OpenAPI 3.0. Cada servicio mantiene su propia especificación de API y genera automáticamente clientes en múltiples lenguajes que se versionan junto con el servicio que los genera.

La estrategia de versionado sigue un enfoque de versionado de URL para las APIs REST, donde cada versión mayor se publica en un nuevo path manteniendo las versiones anteriores activas durante un período de migración de mínimo seis meses. Los cambios menores y correcciones se publican sin cambio de versión para fomentar la adopción de APIs estables.

## 4. Infraestructura y Despliegue

### 4.1 Orquestación con Kubernetes

Todo el ecosistema Spottruck está containerizado utilizando Docker y orquestado mediante Kubernetes, tanto en su variante gestionada EKS de Amazon para entornos de producción como en clusters On-Premise administrados con Rancher para clientes que requieren despliegue en su propia infraestructura.

La definición de recursos de Kubernetes se gestiona mediante Helm charts, con un chart base que define configuraciones comunes a todos los servicios y charts específicos por dominio que heredan estas configuraciones base. Los charts incluyen definiciones de Deployments, Services, HorizontalPodAutoscalers, ConfigMaps, Secrets y PodDisruptionBudgets para garantizar alta disponibilidad.

El escalamiento horizontal se configura automáticamente basado en métricas personalizadas de Prometheus. Los servicios de API REST escalan basándose en el uso de CPU y memoria, mientras que los servicios de procesamiento como telemática y rutas escalan basándose en la longitud de las colas de mensajes pendientes y la latencia de procesamiento.

### 4.2 Service Mesh con Istio

La comunicación entre servicios internos está protegida por una service mesh basada en Istio, que proporciona mTLS mutuo entre todos los servicios, autenticación de identidad de servicios, autorización granular basada en políticas, balanceo de carga inteligente y circuit breaking automático.

Istio también proporciona observabilidad distribuida a través de su integración con Jaeger para tracing distribuido, Prometheus y Grafana para métricas, y ELK Stack para agregación y análisis de logs. Cada solicitud entre servicios incluye headers de tracing que permiten seguir una transacción a través de todos los servicios involucrados.

### 4.3 Estrategias de Despliegue

Spottruck utiliza estrategias de despliegue azul-verde y canary para todos los cambios de producción. Los despliegues azul-verde mantienen dos entornos idénticos donde el tráfico se switchea instantáneamente una vez validada la salud del nuevo despliegue. Los despliegues canary dirigen un porcentaje pequeño del tráfico al nuevo código permitiendo validación en producción antes de una adopción completa.

La automatización de despliegues está gestionada por ArgoCD, que monitorea el repositorio de GitOps y sincroniza automáticamente los cambios al cluster Kubernetes correspondiente. Cualquier cambio en la configuración o el código pasa por el pipeline de CI/CD y se refleja en el repositorio GitOps, triggers automáticos que actualizan los despliegues.

## 5. Consideraciones de Seguridad

### 5.1 Seguridad en la Capa de Aplicación

La seguridad de la aplicación Spottruck está fundamentada en el principio de defensa en profundidad, implementando múltiples capas de protección tanto en el perímetro como en comunicaciones internas y acceso a datos.

Todos los datos en tránsito están cifrados utilizando TLS 1.3 tanto para comunicaciones externas como internas. Los certificados se gestionan automáticamente a través de cert-manager que los obtiene de Let's Encrypt y los renueva automáticamente antes de su expiración. El cifrado de datos en reposo se implementa a nivel de base de datos utilizando LUKS para volúmenes y cifrado a nivel de columna para datos sensibles.

La gestión de secretos se realiza a través de HashiCorp Vault, que proporciona almacenamiento seguro, auditoría completa y acceso dinámico a credenciales. Los servicios no almacenan credenciales en memoria ni en configuración, sino que las obtienen de Vault en tiempo de ejecución con políticas de acceso granulares por servicio.

### 5.2 Cumplimiento y Regulación

Spottruck está diseñado para cumplir con las regulaciones de protección de datos aplicables en las jurisdicciones donde opera, incluyendo GDPR para clientes europeos y LGPD para Brasil. El sistema implementa funcionalidades de anonymización de datos para reportes que no requieren identificación personal, así como capacidades de portabilidad y eliminación de datos individuales según lo requerido por estas regulaciones.

Para el sector de transporte, Spottruck cumple con los requisitos de retención de datos de tacógrafo digital y registros de conductores según las normativas de cada país, manteniendo trazabilidad completa de las operaciones de cada vehículo y conductor durante los períodos requeridos por ley.
