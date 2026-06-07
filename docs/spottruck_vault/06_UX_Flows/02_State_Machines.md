---
title: "Spottruck — Máquinas de Estado"
date: "2026-06-04"
author: "Hermes Agent"
status: "active"
tags: ["spottruck", "state-machines", "ux-flows", "architecture"]
---

# Spottruck — Máquinas de Estado

## Introducción

Este documento establece la especificación completa de todas las máquinas de estado que rigen la lógica de negocio de Spottruck, la plataforma logística de carga terrestre para el mercado argentino. Cada máquina de estado representa el ciclo de vida de una entidad del dominio, definiendo sus estados válidos, las transiciones permitidas, las condiciones (guards) que habilitan cada transición, las acciones collateral que se ejecutan, y los eventos de integración que propagan cambios a otras máquinas.

La arquitectura de state machines de Spottruck sigue el patrón de **event-sourcing** con un log de auditoría inmutable. Cada transición genera un evento que no solo actualiza el estado de la entidad sino que también dispara efectos colaterales en otras máquinas del sistema. Esta aproximación garantiza trazabilidad completa para compliance fiscal con AFIP, auditoría operativa y debugging en producción.

Todas las máquinas comparten conventions uniformity: los nombres de estados van en SCREAMING_SNAKE_CASE, los eventos en camelCase prefijados con el nombre de la máquina (ej. `trip.confirm`), y las transiciones se expresan como `EstadoOrigen → EstadoDestino`.

---

## 1. Máquina de Estado: Trip (Viaje)

El ciclo de vida de un Trip en Spottruck atraviesa seis estados principales. Un Trip nace cuando un shipper crea una solicitud de transporte (alta de carga) y culmina cuando el transportista confirma la entrega y se completa la facturación, o cuando alguna de las partes decide cancelarlo dentro de los parámetros permitidos. El Trip es la entidad central que dispara toda la cadena de valor: desde la solicitud inicial hasta el pago final al carrier.

### Diagrama de Estados (ASCII)

```
                                    ┌─────────────────────────────────────────┐
                                    │                                         │
                                    │     ┌─────────────┐    confirm          │
    request      ┌──────────────┐   │     │   STARTED   │────────────────────┤
   ┌──────────┐  │   CREATED    │ ──┘     └─────────────┘                    │
   │  DRAFT   │──┴──────────────┘                                       ┌────▼───────────┐
   └──────────┘                                                         │    CONFIRMED    │
        │                                                               └────┬────────────┘
        │                                                                    │ start
        │ cancel                                                             ▼
        ▼                                                            ┌───────────────┐
   ┌──────────────┐                                                     │  IN_PROGRESS  │
   │  CANCELLED   │                                                     └────┬────────────┘
   └──────────────┘                                                          │
        ▲                                                                   │ complete
        │                                                                   ▼
        │                                                            ┌───────────────┐
        │                                                            │   DELIVERED   │
        └───────────────────────────────────────────────────────────┴────┬────────────┘
                                                                     │ invoice_sent
                                                                     ▼
                                                              ┌───────────────┐
                                                              │   INVOICED    │
                                                              └────┬────────────┘
                                                                   │ payment_received
                                                                   ▼
                                                            ┌───────────────┐
                                                            │   COMPLETED   │
                                                            └───────────────┘
                                                                   │
                                                                   │ dispute
                                                                   ▼
                                                            ┌───────────────┐
                                                            │   DISPUTED    │
                                                            └───────────────┘
```

### Tabla de Estados y Transiciones

| Estado | Descripción | Transiciones Entrantes | Transiciones Salientes | Eventos que lo Disparan | Acciones | Guards/Condiciones | Estados Hijos |
|--------|-------------|------------------------|-----------------------|------------------------|----------|-------------------|--------------|
| `DRAFT` | El shipper está creando la solicitud de viaje; puede editar todos los campos antes de confirmar | — | → CREATED, → CANCELLED | `trip.create`, `trip.cancel` | Inicializar timestamp de creación, bloquear precio estimado temporal | Usuario autenticado, rol shipper | — |
| `CREATED` | Solicitud formalizada y en espera de asignación de carrier o inicio de auction | → DRAFT, → STARTED, → CANCELLED | → STARTED, → CANCELLED | `trip.confirm`, `trip.cancel` | Publicar en marketplace si está habilitado auto-assign, notificar carriers elegibles | Ruta válida, carga declarada, dimensiones dentro de límites | Sub-estado `CREATED_AUCTION_PENDING` cuando se dispara auction automáticamente |
| `STARTED` | El carrier fue asignado pero aún no se confirma el encuentro para carga | → CREATED, → CONFIRMED, → CANCELLED | → CONFIRMED, → CANCELLED | `trip.assign_carrier`, `trip.cancel` | Reservar carrier, generar código de verificación de encuentro, notificar a ambas partes | Carrier tiene capacidad disponible, carrier verificado | — |
| `CONFIRMED` | Ambas partes confirmaron el acuerdo; el carrier se compromete a pickup en la ventana horaria | → STARTED, → IN_PROGRESS | → IN_PROGRESS, → CANCELLED | `trip.start`, `trip.cancel` | Reservar capacidad en la fecha/hora de pickup, generar contrato implícito, iniciar hold de pago | ambas partes con cuenta activa, documentación del carrier verificada, póliza de seguro activa | — |
| `IN_PROGRESS` | El transporte está en camino con la carga; se activa tracking GPS | → CONFIRMED, → DISPUTED | → DELIVERED, → DISPUTED, → CANCELLED (fuerza mayor) | `trip.arrive`, `trip.dispute`, `trip.cancel_fm` | Activar tracking GPS, iniciar cronómetro de entrega, generar actualizaciones de ETA, notificar a shipper | Carga verificada en punto de pickup, seguro activo, coordenadas de origen válidas, device GPS conectado | — |
| `DELIVERED` | La carga llegó a destino y el receptor firmó la entrega | → IN_PROGRESS, → DISPUTED | → INVOICED, → DISPUTED | `trip.complete`, `trip.dispute` | Generar comprobante de entrega (CDR), calcular costos finales incluyendo suplementos, notificar a facturación | Recibo firmado digitalmente, fotos de entrega tomadas y validadas, peso de entrega verificado | Sub-estado `DELIVERED_PENDING_INVOICE` cuando factura aún no generada |
| `INVOICED` | Factura generada y enviada al shipper para pago | → DELIVERED, → DISPUTED | → COMPLETED, → DISPUTED | `trip.pay`, `trip.dispute` | Generar factura electrónica AFIP, enviar por email, iniciar contador de vencimiento de pago | Factura generada correctamente, CIF de receptor válido | — |
| `COMPLETED` | Pago confirmado y viaje archivado | → INVOICED, → DISPUTED (resuelto a favor) | — | `trip.payment_confirmed` | Archivar viaje, liberar hold de pago, actualizar stats del carrier, cerrar escrow | Pago confirmado por gateway, factura pagada o compensada | — |
| `DISPUTED` | Existe una controversia sobre el estado del viaje que requiere intervención | → IN_PROGRESS, → DELIVERED, → INVOICED | → IN_PROGRESS, → DELIVERED, → COMPLETED, → CANCELLED | `trip.dispute`, `trip.resolve` | Crear ticket de soporte, notificar a ambas partes, congelar pagos pendientes, notificar a equipo de compliance | Disputa documentada con evidencia, timestamp de creación de disputa registrado | — |
| `CANCELLED` | El viaje fue cancelado según las reglas de cancelación | → DRAFT, → CREATED, → STARTED, → CONFIRMED, → IN_PROGRESS (fuerza mayor) | — | `trip.cancel`, `trip.cancel_fm` | Liberar recursos, procesar reembolso si corresponde, notificar partes, archivar para auditoría | Cancelación dentro del período permitido según estado | Sub-estado `CANCELLED_PENALTY` cuando se aplica penalidad |

### Reglas Especiales de Cancelación

**Política de Cancelación por Estado:**

- `DRAFT`: Cancelación libre, sin penalidad. El shipper puede eliminar la solicitud en cualquier momento antes de confirmarla. No se genera ningún cargo.

- `CREATED`: Cancelación libre hasta 2 horas antes de la hora de recogida programada. Pasado ese umbral, se aplica una penalidad del 5% sobre el valor estimado del flete. Esta penalidad se retiene del hold de pago del shipper.

- `STARTED`: Cancelación con penalidad del 10% sobre el valor del flete si se cancela con menos de 24 horas de anticipación a la ventana de pickup. El carrier retain el depósito de seguridad.

- `CONFIRMED`: Penalidad del 15% si se cancela dentro de las 12 horas previas al pickup. El carrier tiene derecho a reclamar compensación por oportunidad perdida.

- `IN_PROGRESS`: Cancelación NO permitida excepto por fuerza mayor verificada (accidente en ruta, desperfecto mecánico documentado por autoridad, condiciones climáticas extremas que imposibilitan la continuación). La fuerza mayor debe ser documentada con evidencia fotográfica y/o policial.

- `DELIVERED`, `INVOICED`, `COMPLETED`: Cancelación no aplica; el viaje debe seguir su curso normal hacia completitud.

**Cálculo de Penalidades:**

