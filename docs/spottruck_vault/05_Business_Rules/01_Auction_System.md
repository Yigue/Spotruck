---
title: "Spottruck - Sistema de Subastas"
date: 2026-06-04
author: Jarvis Agent
status: draft
tags: [auction, business-rules, spottruck]
---

# Spottruck - Sistema de Subastas

## 1. Introducción y Propósito

Spottruck es una plataforma digital especializada en la gestión de transporte de carga vial en el mercado argentino. El sistema de subastas constituye el núcleo operativo de la plataforma, permitiendo que los cargas (dadores de carga) publiquen viajes y que los transportistas (fletistas) compitan mediante ofertas para adjudicarse el flete. Este documento detalla las reglas de negocio, el ciclo de vida de las subastas, los mecanismos de puja, los algoritmos de determinación de ganadores y las reglas anti-fraude que garantizan un mercado transparente y eficiente.

El sistema está diseñado para operar en un entorno de alta disponibilidad donde múltiples usuarios pueden realizar ofertas simultáneas sobre el mismo viaje, asegurando la integridad de las transacciones y la igualdad de oportunidades entre todos los participantes del mercado logístico.

---

## 2. Tipos de Subasta

Spottruck soporta tres modalidades de subasta, cada una adaptada a diferentes escenarios del mercado de transporte de carga. La selección del tipo de subasta se realiza al momento de la publicación del viaje, considerando factores como el valor de la carga, la urgencia de la operación y las preferencias del dador de carga.

### 2.1 Subasta Ascendente Abierta (English Auction)

Esta es la modalidad **predeterminada** y la más utilizada en la plataforma. El proceso funciona de la siguiente manera:

- El dador de carga publica un viaje con un precio base de salida (precio de reserva visible o sin reserva).
- Los transportistas presentan ofertas públicas que deben superar la oferta más alta actual en al menos el incremento mínimo establecido.
- Todos los participantes pueden ver el historial completo de ofertas en tiempo real.
- La subasta cierra en la fecha y hora programadas, o antes si nadie realiza una nueva oferta durante los últimos minutos de actividad.
- El postor con la oferta más alta al momento del cierre se adjudica el viaje.

Esta modalidad genera un ambiente competitivo que típicamente resultan en precios de mercado justos, beneficiando tanto al dador de carga (que obtiene un precio competitivo) como al transportista (que tiene visibilidad total del proceso competitivo).

### 2.2 Subasta Holandesa (Dutch Auction)

La **subasta holandesa** es una modalidad de precio descendente donde el dador de carga inicia con un precio alto y este disminuye automáticamente con el tiempo hasta que un transportista acepta el precio actual. Esta modalidad es especialmente útil para cargas perecederas o servicios de transporte con alta demanda estacional.

**Características principales:**

- El precio de salida comienza en un valor máximo definido por el dador de carga
- El precio desciende automáticamente según una curva de decremento predefinida (lineal, exponencial o por pasos)
- Los transportistas pueden aceptar el precio actual en cualquier momento, lo que cierra la subasta inmediatamente
- El primer transportista que acepta el precio gana la subasta al precio que estaba vigente en ese instante
- No existe la posibilidad de pujar después de que alguien acepta, ya que la venta se completa instantáneamente

**Curvas de decremento de precio:**

| Tipo | Fórmula | Uso recomendado |
|------|---------|-----------------|
| Lineal | `precio = precio_inicial - (decremento_por_minuto × minutos_transcurridos)` | Cargas con valor estable |
| Exponencial | `precio = precio_inicial × e^(-k×t)` | Cargas sensibles al tiempo |
| Por pasos | `precio = precio_inicial - (paso × floor(t/paso_duracion))` | Subastas con momentos clave |

**Configuración de la subasta holandesa:**

- **Precio inicial**: Debe ser mayor o igual al precio de reserva
- **Decremento**: Definido por el dador de carga en ARS/minuto
- **Frecuencia de actualización**: Cada 1, 5 o 15 minutos
- **Duración máxima**: Igual a las demás modalidades (12-168 horas según tipo de usuario)
- **Cancelación**: Permitida solo antes de que alguien acepte el precio

**Comportamiento del reloj:**

```
HORA 0:     $500.000 ARS (precio inicial)
HORA 10min: $495.000 ARS (si decremento = $500/minuto)
HORA 30min: $475.000 ARS
HORA 60min: $450.000 ARS
...
```

**Validación de aceptación:**

- Un transportista solo puede aceptar si no tiene actualmente una oferta activa en esta misma auction
- Una vez aceptada, la auction pasa directamente a SETTLED sin periodo de confirmación
- El transportista tiene 30 minutos para confirmar receipt pero la auction ya está asignada

### 2.3 Subasta a Puja Cerrada de Primer Precio (Sealed Bid)

En esta modalidad, las ofertas son **confidenciales** y no se revelan a los demás participantes hasta el momento del cierre:

- Cada transportista envía una única oferta sellada antes de la fecha límite.
- Las ofertas no son visibles para otros participantes durante el periodo de puja.
- Una vez cerrada la subasta, se revelan todas las ofertas simultáneamente.
- El postor con la oferta más alta gana, pero paga exactamente el monto que ofertó (primer precio).
- Si hay empate, el earliest-bidder wins (quien envió primero).

