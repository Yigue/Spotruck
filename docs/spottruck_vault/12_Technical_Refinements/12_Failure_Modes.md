---
title: "12_Modos de Fallo y Resiliencia"
description: "Documentación completa de estrategias de manejo de fallos, circuit breakers y disaster recovery para Spottruck"
date: 2026-06-04
type: refinement
phase: 12
status: active
tags:
  - failure-modes
  - circuit-breaker
  - retry-policies
  - bulkhead
  - graceful-degradation
  - disaster-recovery
  - backup
---

# Modos de Fallo y Resiliencia Spottruck - Fase 12

## 1. Patrón Circuit Breaker

El patrón Circuit Breaker es un mecanismo fundamental de resiliencia que previene fallos en cascada cuando un servicio externo o componente interno no está respondiendo correctamente. En Spottruck, donde múltiples microservicios se comunican entre sí y con APIs externas de mapas, notificaciones y procesamiento de pagos, la implementación correcta de circuit breakers es crítica para mantener la estabilidad del sistema.

### 1.1 Estados del Circuit Breaker

El circuit breaker en Spottruck operará en tres estados distintos, cada uno con comportamiento específico y transiciones bien definidas basadas en métricas de salud del servicio protegido.

**Estado Cerrado (Closed)**: En condiciones normales de operación, el circuit breaker permanece cerrado, permitiendo que todas las requests pasen a través del servicio protegido. Este es el estado default cuando el sistema inicia y funciona correctamente. Un contador interno registra el número de fallos consecutivas o en una ventana de tiempo determinada. Cuando este contador supera un umbral configurado (típicamente 5 fallos en 10 segundos), el circuit breaker transiciona al estado abierto.

**Estado Abierto (Open)**: Cuando el circuit breaker está abierto, todas las requests al servicio protegido son rechazadas inmediatamente sin ejecutar la llamada. En lugar de esperar timeout y consumir recursos, se devuelve una respuesta de error predefinida o se ejecuta un fallback. El circuit breaker permanece en estado abierto por una duración fija configurable (default: 30 segundos), después de lo cual transiciona automáticamente al estado semi-abierto.

**Estado Semi-Abierto (Half-Open)**: En este estado transitorio, el circuit breaker permite que un número limitado de requests de prueba (típicamente 3-5) pasen al servicio protegido para evaluar si ha recuperado su disponibilidad. Si estas requests de prueba son exitosas, el circuit breaker transiciona a estado cerrado y el contador de errores se reinicia. Si cualquiera de las requests de prueba falla, el circuit breaker vuelve inmediatamente al estado abierto y el temporizador de apertura se reinicia.

### 1.2 Configuración por Servicio

Cada dependencia externa de Spottruck tendrá su propia configuración de circuit breaker adaptada a sus características de rendimiento y criticidad para el negocio. Los parámetros específicos incluirán umbrales de apertura basados en tipo de error (timeout, connection refused, 5xx del servidor remoto), duración de apertura (30 segundos para APIs de mapas, 60 segundos para APIs de pago) y número de requests de prueba en estado semi-abierto.

Para la integración con APIs de mapas como Google Maps o Mapbox, el circuit breaker se configurará con timeouts agresivos (3 segundos) dado que los usuarios esperan respuestas rápidas en aplicaciones de tracking. Para APIs de notificación como SendGrid o Twilio, se permitirán timeouts más largos (10 segundos) dado que la entrega de notificaciones no es blocking para la operación principal.

### 1.3 Métricas y Monitoreo

El circuit breaker expondrá métricas detalladas para monitoreo que incluyen: número de requests totales, número de requests bloqueadas en estado abierto, número de transiciones entre estados, tiempo promedio de respuesta cuando está cerrado y duración acumulada en cada estado. Estas métricas alimentarán dashboards de Grafana con alertas automáticas cuando la tasa de apertura supere umbrales definidos.

## 2. Estrategias de Fallback para APIs Externas

### 2.1 APIs de Geocoding y Mapas

Spottruck depende de servicios de mapas para geocoding directo e inverso, cálculo de rutas y visualización de posiciones. Cuando estos servicios no están disponibles, el sistema implementará las siguientes estrategias de fallback que mantienen la funcionalidad core.

**Proveedor Secundario Automático**: La arquitectura de integración de mapas utilizará un patron de Provider Chain donde cada request intentará primero el proveedor primario (Google Maps) y, tras N intentos fallidos con circuit breaker abierto, automáticamente intentará el proveedor secundario (Mapbox o OpenStreetMap con Nominatim). Los resultados de ambos proveedores se normalizarán a un formato común para garantizar consistencia.

