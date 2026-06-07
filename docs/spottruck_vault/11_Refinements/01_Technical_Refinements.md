---
title: "Spottruck Refinimientos Técnicos"
date: 2026-06-04
author: "Jarvis Agent"
status: "draft"
tags: [spottruck, technical, resilience]
---

# Spottruck — Refinimientos Técnicos

## Resumen

Este documento detalla las estrategias de resiliencia y manejo de fallos para el sistema Spottruck. Se abordan casos extremos en subastas concurrentes, patrones de circuit breaker, estrategias de retry con backoff exponencial, y aislamiento mediante bulkheads. El objetivo es garantizar operación continua ante fallos parciales en componentes críticos.

---

## 1. Análisis de Casos Extremos

### 1.1 Subastas Concurrentes

El escenario de pujas simultáneas representa uno de los desafíos más complejos del sistema. Cuando múltiples usuarios intentan pujar en el mismo vehículo dentro de una ventana temporal reducida, pueden producirse condiciones de carrera que comprometan la integridad de la puja ganacky.

**Escenario: Double bid en el último segundo**

Un usuario envía una puja de $50,000 a las 23:59:58.999 mientras otro usuario envía $50,100 a las 23:59:59.001. Ambos llegan al servidor con diferencia de 2ms. Sin control adecuado, ambos podrían ser aceptados si la validación usa timestamps de cliente.

```
Puja A: { user_id: "U1", vehicle_id: "V1", amount: 50000, client_timestamp: 1709671198999 }
Puja B: { user_id: "U2", vehicle_id: "V1", amount: 50100, client_timestamp: 1709671199001 }
```

**Mitigación**: El servidor debe usar un sequence number monotónicamente creciente por vehículo. Cada puja recibe un número de secuencia del servidor antes de cualquier procesamiento. La puja vencedora es siempre la de mayor secuencia, no la de mayor timestamp.

**Race condition en extensión de ventana**

Cuando una puja entra en los últimos 30 segundos, la regla de negocio extiende la ventana por 2 minutos. Si llegan 5 pujas casi simultáneas al límite, cada una dispara una extensión independiente.

**Solución**: Las extensiones se procesan mediante un锁 distribuido (distributed lock) por vehicle_id. Solo la primera puja en adquirir el锁 puede extender; las siguientes heredan la nueva ventana sin disparar extensiones adicionales.

### 1.2 Fallos de Red

**Partition network parcial**

Un camionero pierde conectividad durante 45 segundos mientras la aplicación está en segundo plano. La app reintenta automáticamente y establece nueva conexión. El servidor recibe múltiples heartbeats de reconnect.

**Manejo**: El servidor debe detectar el patrón de reconnect rápido y no interpretar esto como intención maliciosa. Se implementa un cooldown de 60 segundos antes de marcar al usuario como offline.

**Partial upload**

Un conductor sube fotos de su camión. La conexión se interrumpe al 73% de la transferencia. El servidor tiene un multipart upload handler que soporta resume.

**Estrategia**: El cliente envía un identificador de upload junto con el offset. El servidor completa el chunk parcial y responde con el nuevo offset para continuar.

---

## 2. Modos de Fallo

### 2.1 Base de Datos No Disponible

El servicio de PostgreSQL deja de responder por timeout de conexiones agotadas. Esto puede ocurrir por:
- Queries sin índice que bloquean conexiones
- Conexiones no liberadas por código defectuoso
- Mantenimiento planificado sin HA configurado

**Fallback por niveles**:

1. **Nivel 1 (Read operations)**: Cache local con TTL de 30 segundos. Para lecturas no críticas, se sirve desde cache mientras se intenta reconectar.
2. **Nivel 2 (Write operations críticas)**: Cola local en memoria (max 1000 eventos). Cuando la conexión se recupera, el producer relee la cola y replaya los eventos en orden.
3. **Nivel 3 (Write operations no críticas)**: Se responde error 503 al cliente con retry-after header.

**Fallback de lectura**:

```
function getVehicleListing(vehicleId):
    cached = redis.get(f"vehicle:{vehicleId}")
    if cached:
        return deserialize(cached)
    
    try:
        db = postgresPool.acquire(timeout=100ms)
        vehicle = db.query("SELECT * FROM vehicles WHERE id = ?", vehicleId)
        redis.setex(f"vehicle:{vehicleId}", 30, serialize(vehicle))
        return vehicle
    catch PoolTimeout:
        log.warn("DB pool exhausted, serving stale cache")
        return redis.getStale(f"vehicle:{vehicleId}")
```

### 2.2 Timeout del Gateway de Pagos

MercadoPago tarda más de 10 segundos en responder. El pool de conexiones está saturado.