La fórmula de penalidad es: `penalty = base_fare * penalty_percentage`, donde `penalty_percentage` depende del estado en que se cancela y del tiempo restante hasta pickup. El sistema retiene la penalidad del hold de pago y la libera al carrier afectado según el schedule de disbursement.

### Edge Cases y Condiciones de Carrera

**Race Condition: Confirmación simultánea entre carriers**
Cuando múltiples carriers intentan asignarse al mismo trip simultáneamente (especialmente en el flujo de auto-assign), el sistema debe garantizar que solo uno logre la asignación. Se implementa un lock optimista a nivel de base de datos con `SELECT FOR UPDATE` sobre el registro del trip, verificado antes de confirmar la transición a `STARTED`. Si dos carriers reciben respuesta afirmativa concurrently, el segundo carrier que intenta confirmar recibirá un error de tipo `TripAlreadyAssigned` y se le ofrecerá participar en la auction o elegir otro trip.

**Timeout de Confirmación**
Si un carrier confirma un trip pero el shipper no responde dentro de las 4 horas, el sistema automáticamente expira la confirmación y pone el trip de vuelta en el marketplace como `CREATED`. El carrier original recibe una notificación de expiración con opción de re-confirmar si el trip aún está disponible.

**Recovery Path: Interrupción de Tracking GPS**
Si el dispositivo GPS del carrier pierde conexión durante `IN_PROGRESS`, el sistema registra el último heartbeat conocido y marca el trip con un flag `GPS_SIGNAL_LOST`. El trip continúa su curso normal; cuando la conexión se restaura, el tracking se recompone automáticamente. Si la señal no se recupera en más de 2 horas, se dispara una alerta al soporte y se permite al shipper iniciar un dispute.

**Concurrencia: Edición de Trip en DRAFT**
Un shipper puede editar un trip en estado `DRAFT` múltiples veces. El sistema guarda cada versión con versioning incremental. Cuando el shipper confirma el trip, se toma la última versión como la definitiva.

### Eventos de Integración

Cuando un Trip cambia de estado, dispara los siguientes eventos hacia otras máquinas:

| Evento | Máquina Destino | Acción Disparada |
|--------|-----------------|------------------|
| `trip.created` | Auction | Crear auction asociada si auto-auction habilitado |
| `trip.started` | Notification | Notificar al shipper que el carrier fue asignado |
| `trip.confirmed` | Payment | Reservar hold de pago para el flete |
| `trip.in_progress` | Notification | Enviar tracking link al shipper, iniciar actualizaciones de ETA |
| `trip.delivered` | Invoice | Generar factura electrónica |
| `trip.completed` | Payment | Liberar pago al carrier (menos comisión Spottruck) |
| `trip.disputed` | Support | Crear ticket de soporte, congelar disbursement |
| `trip.cancelled` | Payment | Procesar reembolso o aplicar penalidad según corresponda |

---

## 2. Máquina de Estado: Auction (Subasta)

La máquina de Auction gestiona el ciclo completo de una puja, desde la configuración inicial por parte del shipper hasta la resolución definitiva con el carrier ganador. Cada auction está íntimamente ligada a un Trip y hereda sus restricciones (ruta, ventana horaria, tipo de carga). Las reglas de duración, extensión automática y postulación son configurables por el shipper dentro de los límites establecidos por Spottruck.

### Diagrama de Estados (ASCII)

```
                                  ┌──────────────────────────────────────────────┐
                                  │                                              │
        create                    │     ┌─────────────┐                         │
   ┌──────────┐   publish   ┌─────▼──────┐   start    ┌────────────┐          │
   │   DRAFT  │────────────▶│  SCHEDULED  │──────────▶│   ACTIVE   │◀─────────┤
   └──────────┘             └─────────────┘            └─────┬──────┘          │
        │                                                 │        │            │
        │                                                 │        │ extend     │
        │                                                 │        │ (5 min)    │
        │                                                 ▼        │            │
        │ delete              no_participants   ┌────────────┐     │            │
        ▼                                 ┌────│  ENDED      │     │            │
   ┌──────────┐                          │    └──────┬───────┘     │            │
   │CANCELLED │                          │           │  settle     │            │
   └──────────┘                          │           ▼             │            │
        ▲                                │    ┌────────────┐        │            │
        │                                │    │  SETTLED    │        │            │
        │           cancel               │    └────────────┘        │            │
        │                                 │           ▲             │            │
        │                                 │           │──────────────┘            │
        └─────────────────────────────────┴───────────┘              time_elapsed
                                         │
                                         │ fail
                                         ▼
                                   ┌──────────┐
                                   │  FAILED  │
                                   └──────────┘
```

### Tabla de Estados y Transiciones

| Estado | Descripción | Transiciones Entrantes | Transiciones Salientes | Eventos que lo Disparan | Acciones | Guards/Condiciones | Estados Hijos |
|--------|-------------|------------------------|-----------------------|------------------------|----------|-------------------|--------------|
| `DRAFT` | Auction creada pero no publicada; el shipper está configurando reglas, restricciones, duración mínima y precio base | — | → SCHEDULED, → CANCELLED | `auction.create`, `auction.publish`, `auction.delete` | Validar reglas de puja, verificar precio base, calcular fecha de inicio | Mínimo 3 carriers verificados en la ruta, precio base mayor a cero, duración mínima 30 minutos | Sub-estado `DRAFT_CONFIGURING` cuando el shipper está editando |
| `SCHEDULED` | Auction configurada y programada para iniciar en el futuro | → DRAFT, → ACTIVE, → FAILED, → CANCELLED | → ACTIVE, → FAILED, → CANCELLED | `auction.start`, `auction.no_participants`, `auction.cancel` | Enviar invitaciones a carriers elegibles, calcular tiempos de extensión, publicar en marketplace | Fecha de inicio futura válida (mínimo 15 minutos de margen), lista de carriers confirmada, ruta validada | Sub-estado `SCHEDULED_WAITING` durante la cuenta regresiva |
| `ACTIVE` | Auction abierta para recibir bids; el reloj corre y se extiende automáticamente si hay actividad en los últimos 5 minutos | → EXTENDED, → ENDED, → CANCELLED, → FAILED | → EXTENDED, → ENDED, → CANCELLED, → FAILED | `auction.bid`, `auction.time_elapsed`, `auction.cancel`, `auction.fail` | Actualizar mejor bid en tiempo real, notificar a carriers, recalcular winning_bid, reiniciar timer en extensión | Auction dentro de ventana válida, bids superiores al mínimo increment, menos de 10 extensiones totales | Sub-estado `ACTIVE_HIGH_ACTIVITY` cuando más de 3 bids en los últimos 5 minutos |
| `EXTENDED` | Subasta extendida automáticamente por actividad tardía; el timer se reinicia con tiempo adicional | → ACTIVE | → ACTIVE, → ENDED | `auction.resume`, `auction.time_elapsed` | Reiniciar contador con tiempo reducido (5 minutos), notificar a todos los carriers participantes sobre la extensión, registrar razón de extensión | Extensión máxima no alcanzada (máximo 10 extensiones), tiempo restante agotado | — |
| `ENDED` | El tiempo de la auction expiró; no hay más actividad pendiente | → SETTLED, → FAILED, → CANCELLED | → SETTLED, → FAILED, → CANCELLED | `auction.settle`, `auction.fail`, `auction.cancel` | Determinar ganador, calcular comisiones de Spottruck, procesar bloqueos de pago, generar resultado | Al menos un bid válido presente, auction no cancelada | Sub-estado `ENDED_PENDING_SETTLEMENT` mientras se procesa el settle |
| `SETTLED` | Auction resuelta con éxito: el payment del shipper está bloqueado, el carrier ganador está vinculado al trip | — | — | `auction.settle_complete` | Vincular al trip asociado, procesar hold de pago del shipper, confirmar al carrier ganador, notificar a perdedores, guardar historial de bids para análisis | Payment autorizado por el gateway, winner confirmado y activo, trip en estado compatible | — |
| `FAILED` | Auction no alcanzó mínimo de bids requeridos, falló la validación del sistema, o fue cancelada sin bids | — | — | `auction.fail`, `auction.cancel` | Reembolsar deposits de carriers, notificar a todos los participantes, sugerir al shipper re-programar con parámetros ajustados | Sin bids válidos o error de sistema crítico | Sub-estado `FAILED_NO_BIDS` cuando no hubo participación, `FAILED_SYSTEM_ERROR` en error técnico |
| `CANCELLED` | Auction cancelada por decisión del shipper o por fuerza mayor del sistema | — | — | `auction.cancel` | Liberar deposits de todos los carriers, notificar a todos los participantes, registrar razón de cancelación, archivar para auditoría | Cancelación dentro de la ventana de cancelación permitida, no hay winner confirmado aún | — |

### Lógica de Extensión Automática (Auto-Extend)

La auction implementa un mecanismo de extensión automática para garantizar que todos los carriers tengan oportunidad fair de competir. Las reglas son:

1. **Trigger de Extensión**: Cada vez que un bid se coloca dentro de los últimos 5 minutos antes del tiempo de cierre (`ending_time - now() <= 5 minutos`), la auction se extiende automáticamente por 5 minutos adicionales.