**Modo Offline para Rastreo**: Para funcionalidades de tracking en tiempo real, cuando la API de mapas no esté disponible, el sistema continuará rastreando vehículos utilizando纯粹的 coordenadas GPS sin procesamiento de reverse geocoding. Las direcciones se mostrarán como coordenadas hasta que el servicio se recupere, con un mensaje informativo para el usuario.

**Cacheo de Resultados Críticos**: Resultados de geocoding para ubicaciones frecuentes (centros de distribución, clientes regulares) serán cacheados en Redis con TTL extendido (24 horas). Este cacheo proporcionará datos utilizables incluso durante interrupciones completas del servicio de mapas.

### 2.2 APIs de Notificación

Cuando los servicios de notificación (email, SMS, push) no estén disponibles, Spottruck implementará un sistema de queue persistente que almacenará mensajes fallenes para retry posterior.

**Notificaciones Programadas**: En lugar de delivery inmediato, el sistema cambiará a modo de acumulación donde las notificaciones se agruparán y procesarán cuando el servicio se recupere. Para notificaciones críticas como alertas de emergencia, se implementará un canal de backup usando servicios alternativos con menor capacidad pero mayor disponibilidad.

**Email Transaccional**: Para emails de confirmación de pedido o facturas, se utilizará un template HTML estático con la información esencial, enviando a través de servidor SMTP fallback cuando el servicio principal de email (SendGrid) esté down. Las funcionalidades avanzadas como analytics de email se deshabilitarán temporalmente.

### 2.3 APIs de Procesamiento de Pagos

El procesamiento de pagos es el área más sensible donde las estrategias de fallback deben balancear disponibilidad con seguridad financiera.

**Retry con Idempotencia**: Todas las llamadas a APIs de pago serán acompañadas de idempotency keys que garantizan que retries no resultarán en cargos duplicados. El cliente de payments implementará retry automático con backoff exponencial para errores transitorios (timeouts, 429 Rate Limited) mientras que errores de validación (400 Bad Request) se tratarán como fallos permanentes sin retry.

**Modo Contingencia**: Para pagos con tarjeta cuando la pasarela principal (Stripe) no esté disponible, se activará la pasarela de backup (PayU o PayPal). La UI mostrará claramente qué pasarela está siendo utilizada. Para pagos contra reembolso o transferencia bancaria, estos métodos permanecerán siempre disponibles como alternativas que no dependen de procesamiento en tiempo real.

## 3. Políticas de Reintento con Exponential Backoff

### 3.1 Algoritmo de Exponential Backoff

El algoritmo de exponential backoff implementado en Spottruck incrementará el tiempo de espera entre reintentos de manera exponencial después de cada intento fallido, combinado con jitter aleatorio para prevenir thundering herd problem.

La fórmula base será: wait_time = base_delay * (2 ^ attempt_number) + random_jitter, donde base_delay es el tiempo base según el tipo de operación, attempt_number comienza en 0, y random_jitter es un valor aleatorio entre 0 y el wait_time calculado.

### 3.2 Configuración por Tipo de Operación

**Operaciones de Lectura (GET requests)**: Para operaciones de lectura que pueden ser reintentadas sin efectos secundarios, se configurarán hasta 3 reintentos con delays iniciales de 100ms. El jitter será uniforme entre 0 y 100ms para distribuir la carga cuando múltiples clientes experimentan el mismo fallo.

**Operaciones de Escrita (POST/PUT requests)**: Para operaciones de escritura que modifican estado, se requerirán idempotency keys y se permitirán hasta 5 reintentos con delays iniciales de 500ms. El jitter será exponencial para reducir colisiones.

**Operaciones Críticas (Pagos, Confirmaciones)**: Para operaciones que involucran transacciones financieras, se permitirá un máximo de 3 reintentos con delays iniciales de 1 segundo, timeout total de 30 segundos, y siempre verificando el estado actual antes de reintentar para evitar condiciones de carrera.

### 3.3 Condiciones de Retry

El sistema diferenciará entre errores retryables y no-retryables basándose en códigos de error. Errores de tipo timeout, connection reset, 429 Too Many Requests y 503 Service Unavailable serán considerados retryables. Errores de tipo 400 Bad Request, 401 Unauthorized, 403 Forbidden y 404 Not Found serán considerados no-retryables, indicando un problema con la request que debe ser corregido programáticamente.