Esta modalidad es recomendada para **cargas de alto valor** (mercaderías peligrosas, equipos pesados, cargas especiales que requieren permisos específicos) donde el dador de carga prefiere evitar la escalada competitiva visible que podría inflar el precio final. También es útil cuando el dador de carga tiene un presupuesto fijo que no desea revelar al mercado.

### 2.3 Subasta Inversa (Reverse Auction)

En la subasta inversa, **el dador de carga publica el precio que está dispuesto a pagar** y los transportistas compiten para ofrecer el mejor servicio al menor precio:

- El dador de carga especifica su ruta, tipo de acoplado requerido, fecha de carga y un precio máximo de referencia (opcional).
- Los transportistas revelan sus ofertas indicando el precio por el cual están dispuestos a realizar el viaje.
- Los precios ofertados son públicos y visibles para fomentar la competencia a la baja.
- El transportista con la oferta más baja al cierre se adjudica el viaje.
- El precio de reserva (si existe) actúa como techo máximo que no puede superarse.

Esta modalidad es particularmente útil para cargas consolidadas (groupage) donde múltiples cargas comparten el mismo acoplado, o para rutas frecuentes donde existe una red de transportistas establecidos. El dador de carga mantiene el control del presupuesto mientras los transportistas optimizan sus costos operativos para resultar competitivos.

---

## 3. Máquina de Estados del Ciclo de Vida

Cada subasta en Spottruck transita por un conjunto definido de estados. La transición entre estados está gobernada por reglas de negocio específicas que garantizan la integridad y trazabilidad de cada operación.

### 3.1 Diagrama de Estados

```
                                    ┌──────────────────────────────────────────────────────┐
                                    │                                                      │
                                    ▼                                                      │
┌─────────┐    crear     ┌───────────┐    iniciar    ┌─────────┐    extender   ┌───────────┐
│  DRAFT  │ ───────────▶ │ SCHEDULED │ ────────────▶ │  ACTIVE │ ◀──────────── │  EXTENDED │
└─────────┘              └───────────┘               └────┬────┘               └───────────┘
     │                                                   │                           │
     │                                                   │                           │
     │                    ┌──────────────────────────────┴───────────────────────────┤
     │                    │                                                              │
     │                    ▼                                                              │
     │            ┌───────────┐    cerrar (sin bids)    ┌─────────┐    confirmar     ┌──────────┐
     │            │  ENDED    │ ◀────────────────────── │         │ ────────────────▶│          │
     │            └─────┬─────┘                        │         │    >30 min sin   │  FAILED  │
     │                  │                              │         │    confirm       │          │
     │                  │ cerrar (con bids)            └─────────┘                  └──────────┘
     │                  │                                   ▲
     │                  ▼                                   │
     │           ┌──────────┐    confirmar      ┌───────────┴───┐    cancelar    ┌───────────┐
     │           │          │ ────────────────▶ │    SETTLED    │                 │ CANCELLED │
     │           │  ENDED   │                   │               │                 └───────────┘
     │           │          │                   └───────────────┘
     │           └──────────┘                          ▲
     │                                                  │ timeout > 30min
     └──────────────────────────────────────────────────┘
```

### 3.2 Definición de Estados

| Estado | Descripción |
|--------|-------------|
| **DRAFT** | El viaje está siendo configurado por el dador de carga. Puede editarse, agregar o quitar días disponibles, modificar requisitos del acoplado. No visible para transportistas. |
| **SCHEDULED** | La subasta fue validada y programada. Los transportistas pueden visualizarla pero no pueden pujar hasta la fecha de inicio. |
| **ACTIVE** | La subasta está en periodo de puja. Los transportistas elegibles pueden presentar ofertas. El reloj corre. |
| **EXTENDED** | Estado transitorio. La subasta estaba por cerrar pero recibió una puja en los últimos 60 segundos. Se extendió automáticamente. |
| **ENDED** | El tiempo de la subasta expiró sin nuevas ofertas en los últimos 60 segundos. El sistema determina ganador si hay ofertas válidas. Comienza el periodo de confirmación de 30 minutos. |
| **SETTLED** | El ganador confirmó la aceptación del viaje. La subasta se considera exitosa. Se generan los documentos operativos (carta de porte, instrucciones). |
| **FAILED** | La subasta terminó sin ofertas válidas por encima del precio de reserva, o el ganador no confirmó dentro de los 30 minutos. |
| **CANCELLED** | El dador de carga canceló la subasta antes del cierre. Puede deberse a cambio de planes, carga ya no disponible, o error en la publicación. |

### 3.3 Transiciones y Triggers

