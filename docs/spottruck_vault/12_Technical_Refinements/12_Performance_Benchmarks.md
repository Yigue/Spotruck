---
title: "12_Benchmarks de Rendimiento"
description: "Estrategia de pruebas de carga y benchmarks de rendimiento para Spottruck con KPIs definidos"
date: 2026-06-04
type: refinement
phase: 12
status: active
tags:
  - performance
  - benchmarks
  - load-testing
  - k6
  - artillery
  - redis
  - cdn
  - frontend-performance
  - lcp
---

# Benchmarks de Rendimiento Spottruck - Fase 12

## 1. Estrategia de Pruebas de Carga

Las pruebas de carga son fundamentales para garantizar que Spottruck pueda manejar la demanda esperada en producción, proporcionando confianza en la escalabilidad del sistema y identificando cuellos de botella antes de que afecten a usuarios reales. La estrategia de pruebas de carga se divide en múltiples categorías que evalúan diferentes aspectos del rendimiento del sistema bajo condiciones variadas de carga.

### 1.1 Tipos de Pruebas de Carga

**Pruebas de Carga Base (Baseline Load Testing)**: Estas pruebas establecen el rendimiento del sistema bajo condiciones normales de operación, representando el día típico de un cliente. Se simulará la carga esperada de 1000 usuarios concurrentes realizando operaciones comunes como consulta de estado de flota, actualización de posiciones GPS, generación de reportes y búsqueda de rutas. Los resultados de estas pruebas servirán como referencia para comparar mejoras y detectar regresiones de rendimiento.

**Pruebas de Estrés (Stress Testing)**: El objetivo de las pruebas de estrés es identificar el punto de quiebre del sistema, aumentando la carga progresivamente hasta superar las capacidades esperadas. Se comenzará con el doble de la carga base (2000 usuarios) aumentando en incrementos del 25% hasta observar degradación significativa del rendimiento o fallos del sistema. Estas pruebas revelan cómo se comporta el sistema bajo condiciones extremas y qué recursos se agotan primero.

**Pruebas de Escalabilidad (Scalability Testing)**: Estas pruebas evalúan la capacidad del sistema para escalar horizontalmente, midiendo si añadir capacidad de procesamiento reduce linealmente los tiempos de respuesta. Se ejecutarán las mismas pruebas con 1, 2, 4 y 8 nodos de procesamiento, verificando que los tiempos de respuesta se reduzcan proporcionalmente.

**Pruebas de耐力 (Endurance Testing)**: Ejecutando carga moderada sostenida durante períodos prolongados (24-72 horas), estas pruebas detectan problemas de memoria, conexiones de base de datos y acumulación de datos que solo se manifiestan con el tiempo. Se monitoreará especialmente el comportamiento de conexiones a Redis, pools de conexiones y crecimiento de logs.

### 1.2 Herramientas de Pruebas

**k6**: Será la herramienta principal para pruebas de carga de APIs REST y GraphQL. k6 ofrece scripting en JavaScript/TypeScript con soporte nativo para Grafana y Prometheus, proporcionando métricas detalladas de rendimiento. Los scripts de k6 permitirán simular escenarios de usuario realistas incluyendo think times, ramp-up gradual y ramp-down controlado. Se configurarán umbrales (thresholds) que fallarán la prueba si los KPIs no se cumplen.

**Artillery**: Se utilizará Artillery como alternativa o complemento para pruebas más complejas que involucren arquitecturas de microservices con múltiples endpoints correlacionados. Artillery ofrece capacidades avanzadas de scripting con soporte para escenarios stateful, útiles para simular flujos de negocio completos como el ciclo de vida de una entrega desde creación hasta confirmación.

**Locust**: Como tercera opción, Locust será empleado para pruebas distribuidas a gran escala debido a su arquitectura master-slave que permite generar cargas muy elevadas desde múltiples máquinas generadoras. Su interface web de monitoreo en tiempo real facilita la observación del progreso de las pruebas.

## 2. KPIs de Rendimiento Esperados

Los siguientes KPIs constituyen los objetivos de rendimiento que Spottruck deberá cumplir antes de cada release a producción. Estos valores han sido establecidos basándose en expectativas de la industria y requisitos de negocio definidos con stakeholders.

### 2.1 Tiempo de Respuesta

**Objetivo Principal**: Tiempo de respuesta P95 inferior a 200ms para todas las APIs críticas. El percentil 95 es elegido en lugar del promedio porque representa la experiencia de la mayoría de los usuarios (95% experimentarán tiempos de respuesta iguales o mejores que este valor) mientras que el promedio puede ser distorsionado por outliers extremos.