2. **Límite de Extensiones**: El número máximo de extensiones está configurado en 10 por auction. Una vez alcanzado este límite, la auction cerrará en la próxima expiración del timer sin importar la actividad.

3. **Recálculo de ending_time**: Cada extensión actualiza el `ending_time` sumando el tiempo de extensión al timestamp actual de expiración. La fórmula es: `new_ending_time = current_time + extension_duration (5 min)`.

4. **Notificación de Extensión**: Cada vez que ocurre una extensión, todos los carriers participantes reciben una notificación push y email indicando que la auction fue extendida y el nuevo tiempo de cierre.

5. **Logging de Extensiones**: Cada extensión genera un evento `AuctionExtended` con el timestamp original, el timestamp nuevo, el bid que disparó la extensión, y el contador de extensiones actualizado.

### Reglas Especiales de Auction

**Bid Mínimo Increment**: El incremento mínimo entre bids es del 2% del precio base de la auction. Un bid que no alcance este incremento será rechazado con el mensaje `BidTooLow`.

**Cantidad Mínima de Bids**: El shipper puede configurar un mínimo de bids requeridos para que la auction sea válida. Si al momento del settle no se alcanzó este mínimo, la auction pasa a estado `FAILED` con sub-estado `FAILED_INSUFFICIENT_BIDS`.

**Precio de Reserva (Reserve Price)**: El shipper puede establecer un precio de reserva que no es visible para los carriers. Si el mejor bid al momento del cierre no supera el reserve price, la auction se declara fallida. El reserve price solo es visible para Spottruck.

**Tiempo Mínimo de Duración**: Toda auction tiene un tiempo mínimo de 30 minutos. El shipper puede establecer un tiempo mayor pero no menor.

**blacklist de Carriers**: El shipper puede excluir carriers específicos de participar en su auction. Estos carriers no reciben invitación y no pueden hacer bid aunque tengan acceso directo.

### Edge Cases y Condiciones de Carrera

**Race Condition: Bid simultáneo de dos carriers**
Cuando dos carriers colocan bids casi simultáneamente (diferencia < 100ms), existe el riesgo de que ambos se acepten invalidando la integridad del orden. El sistema implementa un mutex a nivel de auction para procesamiento de bids: el primer bid adquiere el lock, el segundo espera. Una vez procesado el primero, se libera el lock y el segundo puede continuar. Si el segundo bid ya no es competitivo (porque el primero superó su monto o el timer expiró), se rechaza con `BidNoLongerCompetitive`.

**Concurrencia: Extensión mientras se procesa el settle**
Si una extensión ocurre exactamente al mismo tiempo que el proceso de settle intenta ejecutarse, el settle debe失败了 y la auction debe continuar. El lock de procesamiento de bids es diferente del lock de settle; si ambos compiten, el settle pierde y se reagenda para ejecutarse después de que la extensión complete.

**Timeout de Settle**
El proceso de settle tiene un timeout de 30 segundos. Si el gateway de payment no responde dentro de ese tiempo, el settle se marca como `PENDING` y se reagenda para retry. La auction permanece en `ENDED_PENDING_SETTLEMENT` hasta que el settle complete o se marque como failed después de 3 intentos.

**Recovery Path: Fallo de sistema durante ACTIVE**
Si el servicio de auction mengalami fallo (crash) mientras hay auctions activas, al reiniciar el servicio se reconstruye el estado desde el event log. Las auctions que deberían haber terminado según su `ending_time` pero que no fueron procesadas se detectan como "zombis" y se procesan inmediatamente con la acción correspondiente según el último evento registrado.

### Eventos de Integración

| Evento | Máquina Destino | Acción Disparada |
|--------|-----------------|------------------|
| `auction.created` | Trip | Actualizar estado del trip a `CREATED_AUCTION_PENDING` |
| `auction.started` | Notification | Enviar recordatorios a carriers elegibles |
| `auction.bid_received` | Bid | Procesar cada bid recebido, actualizar ranking |
| `auction.extended` | Notification | Notificar a todos los carriers sobre la extensión |
| `auction.ended` | Bid | Invalidar todos los bids pendientes que no fueron procesados |
| `auction.settled` | Trip | Vincular carrier ganador al trip, cambiar estado del trip a `STARTED` |
| `auction.settled` | Payment | Reservar hold de payment del shipper |
| `auction.settled` | Notification | Notificar al winner y a los perdedores |
| `auction.failed` | Trip | Actualizar estado del trip, permitir al shipper re-crear |
| `auction.cancelled` | Bid | Liberar todos los holds de bids de carriers |
| `auction.cancelled` | Notification | Notificar a todos los participantes con razón |

---

## 3. Máquina de Estado: UserAccount (Cuenta de Usuario)

Cada usuario en Spottruck — sea shipper (cargador) o carrier (transportista) — atraviesa un ciclo de vida de cuenta que refleja su estado de verificación, actividad y relación contractual con la plataforma. Esta máquina es críticas para la seguridad y compliance del marketplace.

### Diagrama de Estados (ASCII)

```
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                                                                          │
    │   register            verify          ┌─────────┐                       │
    │  ┌──────────┐      ┌──────────┐      │         │      suspend           │
    │  │  PENDING │──────▶│  ACTIVE  │◀─────│SUSPENDED│◀───────────────────────┤
    │  └──────────┘      └──────────┘      │         │                       │
    │       │                 │             └─────────┘                       │
    │       │                 │               │                              │
    │       │ decline         │ deactivate     │ reactivate                  │
    │       ▼                 ▼               │                              │
    │  ┌──────────────┐  ┌─────────────┐      │                              │
    │  │   DELETED    │  │ DEACTIVATED │──────┘                              │
    │  └──────────────┘  └─────────────┘                                     │
    │                                                                          │
    │                         ┌─────────────┐                                 │
    │                         │   BLOCKED   │                                 │
    │                         └─────────────┘                                 │
    │                              ▲                                          │
    │                              │ block (fraude)                           │
    └──────────────────────────────┴──────────────────────────────────────────┘
```

### Tabla de Estados y Transiciones

| Estado | Descripción | Transiciones Entrantes | Transiciones Salientes | Eventos que lo Disparan | Acciones | Guards/Condiciones | Estados Hijos |
|--------|-------------|------------------------|-----------------------|------------------------|----------|-------------------|--------------|
| `PENDING` | Usuario registrado pero sin verificar; acceso limitado a funcionalidades de consulta y browsing | — | → ACTIVE, → DELETED, → BLOCKED | `user.register`, `user.verify`, `user.decline`, `user.block` | Enviar email de verificación, crear registro en CRM, trackear source de adquisición | Email válido, teléfono verificado, acepta términos y condiciones | Sub-estado `PENDING_DOCUMENTS` cuando se están subiendo documentos de verificación |
| `ACTIVE` | Usuario verificado y operativo con acceso completo a la plataforma | → PENDING (re-verificación), → SUSPENDED, → DEACTIVATED | → SUSPENDED, → DEACTIVATED, → BLOCKED | `user.suspend`, `user.deactivate`, `user.block` | Notificar al usuario, asignar permisos completos, inicializar límites de operación | Documentos verificados, email confirmado, identidad validada, cuenta AFIP vinculada | Sub-estado `ACTIVE_VERIFIED` (más alto), `ACTIVE_BASIC` (verificación parcial) |
| `SUSPENDED` | Usuario temporalmente suspendido por comportamiento sospechoso, deuda pendiente o violación de términos; puede ser rehabilitado | → ACTIVE, → DEACTIVATED, → BLOCKED | → ACTIVE, → DEACTIVATED, → BLOCKED | `user.reactivate`, `user.deactivate`, `user.block` | Revocar acceso temporalmente, informar razón con evidencia, preservar datos y historial, congelar pagos pendientes | Investigación completada o tiempo de suspensión cumplido, deuda pagada o plan de pago acordado, apelación procesada y aprobada | Sub-estado `SUSPENDED_INVESTIGATION` (bajo investigación), `SUSPENDED_PAYMENT` (deuda) |
| `DEACTIVATED` | Cuenta cerrada permanentemente por decisión del usuario o por decisión de Spottruck después de violaciones persistentes; re-activación requiere nuevo registro | → PENDING (nuevo registro), → BLOCKED | — | `user.deactivate`, `user.block` | Anonimizar datos personales según GDPR/PDPA, archivar historial para auditoría regulatoria, cancelar subscriptions activas, desvincular cuentas de pago | Solicitud explícita del usuario o decisión de compliance después de 3 suspensiones en 12 meses | — |
| `BLOCKED` | Cuenta bloqueada por detección de fraude o actividad maliciosa confirmada; irreversibly blocked | → ACTIVE (solo para casos específicos), → DELETED | — | `user.block` | Revocar todos los accesos inmediatamente, invalidar todos los tokens de sesión, reportar a autoridades si corresponde (lavado de dinero),永久保留 datos para auditoría | Fraude confirmado con evidencia, actividad ilegal documentada, mandato legal | Sub-estado `BLOCKED_FRAUD`, `BLOCKED_TERMS_VIOLATION`, `BLOCKED_LEGAL` |
| `DELETED` | Cuenta eliminada lógicamente; los datos siguen existiendo para cumplimiento legal pero no son accesibles | → PENDING (nuevo registro) | — | `user.delete` | Marcar como eliminada en base de datos, remover de tutti gli indici di ricerca, conservar datos financieros para tax compliance | Solicitud del usuario con confirmación, orden judicial, expiración de período de retención de datos | — |