| Transición | Trigger | Validación | Efecto |
|------------|---------|------------|--------|
| DRAFT → SCHEDULED | Dador de carga envía a revisión | Datos completos, al menos 1 día disponible, acoplado válido | Subasta bloqueada para edición, se programa en scheduler |
| SCHEDULED → ACTIVE | Fecha/hora de inicio alcanzada | Scheduler confirma | Se habilita la recepción de ofertas, se activa计时器 |
| ACTIVE → EXTENDED | Nueva oferta en los últimos 60s del tiempo restante | Oferta válida supera a la actual | Se añade 2 minutos al tiempo restante |
| ACTIVE → ENDED | Tiempo llega a cero sin extensiones pendientes | Ninguna oferta en últimos 60s | Se determina ganador (si hay), se inicia ventana de confirmación |
| EXTENDED → ACTIVE |计时器 llega a cero sin nueva oferta | Ninguna oferta en los últimos 60s | Estado vuelve a ACTIVE, próxima extensión se evaluará normalmente |
| ENDED → SETTLED | Ganador confirma dentro de los 30min | Confirmación explícita del ganador | Se generan documentos, se notifica al dador, se deduce comisión |
| ENDED → FAILED | 30 minutos transcurridos sin confirmación | Ganador no respondió o rechazó | Se libera la subasta, se notifica al dador de carga |
| ACTIVE/EXTENDED → CANCELLED | Dador de carga cancela | Cancelación debe ser antes de ENDED | Reembolso de ofertas activas, se penaliza al dador (rating) |
| SCHEDULED → CANCELLED | Dador de carga cancela | Cancelación antes del inicio | Sin penalización, se notifica a watchers |
| ACTIVE/EXTENDED → FAILED | Reserva no alcanzada y sin bids válidos | Ofertas no superan reserva | Se marca como fallida, se notifica al dador |

---

## 4. Reglas de Puja

### 4.1 Incremento Mínimo de Oferta

Para mantener la progresión natural de las ofertas y evitar微型 pujas que dilatan el proceso sin beneficio real, Spottruck establece un **incremento mínimo** que debe superarse en cada nueva oferta:

```
incremento_minimo = max(5% de la oferta actual, $5.000 ARS)
```

| Oferta Actual | Incremento Mínimo (5%) | Incremento Mínimo Absoluto | Valor a Usar |
|---------------|------------------------|----------------------------|--------------|
| $100.000 ARS | $5.000 ARS | $5.000 ARS | $5.000 ARS |
| $250.000 ARS | $12.500 ARS | $5.000 ARS | $12.500 ARS |
| $500.000 ARS | $25.000 ARS | $5.000 ARS | $25.000 ARS |
| $1.200.000 ARS | $60.000 ARS | $5.000 ARS | $60.000 ARS |

**Ejemplo práctico**: Si un transportista ofrece $300.000 ARS por un viaje, la siguiente oferta mínima debe ser de $315.000 ARS ($300.000 + 5% = $315.000, que supera el piso absoluto de $5.000).

### 4.2 Extensión de Tiempo (Time Extension)

Spottruck implementa un mecanismo de extensión automática para proteger a los participantes del bid sniping y garantizar un proceso competitivo justo. Este sistema aplica únicamente a subastas de tipo English (ascendente abierto).

**Regla de extensión:**

- Si se recibe una oferta válida dentro de los **últimos 60 segundos** del tiempo restante de la subasta, esta se extiende automáticamente por **2 minutos adicionales**.
- La extensión se aplica sobre el tiempo restante, no sobre el tiempo absoluto.
- Múltiples extensiones en los últimos segundos son posibles, creando un efecto de "countdown activo".
- El máximo de extensiones permitidas es **5** para evitar subastas que se extienden indefinidamente.
- Si se alcanza el límite de 5 extensiones, la sexta oferta en los últimos 60s es **rechazada** con mensaje "Límite de extensiones alcanzado. La auction cerrará en el tiempo restante."

**Consideraciones adicionales:**

- Las extensiones no aplican a subastas holandesas (el precio baja gradualmente, no hay tiempo fijo de cierre en el mismo sentido)
- Las extensiones no aplican a subastas selladas (todas las ofertas se revelan al mismo tiempo)
- El sistema registra cada extensión con timestamp para auditoría

**Ejemplo de escenario con extensiones:**

```
Auction inicia: 10:00:00, duración = 60 minutos, cierra a las 11:00:00

10:59:05 - Transportista A oferta $100.000 (quedan 55 segundos < 60s)
            → SE EXTIENDE hasta 11:02:00 (+2 minutos)

11:01:30 - Transportista B oferta $105.000 (quedan 90 segundos > 60s)
            → NO SE EXTIENDE, sigue hasta 11:02:00

11:02:00 - Auction cierra, ganador: Transportista B con $105.000
```

### 4.3 Sistema de Pujas Proxy (Automatic Bidding)

Spottruck implementa un sistema de **proxy bidding** que permite a los transportistas establecer una oferta máxima y un incremento automático. El sistema actúa como agente del postor, incrementando la oferta de forma automática solo lo necesario para mantenerlo como mejor postor.

**Comportamiento del proxy bidding**:

1. El postor indica su oferta máxima (max_bid) y opcionalmente el incremento preferido.
2. El sistema registra la oferta actual como max_bid - incremento_increment.
3. Cada vez que otro postor ofrece más, el sistema automáticamente oferta increment + $1 hasta alcanzar el max_bid.
4. Si otro postor supera el max_bid, el postor original es notificado y puede decidir aumentar su máximo.
5. Las ofertas se registran en el historial con la marca "proxy: true" cuando fueron generadas automáticamente.