Los reintentos serán cancelados si se detecta que el recurso fue modificado por otra operación, utilizando ETags o timestamps de última modificación. Esto preveniene la propagación de stale data.

## 4. Aislamiento mediante Bulkhead Pattern

### 4.1 Arquitectura de Bulkhead

El patrón Bulkhead en Spottruck aísla diferentes componentes del sistema en pools de recursos separados, evitando que el fallo de un componente consuma todos los recursos disponibles y cause fallos en cascada a otros componentes.

**Separación de Thread Pools**: Cada tipo de operación (HTTP requests síncronas, procesamiento de mensajes async, workers de background jobs) tendrá su propio pool de threads o workers dimensionado según sus necesidades específicas. El pool de HTTP clients para APIs externas tendrá máximo 50 conexiones simultáneas, mientras que el pool de procesamiento de eventos tendrá 20 workers concurrentes.

**Separación de Bases de Datos**: Las diferentes bounded contexts del dominio tendrán sus propios schemas o databases separadas con pools de conexiones dedicados. Esto previene que una query problemática en el módulo de reportes degrade la performance del módulo de tracking en tiempo real.

**Separación de Colas de Mensajes**: Los diferentes tipos de mensajes (eventos de tracking, notificaciones, jobs de procesamiento pesado) serán procesados por colas separadas con consumers dedicados, garantindo que un backlog de jobs pesados no afecte la latencia de mensajes críticos.

### 4.2 Configuración de Límites

Los límites de recursos por bulkhead se configurarán de forma que cada componente pueda funcionar de forma independiente hasta cierto punto de degradación. El número máximo de conexiones externas por servicio será el 20% del total disponible, garantizando que incluso consumo máximo de un servicio no impida a otros funcionar.

Se implementará back-pressure signals que notifiquen a los servicios cuando los límites de su bulkhead se aproximen, permitiéndoles reducir la tasa de requests o rechazar trabajo de forma graceful antes de agotar recursos completamente.

## 5. Degradación Graceful

### 5.1 Principios de Degradación

La degradación graceful en Spottruck sigue el principio de que funcionalidad parcial es preferible a funcionalidad nula. El sistema continuará operando con capacidades reducidas en lugar de fallar completamente cuando componentes no críticos experimentan problemas.

**Core vs. Non-Core**: Cada feature será clasificada como core (esencial para operación básica) o enhancement (valor agregado). Las features core deben funcionar incluso con servicios de backup menos confiables, mientras que las enhancement pueden ser deshabilitadas temporalmente sin impacto en la operación del cliente.

### 5.2 Escenarios de Degradación

**Fallback de Visualización de Mapa**: Cuando el servicio de mapas no responde, la aplicación mostrará posiciones de vehículos en una lista detallada en lugar del mapa visual. Los usuarios podrán continuar monitoreando su flota sin visualización cartográfica.

**Notificaciones Diferidas**: Cuando el servicio de notificaciones está degradado, las notificaciones push serán convertidas a email con TTL extendido. Los usuarios no experimentarán pérdida de información crítica, solo retraso en la entrega.

**Reportes Simplificados**: Cuando el procesamiento de reportes está sobrecargado, se generarán reportes simplificados con agregaciones básicas en lugar de reports detallados con múltiples dimensiones. La funcionalidad de reporting completo se reactivará automáticamente cuando la carga disminuya.

**Búsqueda Limitada**: Cuando el servicio de búsqueda elástica está down, se utilizará búsqueda basic contra PostgreSQL con funcionalidades reducidas (sin autocomplete, sin búsqueda fuzzy). Los usuarios podrán encontrar registros exactos por ID o nombre completo.

### 5.3 Detección y Activación

La degradación se activará automáticamente basada en métricas de salud de cada servicio. Cuando el P95 de latency supere 2 segundos o la tasa de error exceda 5% por más de 1 minuto, el sistema activará automáticamente el fallback correspondiente y notificará al equipo de operaciones.

## 6. Plan de Recuperación de Desastres

### 6.1 Definición de Escenarios de Desastre

El plan de recuperación de desastres (DRP) de Spottruck addressing multiple disaster scenarios ranging from single server failures to complete datacenter outages. Cada escenario tiene objetivos de recuperación específicos (RTO - Recovery Time Objective) y puntos de recuperación (RPO - Recovery Point Objective).