### Criterios de Suspensión Automática

El sistema puede suspender automáticamente una cuenta cuando se cumplen uma o más de las siguientes condiciones:

1. **Límite de Cancelaciones**: Más de 3 cancelaciones de trips en 30 días naturales. El contador se resetea cada mes. La suspensión tiene duración de 7 días.

2. **Disputas de Pago**: Más de 2 disputed payments en el último mes. La suspensión perdura hasta que las disputas estén resueltas.

3. **Reputación Baja**: El score de reputación cae por debajo de 2.0/5.0. La suspensión perdura hasta que el usuario obtenga al menos 2 reseñas positivas que eleven su score.

4. **Detección de Fraude**: El sistema de fraude (basado en reglas y ML) detecta patrón sospechoso. La suspensión es inmediata y requiere revisión manual para rehabilitar.

5. **Incumplimiento de Documentación**: Documentos de verificación vencidos o rechazados. La suspensión se levanta cuando el usuario sube documentos válidos.

6. **Deuda Pendiente**: Hay pagos pendientes de más de 15 días. La suspensión se levanta cuando la deuda es pagada o se establece un plan de pago.

### Edge Cases y Condiciones de Carrera

**Race Condition: Reactivación simultánea**
Si un usuario intenta reactivas su cuenta exactamente cuando el sistema está procesando una suspensión automática (por ejemplo, el scheduler de reputación baja ejecuta suspension al mismo tiempo que el usuario hace click en "reactivas"), el sistema debe priorizar la acción del usuario (reactivación) solo si la suspensión aún no fue persistida. Si la suspensión ya fue persistida, la reactivación debe fallar con mensaje de que la cuenta está bajo revisión.

**Timeout de Verificación de Email**
Si un usuario no verifica su email dentro de los 7 días posteriores al registro, la cuenta pasa automáticamente a estado `DELETED`. El usuario puede registrarse nuevamente pero debe repetir el proceso de verificación.

**Recovery Path: Suspensión por deuda**
Cuando una cuenta está suspendida por deuda y el usuario realiza un pago parcial, el sistema no reactiva automáticamente. El pago se registra pero la cuenta permanece suspendida hasta que un agente de soporte verifique que el monto pagado cubre la deuda y decida manualmente reactivas. Esto evita activaciones premature basadas en pagos parciales.

**Integridad de Sesiones Activas al Suspender**
Cuando una cuenta se suspende, todas las sesiones activas deben ser invalidadas inmediatamente. El sistema genera un evento `user.sessions_invalidated` que es procesado por el servicio de auth para revoke todos los refresh tokens del usuario.

### Eventos de Integración

| Evento | Máquina Destino | Acción Disparada |
|--------|-----------------|------------------|
| `user.created` | Notification | Enviar email de bienvenida y verificación |
| `user.verified` | Trip | Habilitar la creación de trips para el shipper |
| `user.suspended` | Payment | Congelar disbursements pendientes, notificar al equipo de pagos |
| `user.suspended` | Auction | Marcar los bids del usuario como `BID_USER_SUSPENDED` y rechazarlos |
| `user.suspended` | Notification | Enviar notificación push y email explicando la razón |
| `user.reactivated` | Notification | Enviar confirmación de reactivación y guía de如何使用 |
| `user.deactivated` | Trip | Cancelar todos los trips activos del usuario según las reglas de cancelación |
| `user.deactivated` | Auction | Cancelar todas las auctions activas del user |
| `user.deactivated` | Payment | Procesar reembolsos pendientes, desvincular métodos de pago |

---

## 4. Máquina de Estado: Bid (Oferta)

Cada bid en una auction de Spottruck atraviesa un ciclo de validación, competencia y resolución. El bid es la unidad fundamental de interacción entre carriers y auctions, y su ciclo de vida está intrínsecamente ligado tanto a la Auction como al Payment (holds y escrow).

### Diagrama de Estados (ASCII)

```
                        ┌─────────────────────────────────────────────────────────┐
                        │                                                 ┌──────┐ │
    submit              │    ┌───────────┐                                │ OUT  │ │
   ┌──────────┐         │    │ VALID     │◀────────────┐                 │ BID  │ │
   │SUBMITTED │────────┘    └─────┬─────┘              │                 │      │ │
   └──────────┘                  │                    │                  │      │ │
        │                       │ outbid             │                  │      │ │
        │                       ▼                    │                  │      │ │
        │ reject          ┌───────────┐             │                  │      │ │
        ▼            ┌────│  ACCEPTED  │             │                  │      │ │
   ┌──────────┐     │    └───────────┘             │                  │      │ │
   │ REJECTED │     │         │                   │                  │      │ │
   └──────────┘     │         │ win               │                  │      │ │
        ▲            │         │ (auction settled) │                  │      │ │
        │            │         ▼                   │                  │      │ │
        │            │    ┌───────────┐             │                  │      │ │
        │            │    │   WON     │             │                  │      │ │
        │            │    └───────────┘             │                  │      │ │
        │            │         │                   │                  │      │ │
        │            │         │                   │                  │      │ │
        │            │         │                   │                  │      │ │
        │            └─────────┴───────────────────┘                  └──────┘ │
        │                                                                  │
        │                                                     auto_bid      │
        │ (re-bid after outbid)                                    │         │
        └──────────────────────────────────────────────────────────┘         │
                                                                        │
   ┌──────────┐                                                         │
   │ EXPIRED  │◀────────────────────────────────────────────────────────┘
   └──────────┘
```

### Tabla de Estados y Transiciones

| Estado | Descripción | Transiciones Entrantes | Transiciones Salientes | Eventos que lo Disparan | Acciones | Guards/Condiciones | Estados Hijos |
|--------|-------------|------------------------|-----------------------|------------------------|----------|-------------------|--------------|
| `SUBMITTED` | Bid recibido pero aún no validado contra las reglas de la auction | — | → VALID, → REJECTED, → EXPIRED | `bid.submit`, `bid.validate`, `bid.expire` | Registrar timestamp de submission, adquirir lock de procesamiento, verificar formato y constraints | Carrier no está en lista de exclusión de la auction, formato de monto válido, bid dentro de límites de la auction | Sub-estado `SUBMITTED_PENDING_VALIDATION` |
| `VALID` | Bid validado y aceptable; está siendo considerado en la auction | → SUBMITTED, → OUTBID (re-bid) | → OUTBID, → ACCEPTED, → EXPIRED | `bid.outbid`, `bid.accept`, `bid.expire` | Actualizar mejor bid en la auction, notificar al carrier, recalcular ranking, iniciar timer de expiración si aplica | Bid supera el current_best_bid + minimum_increment, carrier tiene capacidad verificada, carrier tiene fondos suficientes en escrow | — |
| `OUTBID` | Otro carrier colocó un bid superior; esta oferta ya no es la mejor | → VALID, → ACCEPTED | → VALID (re-bid), → REJECTED, → EXPIRED | `bid.outbid`, `bid.rebid`, `bid.expire` | Notificar al carrier sobre el nuevo mejor bid, ofrecer auto-bid si está habilitado, eliminar el status de mejor bid | Carrier aún tiene capacidad, no alcanzó el límite de bids activos, auction aún está en estado ACTIVE | Sub-estado `OUTBID_NOTIFIED` después de enviar notificación |
| `ACCEPTED` | El bid fue aceptado por el carrier como su oferta final; el carrier se compromete | → VALID (carrier confirma) | → WON, → REJECTED, → EXPIRED | `bid.accept`, `bid.win`, `bid.expire` | Confirmar al carrier, lockear el bid como final, notificar a la auction que hay un bid comprometido | Carrier confirmó el bid intencionalmente, auction está en estado ACTIVE, bid es el mejor | Sub-estado `ACCEPTED_PENDING_AUCTION_SETTLE` |
| `WON` | Este bid resultó ganador de la auction; el carrier tiene el derecho de executar el trip | — | — | `bid.win` (disparado por auction.settled) | Vincular al trip, procesar escrow del carrier, confirmar al carrier, iniciar fase de asignación | Auction pasó a estado SETTLED, el bid era el mejor al momento del settle | — |
| `REJECTED` | Bid no pasó validación, fue cancelado por el carrier, o la auction se canceló antes de ser competitivo | — | — | `bid.reject`, `bid.cancel`, `auction.cancelled` | Liberar funds hold, notificar razón al carrier si aplicó, archivar para auditoría | Bid inválido desde el inicio, cancelado manualmente por el carrier, o la auction terminó sin que este bid fuera el winner | Sub-estado `REJECTED_INVALID` (falló validación), `REJECTED_CANCELLED` (carrier canceló), `REJECTED_AUCTION_CANCELLED` |
| `EXPIRED` | El bid perdió vigencia porque la auction terminó o porque el carrier no lo defendió dentro del período de validez | — | — | `bid.expire`, `auction.ended` | Archivar el bid como expirado, liberar cualquier hold de funds, no tiene derecho a convertirse en winner | Auction pasó a ENDED o SETTLED sin que este bid fuera el winner | — |