```
Pseudocódigo - Proxy Bidding:

función procesar_oferta(oferta, postor):
    auction = obtener_subasta(oferta.auction_id)
    max_bid = oferta.monto
    
    si postor.tiene_proxy_activo(auction.id):
        max_bid_existente = postor.obtener_proxy_max(auction.id)
        max_bid = max(max_bid, max_bid_existente)
    
    oferta_actual = auction.obtener_oferta_mas_alta()
    incremento = calcular_incremento(oferta_actual.monto)
    
    si max_bid <= oferta_actual.monto:
        rechazar("Su máxima oferta no supera la oferta actual")
        return
    
    monto_a_registrar = min(
        max_bid,
        oferta_actual.monto + incremento
    )
    
    si monto_a_registrar >= max_bid:
        # Se alcanzó el máximo del postor
        nueva_oferta = crear_oferta(monto=max_bid, postor, proxy=true)
        notificar(postor, "Ha alcanzado su oferta máxima")
    sino:
        nueva_oferta = crear_oferta(monto=monto_a_registrar, postor, proxy=true)
    
    auction.registrar_oferta(nueva_oferta)
    notificar_otros_postores(auction, postor, nueva_oferta)
```

### 4.4 Duración Máxima de la Subasta

Por defecto, las subastas tienen una duración máxima de **72 horas** (3 días). Este параметр puede ser configurado por el dador de carga dentro de los siguientes límites:

| Tipo de Usuario | Duración Mínima | Duración Máxima | Default |
|-----------------|-----------------|-----------------|---------|
| Dador de carga nuevo (<5 viajes) | 24 horas | 72 horas | 48 horas |
| Dador de carga regular (5-50 viajes) | 12 horas | 120 horas (5 días) | 72 horas |
| Dador de carga premium (>50 viajes) | 6 horas | 168 horas (7 días) | 72 horas |

### 4.5 Precio de Reserva (Reserve Price)

El precio de reserva es un mecanismo que permite al dador de carga establecer un precio mínimo secreto para aceptar ofertas. Este precio **no es visible** para los transportistas, pero el sistema internamente valida que las ofertas lo superen.

**Comportamiento**:
- Si la oferta más alta al cierre es **menor** al precio de reserva, la auction se marca como **FAILED**.
- Si no hay precio de reserva (reserve_price = null), cualquier oferta válida cierra la auction.
- El precio de reserva puede establecerse en DRAFT o SCHEDULED, pero **no puede modificarse** una vez que la auction pasa a ACTIVE.
- El sistema **no revela** si el precio de reserva fue alcanzado o no durante la puja.

### 4.6 Validación de Ofertas y Reglas Anti-Fraude

El sistema de validación de ofertas es fundamental para mantener la integridad del mercado de subastas. Cada oferta que ingresa al sistema pasa por un proceso de verificación exhaustivo antes de ser aceptada o rechazada.

#### 4.6.1 Validaciones de Format

| Validación | Regla | Respuesta al Fallo |
|------------|-------|-------------------|
| **Monto numérico** | Debe ser número positivo > 0 | Rechazo: "El monto debe ser un número positivo" |
| **Formato monetario** | Sin decimales多余的, máximo 2 decimales | Rechazo: "El monto debe tener como máximo 2 decimales" |
| **Rango válido** | Entre $1.000 ARS y $50.000.000 ARS | Rechazo: "El monto está fuera del rango permitido" |
| **Incremento mínimo** | Debe superar oferta actual + incremento | Rechazo: "La oferta debe superar la oferta actual en al menos $X" |

#### 4.6.2 Validaciones de Negocio

| Validación | Regla | Respuesta al Fallo |
|------------|-------|-------------------|
| **Usuario registrado** | El postor debe tener cuenta verificada en Spottruck | Rechazo: "Usuario no encontrado" |
| **Transportista habilitado** | Debe tener статус ACTIVE y no estar suspendido | Rechazo: "Tu cuenta no está habilitada para pujar" |
| **Vehículo compatible** | Debe tener al menos un vehículo que cumpla los requisitos del viaje | Rechazo: "No tienes vehículos compatibles con esta auction" |
| **Cupo disponible** | No debe haber alcanzado su límite de subastas activas | Rechazo: "Has alcanzado el límite de subastas activas" |
| **No es el mismo usuario** | No puede pujar en su propia publicación | Rechazo: "No puedes pujar en tu propia publicación" |
| **No es赢家 actual** | El ganador actual no puede superarse a sí mismo | Rechazo: "Ya eres el ganador actual de esta auction" |
| **Timing de auction** | La auction debe estar en estado ACTIVE | Rechazo: "La auction no está abierta para ofertas" |

#### 4.6.3 Reglas Anti-Fraude

Spottruck implementa múltiples capas de protección contra prácticas fraudulentas:

**Detección de collusión entre postores:**