**Síntomas observables**:
- Latencia p95 > 5s en endpoints de checkout
- Error rate en pagos > 5%
- Memory usage elevado por requests encolados

**Respuesta inmediata**:
- Reducir timeout de lectura a 3 segundos
- Activar modo degraded: permitir reservas temporales sin cargo
- Notificar al equipo de operaciones via PagerDuty

**Recuperación**:
- Implementar health check continuo contra MercadoPago cada 10 segundos
- Cuando el gateway responde correctamente 3 veces consecutivas, restaurar timeouts originales

### 2.3 Backlog en Message Queue

RabbitMQ tiene 50,000 mensajes sin procesar. Los workers no pueden mantener el ritmo de consumo.

**Causas raíz posibles**:
- Worker instances reducidas por auto-scaling policies incorrectas
- Mensajes con payloads muy grandes que tardan en procesarse
- Dead letter queue atrapando mensajes válidos por schema validation

**Estrategia de mitigación**:

```
Queue Configuration:
- max_length: 100000
- overflow: reject-publish
- dead_letter_exchange: spottruck.dlx
- message_ttl: 3600000 (1 hora)

Dead Letter Queue Handler:
- Poll cada 5 minutos
- Si queue depth > 50000: scale workers
- Si mensaje > 3 DLX bounces: log.error + discard
```

---

## 3. Circuit Breaker Pattern

El circuit breaker previene cascadas de fallos al detener requests hacia servicios que están degradados.

### 3.1 Estados del Circuit Breaker

```
States: CLOSED → OPEN → HALF_OPEN → CLOSED

CLOSED: Operation normal, todas las requests pasan
OPEN: Fallback activa, requests inmediatamente rechazadas
HALF_OPEN: Testeo limitado, permite N requests para verificar recuperación
```

### 3.2 Pseudocódigo del Circuit Breaker

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60, half_open_requests=3):
        self.failure_count = 0
        self.success_count = 0
        self.state = State.CLOSED
        self.last_failure_time = None
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.half_open_requests = half_open_requests
        self.half_open_allowed = 0
    
    def call(self, operation, fallback=None):
        if self.state == State.OPEN:
            if self._should_attempt_reset():
                self.state = State.HALF_OPEN
                self.half_open_allowed = self.half_open_requests
            else:
                return fallback() if fallback else CircuitBreakerOpenError()
        
        try:
            result = operation()
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            return fallback() if fallback else raise e
    
    def _on_success(self):
        self.failure_count = 0
        if self.state == State.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.half_open_requests:
                self.state = State.CLOSED
                self.success_count = 0
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = now()
        
        if self.state == State.HALF_OPEN:
            self.state = State.OPEN
            self.success_count = 0
        elif self.failure_count >= self.failure_threshold:
            self.state = State.OPEN
    
    def _should_attempt_reset(self):
        elapsed = now() - self.last_failure_time
        return elapsed >= self.timeout
```

### 3.3 Métricas y Monitoreo

El circuit breaker debe exponer métricas para observabilidad:

- `circuit_breaker_state{service="pagos"}` — Estado actual (0=closed, 1=open, 2=half_open)
- `circuit_breaker_failures_total{service="pagos"}` — Contador de fallos
- `circuit_breaker_rejections_total{service="pagos"}` — Requests rechazadas por breaker abierto
- `circuit_breaker_recovery_duration_seconds{service="pagos"}` — Tiempo hasta recuperación exitosa

---

## 4. Estrategias de Retry con Backoff Exponencial

Los reintentos deben ser agresivos al principio pero rápidamente retroceder para evitar sobrecargar sistemas ya estresados.

### 4.1 Algoritmo de Backoff Exponencial

```python
import random

def calculate_backoff(attempt, base_delay=1.0, max_delay=60.0, jitter=True):
    """
    Calcula delay antes del siguiente retry.
    
    attempt: Número de intento (1-indexed)
    base_delay: Delay base en segundos (default 1s)
    max_delay: Delay máximo permitido (default 60s)
    jitter: Agrega aleatoriedad para evitar thundering herd
    """
    exponential_delay = base_delay * (2 ** (attempt - 1))
    capped_delay = min(exponential_delay, max_delay)
    
    if jitter:
        # Jitter uniform entre 0 y capped_delay
        actual_delay = random.uniform(0, capped_delay)
    else:
        actual_delay = capped_delay
    
    return actual_delay