**Segmentación por Tipo de Endpoint**:
- APIs de lectura simple (GET /api/v1/flotas/{id}): P95 < 100ms
- APIs de escritura simple (POST /api/v1/entregas): P95 < 150ms
- APIs de lectura compleja (GET /api/v1/reportes/consolidado): P95 < 500ms
- APIs de operaciones batch (POST /api/v1/flotas/bulk-update): P95 < 2000ms

**Tiempo de Carga de Página Completa**: Las páginas de la aplicación web deberán cargar completamente en menos de 3 segundos bajo condiciones de red 4G típica. Se excluirán tiempos de carga de recursos externos (CDN de terceros, fuentes tipográficas) fuera del control directo del equipo.

### 2.2 Concurrencia

**Objetivo**: Sistema capaz de mantener 1000 usuarios concurrentes activos sin degradación perceptible del servicio. Un usuario activo se define como alguien que ha realizado al menos una interacción con el sistema en los últimos 60 segundos.

**Pico de Concurrencia**: El sistema deberá manejar picos de hasta 2500 usuarios concurrentes durante períodos de hasta 15 minutos sin errores, experimentando únicamente un aumento moderado de tiempos de respuesta (no más del 50% por encima del baseline).

### 2.3 Throughput

**Objetivo**: Procesar un mínimo de 100 Transacciones Por Segundo (TPS) considerando una transacción como una operación completa de API que involucra autenticación, validación, procesamiento de negocio y persistencia. Este valor representa la capacidad típica para la base de clientes inicial de Spottruck.

**Throughput Pico**: Capacidad de procesar hasta 300 TPS durante ráfagas de hasta 1 minuto, mediante buffers de procesamiento y queue management que absorban los picos.

## 3. Optimización de Base de Datos

La base de datos representa frecuentemente el componente más crítico para el rendimiento de aplicaciones empresariales. Spottruck utiliza PostgreSQL como base de datos relacional principal, complementado con Redis para caching y MongoDB para datos de documentos.

### 3.1 Objetivos de Optimización

**Tiempo de Query**: El 90% de las queries de lectura deberán ejecutarse en menos de 50ms. Queries que superen este umbral serán marcadas para optimización mediante índices adicionales o reescritura.

**Conexiones Concurrentes**: El pool de conexiones a PostgreSQL será configurado para mantener entre 20-50 conexiones activas, utilizando PgBouncer para multiplexar conexiones de aplicación. Se monitoreará el uso de conexiones para evitar agotamiento.

**Replicación**: Se implementará replicación asíncrona a al menos una réplica de lectura que redistribuya el tráfico de consultas, reduciendo la carga sobre el nodo primario en un 40%.

### 3.2 Estrategias de Indexación

Se implementará indexación estratégica basada en los patrones de query identificados. Los índices compuestos se crearán para queries que involucren múltiples columnas frecuentemente usadas en filtros. Los índices parciales se utilizarán para queries sobre subconjuntos específicos de datos (como registros activos vs. archivados).

Se ejecutará análisis mensual de uso de índices utilizando pg_stat_user_indexes para identificar índices no utilizados que consumen espacio de almacenamiento y impacto en rendimiento de escritura sin beneficio.

### 3.3 Query Optimization

Todas las queries complejas (con JOINs de múltiples tablas o subqueries) serán analizadas mediante EXPLAIN ANALYZE para verificar que utilizan los índices apropiados. Se establecerá un máximo de 5 JOINs por query, desnormalizando esquemas cuando sea necesario para evitar joins excesivos.

## 4. Estrategia de Caching con Redis

### 4.1 Objetivos de Tasa de Aciertos

**Meta Principal**: Lograr una tasa de aciertos de caché (cache hit rate) superior al 90% para reads. Esta meta se fundamenta en el principio de que la mayoría de las operaciones en Spottruck son lecturas de datos que cambian con poca frecuencia, como catálogos de productos, información de flotas y estados de rutas.

**Tasa de Aciertos por Tier**:
- Caché de sesiones: > 99%
- Caché de consultas frecuentes: > 95%
- Caché de datos de flota: > 90%
- Caché de reportes: > 85%

### 4.2 Estructura de Caché

**Caché de Sessiones**: Las sesiones de usuario se almacenarán en Redis con TTL de 24 horas, refresh automático en cada actividad. La key será el session token con prefijo "session:".

**Caché de Entidades**: Los objetos de dominio (Flota, Vehículo, Conductor, Ruta) serán cacheados individualmente con TTL de 15 minutos para datos dinámicos y 1 hora para datos estáticos. Se utilizará invalidación basada en eventos para actualización inmediata cuando los datos subyacentes cambien.

**Caché de Queries**: Resultados de queries complejas que involucren agregaciones o cálculos extensos serán cacheados con keys basadas en hash de los parámetros de query. El TTL será de 5 minutos para queries que involucren datos en tiempo real.