```python
def detectar_colusion(auction_id):
    """
    Analiza patrones de ofertas para detectar posibles cartels o acuerdos
    entre postores que manipulan el precio de la auction.
    """
    offers = obtener_ofertas(auction_id)
    
    # 检测时间相关性: ofertas muy cercanas en tiempo de diferentes usuarios
    tiempo_correlacion = analizar_correlacion_temporal(offers)
    
    # 检测 patrones de oferta: mesma proporción de incremento
    patrones = detectar_patrones_incremento(offers)
    
    # 检测 relaciones entre usuarios: misma empresa o IP
    relaciones_sospechosas = verificar_relaciones(offers)
    
    if tiempo_correlacion > UMBRAL_COLUSION or \
       patrones > UMBRAL_PATRON or \
       relaciones_sospechosas:
        notificar_a_admin(auction_id, "POSIBLE_COLUSION")
        return True
    
    return False
```

**Detección de auto-puja (shill bidding):**

```python
def detectar_shill_bidding(user_id, auction_id):
    """
    Detecta si un usuario está pujando para inflar artificialmente el precio.
    """
    user_offers = obtener_ofertas_usuario(user_id, auction_id)
    
    if len(user_offers) >= 3:
        # Verificar si el usuario es el dador de carga
        auction = obtener_subasta(auction_id)
        if user_id == auction.owner_id:
            generar_alerta("SHILL_BIDDING", user_id, auction_id)
            return True
    
    return False
```

**Límites de actividad por usuario:**

| Métrica | Límite | Periodo |
|---------|--------|---------|
| Ofertas por usuario | 20 | Por auction |
| Ofertas totales | 100 | Por dia, por usuario |
| Subastas ganadas | 5 | Por mes, por usuario |
| Cancelaciones de oferta | 3 | Por mes, por usuario |

**Validación de identidad y reputación:**

- Solo usuarios con Elo rating superior a 1000 pueden participar en auctions de alto valor (>$1.000.000 ARS)
- Usuarios nuevos (<5 viajes completados) tienen un límite de oferta máximo de $200.000 ARS por auction
- El Trust Score debe ser mayor a 40 para poder pujar en subastas con precio de reserva

---

## 5. Algoritmo de Auto-Extensión

El algoritmo de auto-extensión es crítico para mantener la equidad del sistema. A continuación se presenta el pseudocódigo completo del mecanismo de extensión:

```
CONSTANTES:
    ULTIMOS_SEGUNDOS_ANTI_SNIPE = 60
    TIEMPO_EXTENSION = 120  # 2 minutos en segundos
    MAXIMO_EXTENSIONES = 5

VARIABLES POR SUBasta:
    end_time              # Tiempo Unix de fin
    extension_count       # Contador de extensiones aplicadas
    last_extension_time   # Timestamp de última extensión

FUNCIÓN verificar_extension(subasta_id, oferta_recibida):
    auction = obtener_subasta(subasta_id)
    ahora = tiempo_actual()
    tiempo_restante = auction.end_time - ahora
    
    SI auction.estado != ACTIVE:
        RECHAZAR("La auction no está activa")
        DEVOLVER resultado_rechazo
    
    SI oferta_recibida.monto <= auction.obtener_oferta_mas_alta().monto:
        RECHAZAR("La oferta debe superar a la actual")
        DEVOLVER resultado_rechazo
    
    SI tiempo_restante <= ULTIMOS_SEGUNDOS_ANTI_SNIPE:
        SI auction.extension_count >= MAXIMO_EXTENSIONES:
            # Se alcanzó el límite, se rechaza la oferta que triggeraría extensión
            # pero la auction sigue activa y puede cerrar normalmente
            RECHAZAR("Extensión máxima alcanzada. La oferta no puede ser procesada.")
            DEVOLVER resultado_rechazo
        
        # Aplicar extensión
        auction.end_time = ahora + TIEMPO_EXTENSION
        auction.extension_count += 1
        auction.last_extension_time = ahora
        auction.estado = EXTENDED
        
        # Programar evento para volver a ACTIVE cuando termine la extensión
        programar_evento(
            tipo = 'EXTENSION_END',
            auction_id = auction_id,
            ejecutar_en = ahora + TIEMPO_EXTENSION
        )
        
        REGISTRAR_LOG(
            "Extensión aplicada",
            auction_id=auction_id,
            nueva_fecha_cierre=auction.end_time,
            extension_count=auction.extension_count,
            oferta_trigger=oferta_recibida.monto
        )
    
    SI auction.estado == EXTENDED:
        auction.estado = ACTIVE  # Vuelve a activo normal
    
    DEVOLVER procesar_oferta_normal(oferta_recibida)


EVENTO EXTENSION_END(auction_id):
    auction = obtener_subasta(auction_id)
    ahora = tiempo_actual()
    
    SI auction.estado == EXTENDED:
        SI auction.obtener_oferta_mas_alta().monto > 0:
            # Hay ofertas vigentes, se extiende normalmente
            auction.estado = ACTIVE
        SINO:
            # Sin ofertas, se cierra la auction
            auction.estado = ENDED
            ejecutar_cierre(auction_id)
```

---

## 6. Determinación del Ganador

Al momento del cierre de la auction, el sistema ejecuta el algoritmo de determinación de ganador. Este proceso es atómico y no puede ser interrumpido.