```

### 4.2 Implementación de Retry con Dead Letter Queue

```python
class RetryHandler:
    def __init__(self, max_attempts=5, base_delay=1.0):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.dlq_producer = KafkaProducer(topic='spottruck.dlq')
    
    def execute_with_retry(self, operation, *args, **kwargs):
        last_exception = None
        
        for attempt in range(1, self.max_attempts + 1):
            try:
                return operation(*args, **kwargs)
            except RetryableError as e:
                last_exception = e
                if attempt < self.max_attempts:
                    delay = calculate_backoff(attempt, self.base_delay)
                    logger.info(f"Retry {attempt}/{self.max_attempts} in {delay:.2f}s: {e}")
                    time.sleep(delay)
                else:
                    logger.error(f"All retries exhausted, sending to DLQ: {e}")
                    self._send_to_dlq(operation, args, kwargs, last_exception)
                    raise NonRetryableError(f"Failed after {self.max_attempts} attempts")
            except NonRetryableError:
                raise
    
    def _send_to_dlq(self, operation, args, kwargs, exception):
        message = {
            'operation': operation.__name__,
            'args': str(args),
            'kwargs': str(kwargs),
            'exception': str(exception),
            'failed_at': now().isoformat(),
            'attempt_count': self.max_attempts
        }
         self.dlq_producer.send(message)
```

### 4.3 Dead Letter Queue Consumer

```python
class DLQConsumer:
    def __init__(self, max_processing_time=300):
        self.max_processing_time = max_processing_time
    
    def process_dlq(self):
        messages = self.dlq_consumer.fetch()
        
        for message in messages:
            try:
                self._process_message(message)
            except Exception:
                # Reenviar a DLQ con retry count incrementado
                self._requeue_with_backoff(message)
    
    def _process_message(self, message):
        operation_name = message['operation']
        operation = self.operation_registry.get(operation_name)
        
        if not operation:
            logger.error(f"Unknown operation in DLQ: {operation_name}")
            return
        
        start_time = now()
        context = self._build_context(message)
        
        while now() - start_time < self.max_processing_time:
            try:
                operation(context)
                return  # Éxito
            except RetryableError:
                time.sleep(calculate_backoff(1, base_delay=5))
        
        # Si llegamos aquí, el mensaje no pudo ser procesado
        logger.error(f"DLQ message failed permanently: {message}")
        self._archive_to_cold_storage(message)
```

---

## 5. Bulkhead Isolation

El patrón bulkhead aísla componentes para que el fallo de uno no destruya el sistema completo.

### 5.1 Bulkhead por Servicio

Cada servicio externo recibe su propio pool de conexiones, aislado de otros servicios.

```
Configuración de Bulkheads:

payment_gateway:
  max_connections: 20
  max_pending_requests: 50
  timeout: 3000ms
  
notification_service:
  max_connections: 10
  max_pending_requests: 100
  timeout: 5000ms
  
vehicle_database:
  max_connections: 50
  max_pending_requests: unlimited
  timeout: 1000ms
```

### 5.2 Bulkhead por Operación

```python
class BulkheadExecutor:
    def __init__(self, max_concurrent, max_queue_size):
        self.semaphore = Semaphore(max_concurrent)
        self.queue = Queue(maxsize=max_queue_size)
        self.active_count = 0
        self.rejected_count = 0
    
    def execute(self, operation, *args, **kwargs):
        if not self.semaphore.acquire(timeout=100):
            self.rejected_count += 1
            raise BulkheadRejectedError(
                f"Bulkhead at capacity: {self.active_count} active, "
                f"{self.queue.qsize()} queued"
            )
        
        self.active_count += 1
        
        try:
            return operation(*args, **kwargs)
        finally:
            self.active_count -= 1
            self.semaphore.release()
    
    def get_metrics(self):
        return {
            'active': self.active_count,
            'queued': self.queue.qsize(),
            'rejected_total': self.rejected_count
        }
```

### 5.3 Bulkhead para Subastas Paralelas

El limitador de pujas concurrentes implementa bulkhead para evitar que una auction maliciosa acapare todos los recursos.

```
Auction Bulkhead Config:
- max_concurrent_bids_per_user: 3
- max_concurrent_bids_per_vehicle: 100
- bid_timeout: 2000ms
- max_bids_per_vehicle_per_minute: 500
```

---

## 6. Monitoreo y Alertas

### 6.1 Key Metrics

| Métrica | Umbral Warning | Umbral Critical |
|---------|---------------|----------------|
| Circuit breaker state | != CLOSED | OPEN > 60s |
| DLQ depth | > 100 | > 1000 |
| Retry rate | > 5% | > 15% |
| Bulkhead utilization | > 70% | > 90% |
| Database connection wait | > 100ms | > 500ms |

### 6.2 Dashboards Críticos

- Circuit Breaker Status por servicio
- DLQ message age distribution
- Retry attempt heatmap
- Bulkhead capacity usage timeline

---

*Generado: 2026-06-04*
*Proyecto: Spottruck*
*Versión: Draft — requiere validación del equipo*