**Escenario 1: Fallo de Instancia de Aplicación**: Una instancia de aplicación individual falla, impacting potentially 50% de capacidad si es en un grupo de auto-scaling. RTO: 5 minutos (auto-scaling reemplaza automáticamente). RPO: 0 (no data loss dado stateless design).

**Escenario 2: Fallo de Base de Datos Primaria**: La base de datos PostgreSQL primaria deja de funcionar. RTO: 15 minutos (promoción de réplica a primaria). RPO: 1 minuto (replicación síncrona a standby).

**Escenario 3: Fallo de Región Completa**: Un datacenter entero o región cloud se vuelve inaccesible. RTO: 2 horas (failover a región secundaria). RPO: 15 minutos (replicación cross-region).

### 6.2 Procedimientos de Failover

**Database Failover**: El failover de PostgreSQL utilizará Patroni para orchestrate automáticamente la promoción de una réplica a primaria. El proceso incluye: detección de fallo de primaria mediante health checks, elección de nueva primaria basada en lag de replicación, actualización de DNS paraapis de conexión, y reconexión de aplicaciones con nuevo endpoint. El proceso está diseñado para completarse en menos de 15 minutos con RPO de menos de 1 minuto.

**Application Failover**: Las aplicaciones Stateless serán desplegadas en múltiples zonas de disponibilidad con load balancer health checks. Cuando una zona falla, el tráfico será automáticamente redirigido a instancias saludables en otras zonas. El tiempo de failover para aplicaciones es inferior a 5 minutos gracias al auto-scaling y health checks con intervalo de 30 segundos.

**Cross-Region Failover**: Para recuperación de desastres a nivel de región, se mantendrá una región secundaria en modo warm standby con replicación continua de datos y configuraciones sincronizadas. El failover manual será orquestado por el equipo de operaciones utilizando runbooks documentados, con tiempo objetivo de 2 horas para recuperación completa.

### 6.3 Runbooks de Recuperación

Cada escenario de desastre tendrá un runbook específico con pasos numerados, comandos exactos a ejecutar, y criterios de verificación para confirmar recuperación exitosa. Los runbooks serán revisados y probados trimestralmente mediante ejercicios de disaster recovery simulation.

## 7. Procedimientos de Backup y Restauración

### 7.1 Frecuencia de Backups

**Backups de Base de Datos**: PostgreSQL tendrá backups automáticos diarios completos con WAL (Write-Ahead Logging) continuo para point-in-time recovery. Los backups completos se retendrán por 30 días, con backups incrementales cada 6 horas. Los WAL segments se archivan continuamente a almacenamiento persistente.

**Backups de Aplicación y Configuración**: Los artefactos de aplicación, configuración de infraestructura como código, y secrets cifrados serán respaldados automáticamente a cada commit hacia el repositorio principal, con retention de 90 días.

**Backups de Datos de Usuario**: Los uploads de usuarios (documentos, imágenes) serán respaldados diariamente con Versioning habilitado para permitir recuperación de versiones anteriores. El Versioning se retiene por 30 días.

### 7.2 Validación de Backups

Se realizarán pruebas de restauración mensuales donde el equipo de operaciones restaurará backups en un ambiente de staging aislado, verificando la integridad de los datos y la funcionalidad de la aplicación restaurada. Cualquier fallo en la validación de backup resultará en revisión inmediata del proceso y documentación de lecciones aprendidas.

### 7.3 Procedimiento de Restauración

El procedimiento de restauración seguirá estos pasos documentados: primero, identificación del punto de recuperación necesario basado en RPO; segundo, preparación del ambiente de destino (nuevo servidor o instancia limpia); tercero, restauración del backup completo más reciente anterior al punto de recuperación; cuarto, aplicación de WAL para llegar al punto exacto; quinto, verificación de integridad de datos mediante checksums y queries de validación; y sexto, redirección de tráfico una vez verificación completada.

El tiempo máximo de restauración para datos de base de datos está especificado en 4 horas para recuperación point-in-time, con procedimientos optimizados que utilizan parallel restore y bulk indexing post-restauración.

### 7.4 Retención y Cumplimiento

Los backups cumplirán con regulaciones de retención de datos financieros (10 años para facturas y documentos contables) y logs de auditoría (5 años). Los backups se almacenarán en ubicaciones geográficas separadas de los datos originales para protección contra desastres regionales. El cifrado de backups en reposo utilizará AES-256 con claves separadas de las claves de producción.

---

*Documento de Modos de Fallo y Resiliencia - Spottruck - Fase 12*
*Versión: 1.0*
*Fecha de creación: 2026-06-04*