```
FUNCIÓN determinar_ganador(auction_id):
    auction = obtener_subasta(auction_id)
    ofertas = auction.obtener_todas_ofertas_ordenadas()  # Por timestamp ascendente
    
    SI ofertas.esta_vacia():
        REGISTRAR("Auction sin ofertas")
        auction.estado = FAILED
        auction.ganador_id = null
        auction.precio_final = null
        DEVOLVER resultado_fallido
    
    oferta_mas_alta = ofertas.ultimo()  # La de mayor monto
    
    SI auction.tiene_reserva() AND oferta_mas_alta.monto < auction.reserve_price:
        REGISTRAR("Oferta más alta no alcanza reserva",
                  oferta=oferta_mas_alta.monto,
                  reserva=auction.reserve_price)
        auction.estado = FAILED
        auction.ganador_id = null
        auction.precio_final = null
        notificar_dador(auction, "Reserva no alcanzada")
        DEVOLVER resultado_fallido
    
    # Manejo de empate: earliest bid wins
    ofertas_maximas = ofertas.filtrar(monto = oferta_mas_alta.monto)
    SI ofertas_maximas.cantidad > 1:
        # Tomar la más temprana
        winner_offer = ofertas_maximas.primero()
        REGISTRAR("Empate resuelto por tiempo",
                  oferta_ganadora=winner_offer.id,
                  postor=winner_offer.postor_id,
                  monto=winner_offer.monto)
    SINO:
        winner_offer = oferta_mas_alta
    
    auction.estado = ENDED
    auction.ganador_id = winner_offer.postor_id
    auction.precio_final = winner_offer.monto
    auction.confirm_deadline = tiempo_actual() + 1800  # 30 minutos
    
    # Notificaciones
    notificar_ganador(auction, winner_offer)
    notificar_perdedores(auction, ofertas)
    notificar_dador(auction, "Auction cerrada. Ganador confirmado.")
    
    # Programar timeout de confirmación
    programar_evento(
        tipo = 'CONFIRMATION_TIMEOUT',
        auction_id = auction_id,
        ejecutar_en = auction.confirm_deadline
    )
    
    DEVOLVER resultado_exitoso(winner_offer)


EVENTO CONFIRMATION_TIMEOUT(auction_id):
    auction = obtener_subasta(auction_id)
    
    SI auction.estado == ENDED:  # No fue confirmada a tiempo
        auction.estado = FAILED
        notificar_ganador(auction, "No confirmó a tiempo. Auction cancelada.")
        notificar_dador(auction, "Ganador no confirmó. Auction fallida.")
        DEVOLVER resultado_fallido
    
    SI auction.estado == SETTLED:
        DEVOLVER  # Ya fue confirmada, no hacer nada
```

### 6.1 Ventana de Confirmación del Ganador

Una vez determinado el ganador, este dispone de **30 minutos** para confirmar la aceptación del viaje. Durante este periodo:

- El ganador puede confirmar (acepta) o rechazar (no puede realizar el viaje).
- Si confirma, la auction pasa a SETTLED y se generan los documentos operativos.
- Si rechaza o no responde en 30 minutos, la auction se marca como FAILED.
- Si la auction falla por falta de confirmación, **no se cobra comisión** al dador de carga.
- El ganador que no confirma sin motivo válido recibe una penalización en su score de reputación.

---

## 7. Reglas Anti-Fraude

### 7.1 Detección de Pujas Colusorias (Shill Bidding)

El shill bidding ocurre cuando un postorfake (o el mismo dador de carga bajo una identidad alternativa) realiza ofertas artificiales para inflar el precio de la auction. Spottruck implementa los siguientes controles:

**Identificación por IP y Dispositivo**:
```
FUNCIÓN validar_oferta_fraude(oferta, auction):
    postor = oferta.postor
    dador = auction.dador_carga
    
    # Misma persona no puede pujar en su propia auction
    SI postor.id == dador.id:
        BLOQUEAR("No puede pujar en su propia auction")
        DEVOLVER rechazo_por_fraude
    
    # Verificar同一 IP en últimas 24 horas
    ips_recientes = obtener_ips_postor(postor.id, ultimas_24h)
    SI auction.creado_por.mismo_ip(ips_recientes):
        REGISTRAR_ALERTA("Misma IP: dador y postor")
        # No se bloquea automáticamente, se marca para revisión manual
    
    # Verificar同一 dispositivo
    dispositivos = obtener_dispositivos_postor(postor.id)
    SI auction.creado_por.mismo_dispositivo(dispositivos):
        REGISTRAR_ALERTA("Mismo dispositivo: dador y postor")
        # Se marca para revisión
    
    # Bloqueo directo: misma IP + mismo dispositivo en auction activa
    SI postor.misma_ip_y_dispositivo(auction.dador_carga, oferta.timestamp):
        BLOQUEAR_Y_RECHAZAR("Fraude detectado: conexión compartida")
        notificar_auditoria("Shill bidding inminente", postor_id=postor.id, auction_id=auction.id)
        DEVOLVER rechazo_por_fraude
    
    DEVOLVER oferta_valida
```