### Validación de Bids

Un bid es rechazado en las siguientes circunstancias (guards de validación):

1. **Monto Inferior al Minimum Increment**: El monto del bid es menor a `current_best_bid + (current_best_bid * minimum_increment_percentage)`. El mínimo increment por defecto es 2%.

2. **Límite de Bids Activos Alcanzado**: El carrier ha alcanzado el límite máximo de bids activos por auction (5 bids por auction, configurable). Un bid se considera activo si está en estado `SUBMITTED`, `VALID`, `ACCEPTED`.

3. **Auction No Activa**: La auction no está en estado `ACTIVE`. Solo se aceptan bids cuando la auction está activa.

4. **Carrier con Dispute Activo**: El carrier tiene un dispute abierto con Spottruck que bloquea nuevas operaciones. El dispute debe resolverse antes de que el carrier pueda participar en auctions.

5. **Fondos Insuficientes en Escrow**: El carrier no tiene fondos suficientes en su cuenta de escrow para cubrir el monto del bid. El sistema verifica el balance antes de aceptar el bid.

6. **Carrier Suspendido o Desactivado**: El carrier no tiene una cuenta en estado `ACTIVE`.

7. **Rango de Monto Inválido**: El bid está fuera del rango configurado por el shipper (mínimo y máximo).

### Edge Cases y Condiciones de Carrera

**Race Condition: Dos bids del mismo carrier simultáneos**
Un carrier no puede enviar dos bids para la misma auction al mismo tiempo. El sistema implementa un lock por carrier + auction que previene submissions concurrentes. Si el carrier intenta enviar un segundo bid mientras el primero aún está en procesamiento, el segundo recibe `DuplicateBidSubmission` error.

**Race Condition: Bid que compite con el timer de extensión**
Si un bid llega exactamente al mismo tiempo que el timer de la auction expiró, el sistema debe determinar si el bid fue recibido antes o después del expiration. Se usa el timestamp del servidor para determinar el orden. Si el bid llegó antes del expiration, se procesa normalmente; si llegó después, se rechaza con `AuctionEnded`.

**Auto-Bid y Recursive Outbid**
Cuando un carrier tiene auto-bid habilitado y otro carrier lo outbids, el sistema debe automatically colocar el siguiente bid posible del carrier original. El auto-bid se ejecuta con un delay de 100ms para evitar race conditions con otros bids concurrentes. El auto-bid está limitado a 3 recursion levels para evitar loops infinitos.

**Recovery Path: Bid aceptado pero la Auction falla después**
Si un bid está en estado `ACCEPTED` y la auction falla por error del sistema (no por decisión del shipper), el bid pasa a `REJECTED_AUCTION_CANCELLED` y los holds de funds se liberan. El carrier recibe notificación del fallo y puede reclamar si considera que hubo perjuicio.

### Eventos de Integración

| Evento | Máquina Destino | Acción Disparada |
|--------|-----------------|------------------|
| `bid.submitted` | Auction | Verificar que la auction está activa, actualizar current_best_bid si corresponde |
| `bid.validated` | Payment | Crear hold de funds por el monto del bid en la cuenta de escrow del carrier |
| `bid.outbid` | Notification | Enviar push notification al carrier indicando que fue superado |
| `bid.won` | Trip | Asignar el carrier ganador al trip, inicializar el trip |
| `bid.won` | Payment | Convertir el hold de funds en escrow definitivo, procesar cargo al carrier |
| `bid.rejected` | Payment | Liberar el hold de funds del carrier |
| `bid.expired` | Payment | Liberar cualquier hold pendiente |

---

## 5. Máquina de Estado: Payment (Pago)

El ciclo de vida de un pago en Spottruck atraviesa múltiples estados que reflejan el proceso de autorización, captura, disbursement y reconciliación. Dado que Spottruck opera como marketplace, el flujo de payment tiene particularidades como el hold de fondos del carrier, el escrow para el shipper, y la separación entre lo que el shipper paga y lo que el carrier recibe.

### Diagrama de Estados (ASCII)

```
                          ┌──────────────────────────────────────────────────────┐
                          │                                                      │
   authorize               │     ┌────────────┐      capture       ┌────────────┐  │
  ┌──────────┐         ┌──▼─────│  PENDING   │──────────────────▶│  AUTHORIZED│  │
  │  DRAFT   │────────▶│        └────────────┘                   └─────┬──────┘  │
  └──────────┘         │                                                 │        │
         │             │         ┌────────────┐      settle        ┌─────▼────┐   │
         │ cancel      │         │   FAILED   │◀─────────────────│  SETTLED │   │
         ▼             │         └────────────┘                   └──────────┘   │
    ┌──────────┐       │              ▲                                  │      │
    │ CANCELLED│       │              │ fail                             │      │
    └──────────┘       │              │                                  │ disbursement
                       │              │                                  ▼      │
                       │              │                           ┌───────────┐ │
                       │              └────────────────────────────│  DISBURSED│ │
                       │                                        └───────────┘ │
                       └──────────────────────────────────────────────────────┘
```

### Tabla de Estados y Transiciones

| Estado | Descripción | Transiciones Entrantes | Transiciones Salientes | Eventos que lo Disparan | Acciones | Guards/Condiciones | Estados Hijos |
|--------|-------------|------------------------|-----------------------|------------------------|----------|-------------------|--------------|
| `DRAFT` | Payment creado pero aún no autorizado; el sistema está preparando los detalles del cargo | — | → PENDING, → CANCELLED | `payment.create`, `payment.cancel` | Calcular monto final con impuestos y suplementos, determinar método de pago, generar orden de pago | Método de pago seleccionado, monto calculado correctamente | Sub-estado `DRAFT_VALIDATING` durante validación |
| `PENDING` | Payment creado y en espera de autorización del gateway de pago | → DRAFT, → FAILED, → CANCELLED | → AUTHORIZED, → FAILED, → CANCELLED | `payment.submit`, `payment.authorize`, `payment.fail` | Enviar request al gateway de pago, establecer timeout de autorización (30s), monitorizar respuesta | Gateway disponible, método de pago válido, fondos del usuario verificables | Sub-estado `PENDING_GATEWAY_RESPONSE` |
| `AUTHORIZED` | Payment autorizado pero aún no capturado; los fondos están bloqueados pero no transferidos | → PENDING (re-authorize), → SETTLED, → FAILED, → CANCELLED | → SETTLED, → FAILED, → CANCELLED | `payment.capture`, `payment.settle`, `payment.fail`, `payment.cancel` | Bloquear fondos en la cuenta del pagador, generar pre-captura, waiting para captura manual o automática | Authorization vigente, no expirada (máximo 7 días), monto dentro de límites | Sub-estado `AUTHORIZED_PENDING_CAPTURE` |
| `SETTLED` | Payment capturado y funds transferidos a la cuenta de Spottruck; el carrier puede ver el crédito | → DISBURSED (partial o total) | → DISBURSED, → DISPUTED, → REFUNDED | `payment.settle`, `payment.disburse`, `payment.dispute` | Transferir fondos a la cuenta de Spottruck, calcular comisiones, generar entrada contable, notificar al carrier | Capture confirmado por gateway, settled completo | Sub-estado `SETTLED_COMMISSION_CALCULATED` |
| `DISBURSED` | Fondos transferidos al carrier (menos la comisión de Spottruck y cualquier deducción) | → SETTLED | — | `payment.disburse` | Transferir fondos netos a la cuenta del carrier, generar comprobante de pago, actualizar balance de escrow | Settlement completo, carrier activo, no hay dispute abierto | Sub-estado `DISBURSED_PARTIAL` cuando se hace disbursement parcial |
| `DISPUTED` | Payment en disputa por una de las partes; fondos congelados hasta resolución | → SETTLED, → DISBURSED | → SETTLED, → DISBURSED, → REFUNDED | `payment.dispute`, `payment.resolve` | Crear ticket de dispute, notificar al equipo de pagos, congelar disbursement si aún no ocurrió, gather evidence | Dispute documentado, timestamp registrado, ambas partes notificadas | — |
| `REFUNDED` | Payment reembolsado parcial o totalmente al pagador | → SETTLED, → DISBURSED, → DISPUTED | — | `payment.refund`, `payment.resolve` | Ejecutar reembolso vía gateway, actualizar balance del pagador, generar nota de crédito, archivar | Reembolso aprobado por soporte o resolución automática, gateway procesó correctamente | Sub-estado `REFUNDED_PARTIAL`, `REFUNDED_FULL` |
| `FAILED` | Payment falló en cualquier paso del proceso | → PENDING, → AUTHORIZED | — | `payment.fail` | Notificar al usuario, rollback de cualquier hold, archivar con razón de fallo, sugerir retry | Fallo del gateway, fondos insuficientes, método de pago inválido, timeout | Sub-estado `FAILED_GATEWAY`, `FAILED_INSUFFICIENT_FUNDS`, `FAILED_TIMEOUT` |
| `CANCELLED` | Payment cancelado antes de ser capturado; puede ocurrir por timeout o por decisión del usuario | → DRAFT, → PENDING, → AUTHORIZED | — | `payment.cancel` | Liberar holds si los hay, archivar para auditoría, notificar al usuario | Payment no llegó a estado SETTLED, usuario lo canceló explícitamente | — |

