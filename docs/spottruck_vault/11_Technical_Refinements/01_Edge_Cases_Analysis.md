---
title: "01 - Análisis de Casos Límite (Edge Cases)"
date: 2026-06-04
tags:
  - spottruck
  - edge-cases
  - failure-modes
  - architecture
area: proyectos
project: spottruck
stage: 11_technical_refinements
---

# Análisis de Casos Límite y Modos de Fallo

## 1. Subasta (Auction)

### 1.1 Un Solo Postor

| Aspecto | Descripción |
|---------|-------------|
| **Condición** | Solo un usuario puja por el artículo |
| **Comportamiento esperado** | La subasta termina normalmente; el postor único gana |
| **Fallo potencial** | Resolver si el precio de reserva no se alcanzó con un solo postor |
| **Estrategia** | Validar `reserve_price` vs `highest_bid`; si no se cumple, marcar como "subasta fallida" |

```yaml
AuctionEnd:
  single_bidder:
    outcome: RESERVE_NOT_MET | WIN_WITH_RESERVE
    notification: EMAIL_SENT
```

### 1.2 Fallo en la Conexión del Postor

| Aspecto | Descripción |
|---------|-------------|
| **Condición** | Pérdida de conexión durante puja activa |
| **Riesgo** | Puja no registrada, participación perdida |
| **Mitigación** | Optimistic locking + heartbeat cada 5s |
| **Recuperación** | Cliente re-conecta → verificar último estado en servidor → resincronizar |

### 1.3 Tiempo de Vencimiento

| Aspecto | Descripción |
|---------|-------------|
| **Condición** | Servidor y cliente con desfase de reloj |
| **Riesgo** | Disputa sobre puja exactamente en el deadline |
| **Mitigación** | Servidor como fuente única de verdad (NTP sync); gracia de 2s en servidor |
| **Edge case** | `"last second bid"` → aceptar si timestamp servidor < deadline + gracia |

---

## 2. Pago (Payment)

### 2.1 Doble Cobro (Double Charge)

| Aspecto | Descripción |
|---------|-------------|
| **Causa** | Retry por timeout del cliente; idempotency key no aplicada |
| **Impacto** | Cargo duplicado al comprador |
| **Prevención** | `idempotency_key = hash(user_id + auction_id + timestamp)` |
| **Flujo** | 1) Verificar clave existente → return cached result; 2) Lock optimista en BD |

```python
# Pseudocódigo
def process_payment(order_id, idempotency_key):
    existing = db.payments.find_one(idempotency_key=idempotency_key)
    if existing:
        return existing.result
    with db.transaction():
        payment = create_payment(order_id, idempotency_key)
        charge_provider(payment)
    return payment
```

### 2.2 Reembolso Parcial

| Aspecto | Descripción |
|---------|-------------|
| **Condición** | Cancelación después de envío de artículo |
| **Riesgo** | Cantidad incorrecta devuelta |
| **Estrategia** | Calcular prorata según estado: `refund = total * (days_remaining / total_days)` |

### 2.3 Provider de Pago Caído

| Aspecto | Descripción |
|---------|-------------|
| **Causa** | Stripe/PayPal fuera de servicio |
| **Mitigación** | Circuit breaker (ver sección 5); cola de reintentos con exponential backoff |
| **UI** | Mostrar mensaje: "Pago en proceso — se confirmará en minutos" |

---

## 3. GPS

### 3.1 Pérdida de Señal

| Aspecto | Descripción |
|---------|-------------|
| **Condición** | Truck en túnel, zona rural, interferencia |
| **Síntoma** | `location_updates` cesan |
| **Timeout** | 60s sin update → marcar como `GPS_SIGNAL_LOST` |
| **Recuperación** | Re-conexión → último known location + buffer de trayectoria |

```yaml
GPSState:
  ACTIVE:
    max_gap: 30s
  DEGRADED:
    max_gap: 120s
    accuracy: LOW
  LOST:
    since: timestamp
    last_known:
      lat: float
      lon: float
      accuracy: meters
```

### 3.2 Drift de GPS

| Aspecto | Descripción |
|---------|-------------|
| **Condición** | Señal multiplicada por obstáculos |
| **Riesgo** | Ubicación ficticia lejos de ruta |
| **Mitigación** | Filtro de Kalman; validar contra polilyne de ruta esperada |

---

## 4. Concurrencia

### 4.1 Condiciones de Carrera (Race Conditions)

| Escenario | Riesgo | Estrategia |
|-----------|--------|------------|
| Dos pujas simultáneas | Segunda puja sobrescribe primera | Compare-and-swap (CAS) en `current_price` |
| Fin de Auction + nueva puja | puja post-deadline aceptada | Verificar `server_time` en transacción atómica |
| Pago doble concurrent | Doble cargo | Idempotency key + distributed lock |

### 4.2 Distributed Lock

```python
# Ejemplo con Redis
def atomic_bid(auction_id, user_id, amount):
    lock = redis.lock(f"bid:{auction_id}", timeout=10)
    if not lock.acquire(blocking=False):
        raise ConcurrentModificationError()
    try:
        current = db.auctions.find_one(id=auction_id)
        if amount > current.highest_bid:
            db.auctions.update(id=auction_id, highest_bid=amount, highest_bidder=user_id)
    finally:
        lock.release()
```

---

## 5. Circuit Breaker

| Aspecto | Descripción |
|---------|-------------|
| **Objetivo** | Evitar cascada de fallos en servicios dependientes |
| **Estados** | CLOSED → OPEN → HALF_OPEN |

```yaml
CircuitBreaker:
  payment_provider:
    failure_threshold: 5
    timeout: 30s
    half_open_max_calls: 3
  gps_service:
    failure_threshold: 3
    timeout: 15s
    half_open_max_calls: 2
```

| Estado | Comportamiento |
|--------|----------------|
| **CLOSED** | Operación normal; contador de errores incrementa |
| **OPEN** | Llamadas fallan inmediatamente → fallback response |
| **HALF_OPEN** | Prueba conlimited de llamadas; si éxito → CLOSED |

---

## 6. Bulkhead (Contención)

| Aspecto | Descripción |
|---------|-------------|
| **Objetivo** | Aislar fallos para que no consuman todos los recursos |

```yaml
Bulkhead:
  payment_thread_pool:
    max_threads: 10
    queue_size: 20
  notification_service:
    max_threads: 5
    queue_size: 50
```

| Técnica | Aplicación |
|---------|------------|
| **Semáforo** | Limitar concurrent calls a servicio externo |
| **Thread pool** | Recursos de pago隔离 del resto |
| **Cola dedicada** | Cola de notificaciones separada de procesamiento principal |

---

## 7. Resumen de Matriz de Fallos

| Servicio | Fallo | Impacto | Mitigación |
|----------|-------|---------|------------|
| Auction | Un solo postor | Menor precio | Validar reserva |
| Auction | Deadlock de pujas | Bloqueo | CAS + lock |
| Payment | Double charge | Finanzas | Idempotency key |
| Payment | Provider caído | Transacción perdida | Circuit breaker |
| GPS | Signal loss | Tracking detenido | Buffer + reconnection |
| GPS | Drift | Ubicación incorrecta | Filtro de Kalman |
| Concurrency | Race condition | Datos corruptos | Transaction isolation |
| Global | Cascada | Sistema down | Bulkhead + circuit breaker |

---

## Referencias

- [Circuit Breaker Pattern - Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Bulkhead - Microsoft Azure](https://docs.microsoft.com/en-us/azure/architecture/patterns/bulkhead)
- [Stripe Idempotency](https://stripe.com/docs/idempotency)