**Penalizaciones por shill bidding confirmado**:
- Primer incidente: advertencia formal + suspensión de puja por 7 días.
- Segundo incidente: suspensión de puja por 30 días + reducción de rating.
- Tercer incidente: ban permanente de la plataforma.

### 7.2 Enfriamiento por Retiro de Oferta (Bid Withdrawal Cooldown)

Para desincentivar el retiro estratégico de ofertas, Spottruck implementa una regla de enfriamiento:

**Regla**: Si un postor retira una oferta de una auction, **no podrá volver a pujar en esa misma auction durante las próximas 24 horas**.

```
FUNCIÓN retirar_oferta(oferta_id):
    oferta = obtener_oferta(oferta_id)
    auction = oferta.auction
    
    SI oferta.ya_aceptada:
        RECHAZAR("No puede retirar una oferta que fue aceptada")
    
    SI NOT oferta.puede_retirarse:
        RECHAZAR("El periodo de retiro ha expirado")
    
    # Verificar si es la oferta más alta
    SI oferta == auction.obtener_oferta_mas_alta():
        auction.estado = ACTIVE  # Reabrir la auction
        auction.end_time = tiempo_actual() + 300  # +5 minutos
    
    # Registrar el retiro
    oferta.retirada_en = tiempo_actual()
    oferta.retirada = true
    
    # Bloquear al postor para esta auction
    crear_restriccion(
        postor_id = oferta.postor_id,
        auction_id = auction.id,
        tipo = RETIRO_COOLDOWN,
        expira_en = tiempo_actual() + 86400  # 24 horas
    )
    
    notificar_dador(auction, f"Oferta retirada por {oferta.postor.nombre}")
    REGISTRAR_LOG("Oferta retirada", oferta_id=oferta_id, postor=oferta.postor_id)
```

### 7.3 Requisito de Reputación para Pujar

Para evitar cuentas frescas o con mal historial que perturben las auctions, Spottruck establece un门槛 de reputación mínimo para poder participar como postor:

**Requisito mínimo**: El postor debe tener **al menos 50 viajes completados** con评价 igual o superior a 4.0 estrellas para poder pujar en una auction.

```
FUNCIÓN verificar_elegibilidad_postor(postor_id, auction_id):
    postor = obtener_postor(postor_id)
    auction = obtener_subasta(auction_id)
    
    # Verificar viajes completados
    viajes_completados = postor.obtener_contador_viajes_completados()
    SI viajes_completados < 50:
        DEVOLVER rechazo("Necesitas al menos 50 viajes completados para pujar")
    
    # Verificar rating
    rating_promedio = postor.obtener_rating_promedio()
    SI rating_promedio < 4.0:
        DEVOLVER rechazo("Tu rating debe ser igual o superior a 4.0 estrellas")
    
    # Verificar cooldown por retiro
    SI postor.tiene_restriccion_activa(auction.id, RETIRO_COOLDOWN):
        expira = postor.obtener_restriccion_expiracion(auction.id, RETIRO_COOLDOWN)
        DEVOLVER rechazo("No puedes pujar por haber retirado una oferta. Restricción expira en {expira}")
    
    # Verificar suspensión
    SI postor.esta_suspendido():
        DEVOLVER rechazo("Tu cuenta está suspendida. Contacta a soporte.")
    
    DEVOLVER elegible
```

---

## 8. Motor de Precios

El motor de precios de Spottruck proporciona información de mercado en tiempo real para ayudar a los participantes a tomar decisiones informadas sobre sus ofertas y precios de reserva.

### 8.1 Cálculo de Precio en Tiempo Real

Por cada auction activa, el sistema calcula y muestra:

```
FUNCIÓN calcular_precio_sugerido(auction):
    # Factores de ponderación
    ponderacion_distancia = 0.35
    ponderacion_tipo_carga = 0.25
    ponderacion_fecha = 0.20
    ponderacion_historial = 0.20
    
    # Precio base por km
    precio_base_km = obtener_precio_base_region(auction.origen, auction.destino)
    
    # Ajuste por distancia total
    distancia = calcular_distancia(auction.origen, auction.destino)
    precio_distancia = distancia * precio_base_km
    
    # Ajuste por tipo de acoplado y carga
    factor_acoplado = obtener_factor_acoplado(auction.tipo_acoplado)
    factor_carga = obtener_factor_carga(auction.tipo_carga)
    precio_ajustado = precio_distancia * factor_acoplado * factor_carga
    
    # Ajuste por fecha (demanda)
    factor_demanda = calcular_factor_demanda(auction.fecha_carga, auction.origen, auction.destino)
    
    # Histórico de auctions similares (últimos 90 días)
    auctions_similares = buscar_similares(
        origen=auction.origen,
        destino=auction.destino,
        tipo_acoplado=auction.tipo_acoplado,
        dias_desde=90
    )
    
    precio_historico = auctions_similares.obtener_precio_promedio()
    
    # Cálculo final ponderado
    precio_sugerido = (
        precio_ajustado * ponderacion_distancia +
        precio_ajustado * factor_demanda * ponderacion_fecha +
        precio_historico * ponderacion_historial
    )
    
    DEVOLVER {
        "precio_sugerido": precio_sugerido,
        "rango_minimo": precio_sugerido * 0.85,
        "rango_maximo": precio_sugerido * 1.20,
        "confianza": calcular_confianza(auctions_similares.cantidad),
        "precio_promedio_historico": precio_historico
    }
```