### Reglas Especiales de Payment

**Escrow Logic para Shippers**:
Cuando un shipper participa en una auction y hace el payment inicial, los fondos no van directamente al carrier sino a una cuenta de escrow controlada por Spottruck. Los fondos permanecen en escrow hasta que el trip pasa a estado `DELIVERED` y el shipper confirma que no hay disputas. Una vez transcurrido el período de disputa (72 horas después de la entrega), los fondos se mueven de escrow a la cuenta de Spottruck para luego procesar el disbursement al carrier.

**Comisiones y Deducciones**:
La comisión de Spottruck es del 12% sobre el valor del flete más IVA. Esta comisión se deduce automáticamente durante el settlement. Si hay suplementos (fuel surcharge, tolls, etc.), la comisión se aplica sobre el subtotal antes de suplementos.

**Disbursement Schedule**:
Los disbursements a carriers se ejecutan según el siguiente schedule:
- Para trips completados sin disputas: disbursement automático a las 72 horas después de la entrega confirmada.
- Para carriers nuevos (menos de 5 trips completados): disbursement se retrasa 7 días para permitir disputas.
- Para carriers con historial de disputas: disbursement sujeto a review manual.

**Refund Policy**:
- Cancellation antes de pickup: refund del 100% si se cancela con más de 24h de anticipación, 80% si es entre 12-24h, 50% si es menos de 12h.
- Trip cancelado por fuerza mayor verificada: refund del 100%.
- Trip completado: no hay refund automático.

### Edge Cases y Condiciones de Carrera

**Race Condition: Captura simultánea**
Si por algún bug o race condition se intenta capturar el mismo payment dos veces, el sistema debe detectarlo y rechazar la segunda captura. Cada captura genera un idempotency key basado en payment_id + timestamp. El gateway de pago también verifica idempotency.

**Concurrencia: Dispute mientras se ejecuta disbursement**
Si un dispute se abre exactamente mientras el disbursement está en proceso, el sistema debe abortar el disbursement si aún no se completó la transferencia bancaria. Si la transferencia ya se completó, el dispute se procesa y el carrier debe devolver los fondos o se descuenta de futuros pagos.

**Timeout de Authorization**
Las authorizations tienen validity de 7 días. Después de ese período, la authorization expira automáticamente y el payment debe ser re-iniciado. El sistema monitorea authorizations próximas a expirar y envía recordatorios 48h antes.

**Recovery Path: Fallo de gateway durante capture**
Si el gateway falla durante el capture, el payment puede quedar en estado inconsistente (AUTHORIZED pero no SETTLED). El sistema tiene un job que detecta authorizaciones "hanging" y las resuelve automáticamente reintentando el capture o expirando la authorization.

### Eventos de Integración

| Evento | Máquina Destino | Acción Disparada |
|--------|-----------------|------------------|
| `payment.authorized` | Trip | Reservar hold de pago en el trip |
| `payment.settled` | Carrier | Acreditar comisión en balance del carrier |
| `payment.disbursed` | Notification | Notificar al carrier que recibió el pago |
| `payment.disputed` | Support | Crear ticket de dispute de payment |
| `payment.refunded` | Notification | Notificar al pagador sobre el reembolso |
| `payment.failed` | Trip | Marcar el trip como payment failed, permitir retry |

---

## 6. Máquina de Estado: Notification (Notificación)

La máquina de Notification gestiona el ciclo de vida de todos los mensajes enviados a los usuarios de Spottruck. Esto incluye notificaciones push, emails, SMS y mensajes in-app. La máquina permite trackear el estado de cada notificación, manejar failures y retries, y garantizar que los usuarios reciban la información crítica sobre sus operaciones.

### Diagrama de Estados (ASCII)

```
         create                  send                   ┌────────────┐
    ┌─────────────┐         ┌─────────────┐         ┌───│  DELIVERED │◀──────────┐
    │   QUEUED    │────────▶│   PENDING   │────────▶│   └────────────┘            │
    └─────────────┘         └─────────────┘         │                           │
         │                        │                  │ delivery                  │
         │                        │ fail             ▼                           │
         │                        ▼            ┌────────────┐     retry          │
         │                   ┌─────────────┐   │   FAILED   │────────────────────┘
         │                   │   SENT      │   └────────────┘                   │
         │                   └─────────────┘        │                              │
         │                        │                 │ manual_retry                 │
         │                        │ read            ▼                              │
         │                        │            ┌─────────────┐                     │
         │                        ▼            │ MANUAL_RETRY│                    │
         │                   ┌─────────────┐   └─────────────┘                    │
         │                   │   READ      │                                     │
         │                   └─────────────┘                                     │
         │                        │                                              │
         │                        │ dismiss                                     │
         │                        ▼                                              │
         │                   ┌─────────────┐                                     │
         │                   │  DISMISSED │                                     │
         │                   └─────────────┘                                     │
         │                                                                     │
         │                   ┌─────────────┐                                     │
         └──────────────────▶│   EXPIRED  │                                     │
                             └─────────────┘                                     │
```

### Tabla de Estados y Transiciones

| Estado | Descripción | Transiciones Entrantes | Transiciones Salientes | Eventos que lo Disparan | Acciones | Guards/Condiciones | Estados Hijos |
|--------|-------------|------------------------|-----------------------|------------------------|----------|-------------------|--------------|
| `QUEUED` | Notificación creada y en cola para procesamiento; awaiting turno de envío | — | → PENDING, → EXPIRED, → CANCELLED | `notification.create`, `notification.schedule` | Agregar a la cola de procesamiento, registrar metadata, calcular optimal send time | Prioridad asignada, canal definido, usuario válido | Sub-estado `QUEUED_HIGH_PRIORITY` para notificaciones críticas |
| `PENDING` | Notificación siendo enviada por el canal seleccionado (push/email/SMS) | → QUEUED, → FAILED, → SENT | → SENT, → FAILED | `notification.send`, `notification.fail` | Invocar servicio del canal (Firebase para push, SendGrid para email, Twilio para SMS), establecer timeout (30s), monitorizar respuesta | Canal configurado, credentials válidos, servicio disponible | Sub-estado `PENDING_PUSH`, `PENDING_EMAIL`, `PENDING_SMS` |
| `SENT` | Notificación enviada exitosamente al dispositivo/servidor del usuario | → PENDING, → READ, → FAILED | → READ, → DISMISSED, → FAILED | `notification.delivered`, `notification.read`, `notification.fail` | Confirmar delivery con el proveedor, registrar timestamp, activar tracking de engagement si es push | Confirmación de delivery recibida del proveedor | — |
| `READ` | El usuario abrió/interactuó con la notificación | → SENT, → PENDING | → DISMISSED | `notification.read`, `notification.dismiss` | Registrar timestamp de lectura, trackear engagement (para analytics y optimizar delivery), marcar como leída | Usuario interactuó con la notificación (apertura en app, click en email) | — |
| `FAILED` | El envío de la notificación falló después de todos los retries | → PENDING, → QUEUED | → PENDING (retry), → MANUAL_RETRY, → EXPIRED | `notification.fail`, `notification.retry` | Registrar razón del fallo, decrementar contador de retries, evaluar si aplicar retry automático o escalation a manual | Intentos de envío agotados o erro irrecoverable | Sub-estado `FAILED_GATEWAY_UNAVAILABLE`, `FAILED_INVALID_RECIPIENT`, `FAILED_QUOTA_EXCEEDED` |
| `MANUAL_RETRY` | Notificación fallida que requiere retry manual o intervención de soporte | → FAILED | → PENDING, → EXPIRED | `notification.manual_retry` | Escalar a soporte, marcar para revisión, no aplicar retry automático | Fallo después de máximo retries automáticos, error requiere intervención | — |
| `DISMISSED` | El usuario dismissió la notificación sin leerla | → SENT, → READ | — | `notification.dismiss` | Registrar timestamp de dismiss, actualizar stats de engagement | Usuario dismissió explícitamente | — |
| `EXPIRED` | La notificación perdió validez porque pasó demasiado tiempo desde la creación | → QUEUED, → PENDING, → SENT | — | `notification.expire` | Remover de la cola de procesamiento, archivar para auditoría, no enviar | TTL de la notificación excedido (configurable por tipo, default 7 días) | — |
| `CANCELLED` | La notificación fue cancelada antes de ser enviada | → QUEUED, → PENDING | — | `notification.cancel` | Remover de la cola, archivar con razón de cancelación, no generar cargo | Notificación obsoleta (trip cancelado, auction resuelta, etc.) | — |

### Reglas de Reintento (Retry Logic)

**Retry Policy:**
- Para falhas transitorias (gateway unavailable, timeout): retry automático con backoff exponencial. Máximo 3 intentos.
- Intervalos de retry: 1min, 5min, 15min.
- Para falhas permanentes (invalid recipient, quota exceeded): no retry automático, pasa a MANUAL_RETRY.

**Priority Tiers:**
- `CRITICAL`: Se reintenta inmediatamente, sin backoff. Incluye alertas de seguridad, updates de tracking en tiempo real.
- `HIGH`: Retry con backoff corto. Incluye confirmaciones de trips, resultados de auctions.
- `NORMAL`: Retry con backoff estándar (1min, 5min, 15min).
- `LOW`: Un solo retry, sin urgencia. Incluye newsletters, recordatorios no críticos.