### 4.3 invalidación de Caché

Se implementará invalidación de caché en múltiples niveles: invalidación directa cuando una entidad es modificada, invalidación por patrón usando SCAN para encontrar y eliminar keys relacionadas, e invalidación TTL para garantizar que ningún dato permanezca stale indefinidamente.

## 5. Optimización de CDN

### 5.1 Assets Estáticos

Todo el contenido estático de Spottruck incluyendo JavaScript bundles, CSS, imágenes e iconos será servido a través de una CDN con edge nodes distribuidos geográficamente. Los headers de cache-control se configurarán para assets con hash de contenido único, permitiendo caching de largo plazo (1 año) mientras garantiza actualización cuando el contenido cambia.

### 5.2 Estrategias de Edge Computing

Se evaluará el uso de edge functions para procesamiento ligero que pueda realizarse más cerca del usuario, como validación de autenticación token y transformación de respuestas de API para formatos específicos de dispositivo.

### 5.3 Configuración de Cache

La estrategia de cacheo de API será diferenciada: respuestas de APIs públicas con alta tasa de cacheo usarán CDN como primer nivel, mientras que APIs personalizadas usarán cache privado. Los stale-while-revalidate headers permitirán servir contenido ligeramente outdated mientras se actualiza en background.

## 6. Objetivos de Rendimiento Frontend

### 6.1 Core Web Vitals

**Largest Contentful Paint (LCP)**: Tiempo hasta que el elemento visual más grande de la página es visible: Objetivo < 2.5 segundos. Este metric mide la percepción de carga de la página. Para lograr este objetivo se implementará lazy loading de imágenes, preload de recursos críticos y optimización de la renderización del above-the-fold content.

**First Input Delay (FID)**: Tiempo entre la primera interacción del usuario y la respuesta del navegador: Objetivo < 100ms. Este metric evalúa la responsividad de la aplicación. Se logrará mediante code splitting para reducir el JavaScript del main thread, defer de scripts no críticos y web workers para procesamiento pesado.

**Cumulative Layout Shift (CLS)**: Cambios inesperados de layout: Objetivo < 0.1. Este metric mide la estabilidad visual. Se garantizará mediante dimensiones explícitas para todos los elementos multimedia y reserva de espacio para contenido dinámico.

### 6.2 Tiempos de Carga de Página

**Primera Carga (First Load)**: Página principal completa con autenticación: < 3.5 segundos en conexión 4G típica (10 Mbps, 50ms latency). Este tiempo incluye handshake TLS, descarga de todos los recursos necesarios y ejecución de JavaScript inicial.

**Cargas Subsecuentes**: Páginas navegadas después de la carga inicial: < 1 segundo,得益于 Service Workers y cacheo agresivo de recursos estáticos.

### 6.3 Optimización de JavaScript

Se implementará tree shaking para eliminar código muerto de los bundles. El código será dividido en chunks lógicos que se carguen bajo demanda (route-based code splitting). El tamaño máximo del initial bundle será de 250KB gzipped, con cualquier feature que exceda este umbral siendo lazy loaded.

### 6.4 Optimización de Imágenes

Todas las imágenes serán servidas en formatos modernos (WebP, AVIF) con fallback a JPEG para navegadores legacy. Las imágenes serán responsivas usando srcset para diferentes densities y tamaños de viewport. Imágenes below-the-fold serán lazy-loaded con Intersection Observer.

## 7. Plan de Optimización de Cuellos de Botella

### 7.1 Identificación de Cuellos de Botella

Se utilizarán herramientas de profiling en producción para identificar los componentes más lentos del sistema. APM (Application Performance Monitoring) con Datadog, New Relic o similar proporcionará tracing distribuido para identificar exactamente dónde se consume el tiempo en requests.

### 7.2 Plan de Mitigación por Componente

**Base de Datos**:
- Implementación de connection pooling con PgBouncer
- Creación de índices para queries identificadas como lentas
- Implementación de read replicas para distribuir carga
- Consideración de horizontal sharding si el crecimiento lo requiere

**Aplicación**:
- Profile-guided optimization del código hot path
- Implementación de async/await para operaciones I/O bound
- Cacheo agresivo de resultados de operaciones costosas

**Infraestructura**:
- Autoscaling basado en métricas de rendimiento
- Distribución geográfica de instancias
- Optimización de configuración de load balancer

### 7.3 Monitoreo Continuo

Se implementará dashboards de Grafana con alertas automáticas cuando los KPIs se acerquen a los umbrales definidos. Se realizarán regression tests de rendimiento en cada release, comparando resultados con la baseline para detectar regresiones antes de producción.

---

*Documento de Benchmarks de Rendimiento - Spottruck - Fase 12*
*Versión: 1.0*
*Fecha de creación: 2026-06-04*