### 8.2 Sugerencias de Mercado

El sistema genera recomendaciones contextuales basadas en datos agregados:

| Indicador | Descripción | Umbral de Confianza |
|-----------|-------------|---------------------|
| **Precio competitivo** | La oferta actual está dentro del rango esperado | >70% del promedio histórico |
| **Oferta agresiva** | La oferta actual está significativamente por debajo del mercado | <60% del promedio histórico |
| **Oferta premium** | La oferta está en el cuartil superior de precios | >110% del promedio histórico |
| **Demanda alta** | La fecha de carga tiene alta demanda | >80% de ocupación de trucks en la ruta |
| **Demanda baja** | La fecha de carga tiene baja demanda | <30% de ocupación de trucks en la ruta |

### 8.3 Historial de Precios por Ruta

Spottruck mantiene un índice de precios históricos por ruta actualizado en tiempo real:

```
TIPO INDICE_PRECIOS:
    ruta: string  # "BUENOS_AIRES-CORDOBA"
    tipo_acoplado: enum
    precio_promedio_30d: decimal
    precio_promedio_90d: decimal
    cantidad_auctions_30d: int
    tendencia: enum  # SUBIENDO, BAJANDO, ESTABLE
    ultimo_actualizado: timestamp

FUNCIÓN actualizar_indice_precios(ruta, tipo_acoplado):
    # Se ejecuta después de cada auction SETTLED
    auctions_30d = buscar_auctions(ruta, tipo_acoplado, dias=30, estado=SETTLED)
    auctions_90d = buscar_auctions(ruta, tipo_acoplado, dias=90, estado=SETTLED)
    
    precio_30d = auctions_30d.calcular_precio_promedio()
    precio_90d = auctions_90d.calcular_precio_promedio()
    
    tendencia = calcular_tendencia(auctions_30d, auctions_90d)
    
    guardar_indice(INDILE_PRECIOS(
        ruta=ruta,
        tipo_acoplado=tipo_acoplado,
        precio_promedio_30d=precio_30d,
        precio_promedio_90d=precio_90d,
        tendencia=tendencia,
        ultimo_actualizado=ahora()
    ))
```

---

## 9. Especificaciones Técnicas del Sistema

### 9.1 Requisitos de Concurrencia

El sistema debe soportar las siguientes métricas de carga:

| Métrica | Valor |
|---------|-------|
| Pujas por segundo (pico) | 500 |
| Subastas activas simultáneas | 10,000 |
| Ofertas por auction (promedio) | 25 |
| Ofertas por auction (p99) | 200 |
| Tiempo de respuesta puja | <200ms |
| Extinciones por hora (pico) | 1,000 |

### 9.2 Consistencia y Concurrencia

Para garantizar la integridad de las ofertas en un entorno de alta concurrencia, el sistema utiliza:

- **Optimistic Locking**: Cada oferta tiene un version field que se incrementa en cada update. Si dos ofertas llegan simultáneamente, la segunda es rechazada y debe reintentarse.
- **Saga Pattern**: La determinación de ganador se ejecuta como una saga de 3 pasos: lock ofertas → calcular winner → actualizar estado.
- **Event Sourcing**: Todas las transiciones de estado se almacenan como eventos inmutables para permitir replay y auditoría.

---

## 10. Glosario de Términos

| Término | Definición |
|---------|-----------|
| **Auction** | Subasta del sistema Spottruck para un viaje específico. |
| **Bid** | Oferta realizada por un transportista en una auction. |
| **Dador de Carga** | Empresa o persona que necesita transportar mercadería. |
| **Transportista** | Empresa o chofer independiente que posee vehículos de carga. |
| **Proxy Bid** | Oferta automática configurada por el postor con un máximo secreto. |
| **Reserve Price** | Precio mínimo secreto que el dador está dispuesto a aceptar. |
| **Snipe** | Práctica de pujar en el último segundo para evitar competencia. |
| **Shill Bidding** | Ofertas ficticias para inflar el precio de una auction. |
| **Acoplado** | Remolque o semi-remolque utilizado para transportar carga. |
| **Flete** | Precio del servicio de transporte de carga. |
| **Carga** | Mercadería a transportar. |
| **Groupage** | Consolidación de cargas pequeñas de múltiples dadores en un mismo acoplado. |

---

## 11. Reglas de Comisión y Liquidación

| Concepto | Tarifa |
|----------|--------|
| Comisión Spottruck sobre auction cerrada exitosamente | 8% del valor del flete |
| Comisión Spottruck en auction fallida (reserva no alcanzada) | Sin cargo |
| Comisión Spottruck en auction cancelada por dador | 2% del valor de reserva (si existe) |
| Costo de retry en oferta rechazada por concurrencia | Sin cargo (hasta 3 intentos) |

---

*Documento creado para Spottruck - Plataforma de Transporte de Carga*
*Versión: 1.0 (draft)*
*Última actualización: 2026-06-04*