### Edge Cases y Condiciones de Carrera

**Delivery Confirmation Lost**
Si el provider reporta que la notificación fue enviada pero no se recibe confirmación de delivery, el sistema marca como `SENT` pero el dispositivo puede no haber recibido. El sistema no reintenta automáticamente en este caso para evitar duplicación; en su lugar, espera a que el usuario interactúe o expire el TTL.

**User Opt-Out Mid-Process**
Si el usuario se désinscribe de un tipo de notificación mientras una notificación está en estado `PENDING`, el sistema debe abortar el envío. El provider (Firebase/SendGrid) también honors las preferencias del usuario, pero el sistema de Spottruck también lo verifica para mantener compliance.

**Rate Limiting**
El sistema respeta rate limits tanto propios como de los providers. Si se alcanza el rate limit, las notificaciones se mantienen en cola con delay adicional. El provider de email tiene un límite de 100 emails/minuto; el de SMS tiene límite de 50 SMS/minuto.

### Eventos de Integración

| Evento | Máquina Destino | Acción Disparada |
|--------|-----------------|------------------|
| `notification.created` | AuditLog | Registrar en log de auditoría para compliance |
| `notification.failed` | Support | Crear alert para el equipo de notificaciones |
| `notification.read` | Analytics | Trackear engagement para mejorar targeting |

---

## 7. Sección de Integración Cruzada (Cross-Machine Integration)

Las máquinas de estado no operan de forma aislada; existen dependencias y trigger points que conectan el ciclo de vida de una entidad con otra. Esta sección documenta las interacciones más importantes entre las máquinas.

### Diagrama de Integración Trip → Auction → Bid → Payment

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TRIP                                                     │
│  ┌───────┐     ┌───────────┐     ┌────────────┐     ┌───────────┐     ┌───────────┐    │
│  │ DRAFT │────▶│  CREATED  │────▶│  STARTED   │────▶│IN_PROGRESS│────▶│ DELIVERED │    │
│  └───────┘     └─────┬─────┘     └──────┬──────┘     └─────┬─────┘     └─────┬─────┘    │
│                      │                   │                   │                 │          │
│                      │ auction_created   │                   │                 │          │
│                      ▼                   │                   │                 │          │
│               ┌─────────────┐            │                   │                 │          │
│               │   AUCTION   │            │                   │                 │          │
│  ┌───────┐    └──────┬──────┘            │                   │                 │          │
│  │ DRAFT  │─────────▶│                   │                   │                 │          │
│  └───────┘           │                   │                   │                 │          │
│         │             │                   │                   │                 │          │
│         │ bid_won     │                   │                   │                 │          │
│         │             ▼                   │                   │                 │          │
│         │      ┌─────────────┐           │                   │                 │          │
│         │      │     BID     │           │                   │                 │          │
│         │      └──────┬──────┘           │                   │                 │          │
│         │             │                  │                   │                 │          │
│         │ payment_reserved             │                   │                 │          │
│         │             │                  │                   │                 │          │
│         │             ▼                  │                   │                 │          │
│         │      ┌─────────────┐           │                   │                 │          │
│         │      │   PAYMENT   │           │                   │                 │          │
│         │      └──────┬──────┘           │                   │                 │          │
│         │             │                  │                   │                 │          │
│         │             │ payment_settled  │ trip_completed   │                 │          │
│         │             │                  │                  │                 │          │
│         │             │                  ▼                  ▼                 ▼          │
│         │             │            ┌───────────┐      ┌───────────┐      ┌──────────┐ │
│         │             │            │  DISBURSE │◀─────│  HOLD     │◀─────│  ESCROW  │ │
│         │             │            └───────────┘      └───────────┘      └──────────┘ │
│         │             │                                                        │
│         │             │         NOTIFICACIÓN CRUZADA                            │
│         │             └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Flujo Completo de Integración: Creación de Trip con Auction Automática

1. **Shipper crea Trip** (evento: `trip.create`)
   - Trip pasa a estado `DRAFT`, luego `CREATED` cuando el shipper confirma.
   - Si el shipper habilitó auto-auction, se dispara `auction.create` automáticamente.

2. **Auction creada y programada** (evento: `auction.created`)
   - Auction pasa a `SCHEDULED` y luego a `ACTIVE` cuando llega el tiempo de inicio.
   - Los carriers elegibles reciben invitaciones (notification).

3. **Carrier hace Bid** (evento: `bid.submit`)
   - Bid pasa por validación: carrier activo, funds suficientes, auction activa.
   - Bid pasa a `VALID` y se convierte en `current_best_bid` si supera al anterior.
   - Se dispara `payment.reserve_hold` para bloquear funds en escrow del carrier.

4. **Auction se Settlea** (evento: `auction.settled`)
   - El bid ganador pasa a `WON`.
   - Se dispara `trip.assign_carrier` vinculando el carrier al trip.
   - Trip pasa a estado `STARTED`.
   - Payment del shipper se autoriza y pasa a `AUTHORIZED`.

5. **Trip en progreso** (evento: `trip.start`)
   - Trip pasa a `IN_PROGRESS`, carrier inicia viaje.
   - Notificaciones de tracking se envían al shipper periódicamente.

6. **Trip entregado** (evento: `trip.delivered`)
   - Trip pasa a `DELIVERED`.
   - Se genera invoice para el shipper.
   - Payment pasa a `SETTLED`.

7. **Período de disputa (72h)**
   - Si no hay disputas, payment pasa a `DISBURSED` al carrier.
   - El carrier recibe notificación de pago recibido.
   - Trip pasa a `COMPLETED`.

### Tabla de Eventos de Integración Cruzada

| Evento Originating | Máquina Origen | Máquina Destino | Acción | Descripción |
|-------------------|----------------|-----------------|--------|-------------|
| `trip.created` | Trip | Auction | `create` | Crear auction si auto-auction habilitado |
| `trip.created` | Trip | Notification | `send` | Confirmar creación al shipper |
| `trip.started` | Trip | Notification | `send` | Notificar al shipper sobre carrier asignado |
| `trip.in_progress` | Trip | Notification | `send` | Enviar link de tracking |
| `trip.delivered` | Trip | Invoice | `generate` | Generar factura electrónica |
| `trip.completed` | Trip | Payment | `disburse` | Iniciar proceso de disbursement |
| `trip.disputed` | Trip | Support | `create_ticket` | Crear ticket de soporte |
| `auction.created` | Auction | Bid | `initialize` | Preparar tracking de bids |
| `auction.started` | Auction | Notification | `send` | Notificar a carriers elegibles |
| `auction.bid_received` | Auction | Bid | `process` | Procesar cada bid recebido |
| `auction.extended` | Auction | Notification | `send` | Notificar extensión a carriers |
| `auction.settled` | Auction | Bid | `declare_winner` | Marcar bid ganador como WON |
| `auction.settled` | Auction | Trip | `assign_carrier` | Vincular carrier al trip |
| `auction.settled` | Auction | Payment | `authorize` | Autorizar payment del shipper |
| `bid.won` | Bid | Trip | `assign` | Confirmar asignación del carrier |
| `bid.won` | Bid | Payment | `capture` | Confirmar captura del hold |
| `bid.rejected` | Bid | Payment | `release_hold` | Liberar hold del bid rechazado |
| `payment.authorized` | Payment | Trip | `hold_reserved` | Reservar hold en el trip |
| `payment.settled` | Payment | Carrier | `credit` | Acreditar en balance del carrier |
| `payment.disbursed` | Payment | Notification | `send` | Notificar al carrier |
| `payment.disputed` | Payment | Support | `escalate` | Escalar a equipo de pagos |
| `user.suspended` | UserAccount | Trip | `cancel_pending` | Cancelar trips activos del usuario |
| `user.suspended` | UserAccount | Auction | `reject_bids` | Rechazar bids del usuario |
| `user.suspended` | UserAccount | Payment | `hold_disbursements` | Congelar disbursements pendientes |

---

## 8. Requisitos de Idempotencia y Log de Auditoría

### Política de Idempotencia

Cada máquina de estado debe garantizar idempotencia en sus transiciones. Esto significa que aplicar la misma transición múltiples veces con los mismos parámetros no debe generar efectos colaterales duplicados o estados inconsistentes.

**Implementación de Idempotency Keys:**
- Cada evento de transición incluye un `event_id` único (UUIDv4).
- El estado actual de la entidad se verifica antes de aplicar la transición.
- Si el `event_id` ya fue procesado (detección via event log), el evento se ignora y se retorna el estado actual sin errores.

**Ejemplo: Trip Confirmation Idempotente**
```
processTripConfirm(tripId, eventId, timestamp):
    existingState = getTripState(tripId)
    
    if existingState.eventIds.contains(eventId):
        return existingState  // idempotent - already processed
    
    if existingState.status != REQUESTED:
        throw TransitionNotAllowedException(
            "Cannot confirm trip in state {existingState.status}")
    
    newState = transition(existingState, CONFIRMED)
    newState.eventIds.add(eventId)
    saveState(newState)
    
    emitIntegrationEvents(newState)
    return newState
```

### Log de Auditoría (Audit Log)

Todas las transiciones deben generar entradas en el audit log con la siguiente estructura:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único de la entrada de auditoría |
| `entity_type` | String | Tipo de entidad (Trip, Auction, Bid, Payment, UserAccount, Notification) |
| `entity_id` | UUID | Identificador de la entidad específica |
| `event_type` | String | Tipo de evento que disparó la transición |
| `from_state` | String | Estado anterior |
| `to_state` | String | Estado nuevo |
| `actor_type` | Enum | USER, SYSTEM, SCHEDULER |
| `actor_id` | UUID | Identificador del actor (user_id o system identifier) |
| `timestamp` | DateTime | Timestamp del evento |
| `metadata` | JSON | Datos adicionales relevantes (IP, user agent, motivo, etc.) |
| `event_id` | UUID | ID del evento para detección de duplicados |

**Requisitos de Compliance Fiscal (AFIP):**
- Los logs de auditoría para operaciones financieras (payments, invoices) deben conservarse por mínimo 10 años.
- Los logs deben ser inmutables: no se permite UPDATE ni DELETE sobre entradas de auditoría.
- Cada entrada debe incluir hash del contenido anterior para garantizar integridad de cadena.

**Retención de Logs:**
- Operaciones financieras: 10 años.
- Operaciones de usuario (login, logout, cambios de perfil): 2 años.
- Logs operativos (errors, warnings): 90 días.
- Debug logs: 7 días.

---

## 9. Seguridad de Concurrencia (Concurrency Safety)

La plataforma Spottruck maneja múltiples operaciones concurrentes simultáneas, especialmente en escenarios de alta demanda como subastas con muchos carriers participando activamente. Esta sección documenta las estrategias de concurrency safety implementadas.

### Mecanismos de Lock

**Optimistic Locking (para entidades principales):**
- Cada entidad tiene un campo `version` que se incrementa en cada transición.
- Antes de aplicar una transición, el sistema verifica que la versión en base de datos coincida con la versión al momento de leer.
- Si la versión no coincide, se lanza `OptimisticLockException` y se solicita retry.

```
updateTrip(tripId, transition):
    currentEntity = readTrip(tripId)
    
    result = database.execute("""
        UPDATE trips 
        SET status = ?, version = version + 1 
        WHERE id = ? AND version = ?
    """, [transition.newStatus, tripId, currentEntity.version])
    
    if result.rowsAffected == 0:
        throw OptimisticLockException("Concurrent modification detected")
```

**Pessimistic Locking (para operaciones críticas):**
- Para operaciones que requieren garantía de exclusividad (como la asignación de un carrier a un trip), se usa `SELECT FOR UPDATE`.
- El lock se mantiene durante la transacción y se libera al commit/rollback.
- Timeout de lock: 10 segundos. Si no se puede adquirir el lock en ese tiempo, se falla la operación.

### Handling de Bids Concurrentes

El scenario más sensible a concurrency es el procesamiento de bids durante una auction activa. El flujo es:

1. **Recepción de Bid**: El bid llega al servicio con timestamp del servidor como `submitted_at`.
2. **Adquisición de Lock**: Se adquiere lock exclusivo sobre la auction para procesamineto de bids.
3. **Validación**: Se verifica que la auction aún está activa y que el bid es válido.
4. **Comparación**: Se compara el monto del bid contra el current_best_bid.
5. **Actualización**: Se actualiza el current_best_bid si el nuevo bid es superior.
6. **Release de Lock**: Se libera el lock.
7. **Evento de Outbid**: Si había un bid anterior que era el mejor, se dispara el evento de outbid asynchronously.

```
processBid(bidRequest):
    lockId = acquireLock("auction:" + bidRequest.auctionId, timeout=10s)
    
    if lockId == null:
        return BidRejected("Auction temporarily unavailable")
    
    try:
        auction = readAuction(bidRequest.auctionId)
        
        if auction.status != ACTIVE:
            return BidRejected("Auction no longer active")
        
        if bidRequest.amount <= auction.currentBestBid:
            return BidRejected("Bid amount too low")
        
        previousBestBid = auction.currentBestBid
        
        updateAuctionCurrentBestBid(bidRequest.auctionId, bidRequest.amount, bidRequest.carrierId)
        
        emitOutbidEvent(previousBestBid)
        
        return BidAccepted(bidRequest.bidId)
    finally:
        releaseLock(lockId)
```

### Race Conditions Documentadas y Sus Soluciones

| Scenario | Problema Potencial | Solución Implementada |
|----------|-------------------|----------------------|
| Dos carriers hacen bid simultáneamente | Ambos bids se aceptan y el segundo sobrescribe al primero | Lock de auction + verificación atómica de current_best_bid |
| Un trip es cancelado mientras se le asigna un carrier | El carrier termina asignado a un trip cancelado | Lock de trip + verificación de estado antes de asignar |
| Payment capturado dos veces (duplicate capture) | Doble cargo al shipper | Idempotency key en el gateway + dedupe en aplicación |
| Authorization expiró mientras se intenta capture | Capture falla y payment queda en estado inconsistente | Job scheduler que detecta authorizations pendientes y las re-intenta |
| Usuario hace logout mientras tiene sesión activa en otro dispositivo | Sesiones huérfanas o conflictos | Token revocation con blacklist + check de estado en cada request |
| Notificación enviada dos veces por retry | Duplicate notification al usuario | Deduplicación por notification_id en el provider |

### Deadlock Prevention

Para prevenir deadlocks en la base de datos:
- El orden de adquisición de locks siempre sigue una jerarquía determinística (por ejemplo, siempre lock sobre auction antes de lock sobre bid).
- Los locks se adquieren con timeout y se liberan en orden inverso al adquisición.
- Transacciones largas se dividen en pasos más pequeños con checkpoints.

---

## Resumen de Eventos por Máquina

| Máquina | Evento | Estado Origen | Estado Destino | Integraciones Activadas |
|---------|--------|---------------|----------------|------------------------|
| Trip | `trip.create` | — | DRAFT | Notification (welcome) |
| Trip | `trip.confirm` | CREATED | STARTED | Notification (carrier assigned), Payment (reserve hold) |
| Trip | `trip.start` | STARTED | IN_PROGRESS | Notification (tracking started) |
| Trip | `trip.complete` | DELIVERED | INVOICED | Invoice (generate), Notification (invoice sent) |
| Auction | `auction.create` | — | DRAFT | Trip (update status) |
| Auction | `auction.publish` | DRAFT | SCHEDULED | Notification (invitations sent to carriers) |
| Auction | `auction.start` | SCHEDULED | ACTIVE | Notification (auction started) |
| Auction | `auction.bid` | ACTIVE | ACTIVE | Bid (validate), Payment (hold), Notification (outbid) |
| Auction | `auction.extend` | ACTIVE | EXTENDED | Notification (auction extended) |
| Auction | `auction.settle` | ENDED | SETTLED | Bid (declare winner), Trip (assign carrier), Payment (authorize) |
| Bid | `bid.submit` | — | SUBMITTED | Auction (update best bid), Payment (reserve funds) |
| Bid | `bid.outbid` | VALID | OUTBID | Notification (outbid alert), Bid (auto-bid check) |
| Bid | `bid.won` | ACCEPTED | WON | Trip (assign carrier), Payment (capture hold) |
| Bid | `bid.reject` | SUBMITTED | REJECTED | Payment (release hold) |
| UserAccount | `user.verify` | PENDING | ACTIVE | Notification (account verified), Trip (enable creation) |
| UserAccount | `user.suspend` | ACTIVE | SUSPENDED | Notification (suspension reason), Trip (cancel pending), Auction (reject bids) |
| UserAccount | `user.reactivate` | SUSPENDED | ACTIVE | Notification (reactivation confirmed), Trip (restore ability) |
| UserAccount | `user.deactivate` | ACTIVE/SUSPENDED | DEACTIVATED | Notification (deactivation), Trip (cancel all), Payment (process refunds) |
| Payment | `payment.authorize` | PENDING | AUTHORIZED | Trip (reserve hold) |
| Payment | `payment.capture` | AUTHORIZED | CAPTURED | Payment (settle), Notification (capture confirmed) |
| Payment | `payment.settle` | CAPTURED | SETTLED | Carrier (credit balance), Notification (payment settled) |
| Payment | `payment.disburse` | SETTLED | DISBURSED | Carrier (update balance), Notification (disbursement notice) |
| Payment | `payment.dispute` | SETTLED/DISBURSED | DISPUTED | Support (create ticket), Payment (freeze disbursement) |
| Payment | `payment.refund` | SETTLED | REFUNDED | Notification (refund processed), User (update balance) |
| Notification | `notification.send` | PENDING | SENT | AuditLog (record), Analytics (track) |
| Notification | `notification.fail` | PENDING | FAILED | Support (alert), Notification (retry schedule) |
| Notification | `notification.read` | SENT | READ | Analytics (engagement tracking) |

---

*Última actualización: 2026-06-04 | Versión: 2.0 | Estado: Activo*
*Este documento forma parte de la especificación técnica de Spottruck y es requerido para cumplimiento regulatorio AFIP.*