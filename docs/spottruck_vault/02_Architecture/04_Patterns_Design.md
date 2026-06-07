---
title: Spottruck - Patrones de Diseño v1.0
date: 2026-06-04
author: Jarvis AI Agent
status: in_progress
tags: [patrones-de-diseño, arquitectura, spottruck]
---

# Spottruck — Patrones de Diseño v1.0

## 04_Patterns_Design.md

---

## 1. Visión General de Patrones Arquitectónicos

Este documento describe los patrones de diseño utilizados en la arquitectura de Spottruck para garantizar consistencia, escalabilidad y mantenibilidad en todo el codebase. Cada patrón cumple un propósito específico dentro de la arquitectura general del sistema de subastas de transporte.

Los patrones arquitectónicos seleccionados para Spottruck abordan los desafíos específicos de una plataforma de subastas en tiempo real para el sector transporte, donde la concurrencia, la consistencia de datos y la experiencia de usuario en tiempo real son críticas.

| Patrón | Capa | Propósito |
|--------|------|----------|
| Repository | Acceso a Datos | Abstraer operaciones de base de datos |
| Factory | Creación de Objetos | Encapsular lógica de instanciación |
| Observer | Manejo de Eventos | Notificaciones en tiempo real |
| CQRS | Lógica de Negocio | Separar operaciones de lectura y escritura |
| Event Sourcing | Almacenamiento | Registros de eventos inmutables |
| Circuit Breaker | Integración | Tolerancia a fallos |
| Retry | Red | Manejo de fallos transitorios |
| Unit of Work | Transacción | Operaciones atómicas |

---

## 2. Patrón Repository

### 2.1 Definición de Interfaz

El patrón Repository actúa como una capa de abstracción entre la lógica de dominio y la persistencia de datos. En Spottruck, este patrón es fundamental para mantener el dominio limpio de dependencias de infraestructura y facilitar las pruebas unitarias mediante la inyección de dependencias.

```typescript
// src/modules/users/repository.ts
interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByRole(role: UserRole): Promise<User[]>
  create(user: CreateUserDTO): Promise<User>
  update(id: string, data: UpdateUserDTO): Promise<User>
  delete(id: string): Promise<void>
  addVehicle(userId: string, vehicle: VehicleDTO): Promise<Vehicle>
}

// Implementación PostgreSQL
class PostgresUserRepository implements UserRepository {
  constructor(
    private readonly db: DatabasePool,
    private readonly mapper: UserMapper
  ) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )
    return result.rows[0] ? this.mapper.toDomain(result.rows[0]) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    return result.rows[0] ? this.mapper.toDomain(result.rows[0]) : null
  }

  async create(dto: CreateUserDTO): Promise<User> {
    const hash = await bcrypt.hash(dto.password, 12)
    const result = await this.db.query(
      `INSERT INTO users (id, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [ulid(), dto.email.toLowerCase(), hash, dto.role]
    )
    return this.mapper.toDomain(result.rows[0])
  }
}
```

### 2.2 Repositorio Genérico Base

La implementación base del repository pattern en Spottruck proporciona una estructura reutilizable que reduce la duplicación de código entre los diferentes módulos del sistema.

```typescript
// src/shared/base/repository.ts
abstract class BaseRepository<T, ID> {
  abstract findById(id: ID): Promise<T | null>
  abstract findAll(filter?: Partial<T>): Promise<T[]>
  abstract save(entity: T): Promise<T>
  abstract delete(id: ID): Promise<void>

  protected async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }
}
```

La principal ventaja de utilizar el patrón Repository en Spottruck radica en la capacidad de cambiar la implementación de persistencia sin modificar la lógica de negocio. Por ejemplo, durante las pruebas unitarias se puede sustituir el repositorio PostgreSQL por un repositorio en memoria sinimpactar el resto de la aplicación.

---

## 3. Patrón Factory

### 3.1 Fábrica de Usuarios

El patrón Factory en Spottruck se utiliza principalmente para encapsular la lógica compleja de creación de entidades de dominio, especialmente cuando la construcción de un objeto requiere validaciones específicas o la coordinación de múltiples pasos de inicialización.

```typescript
// src/modules/users/factory.ts
class UserFactory {
  createTransportista(data: TransportistaDTO): Transportista {
    return new Transportista({
      id: ulid(),
      email: data.email,
      role: 'transportista',
      profile: {
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        documento: {
          tipo: data.documentoTipo,
          numero: data.documentoNumero
        }
      },
      vehicles: [],
      rating: 0,
      verified: false,
      createdAt: new Date()
    })
  }

  createEmpresa(data: EmpresaDTO): Empresa {
    return new Empresa({
      id: ulid(),
      email: data.email,
      role: 'empresa',
      profile: {
        razonSocial: data.razonSocial,
        cuit: data.cuit,
        telefono: data.telefono,
        direccion: data.direccion
      },
      premium: data.premium || false,
      rating: 0,
      verified: false,
      createdAt: new Date()
    })
  }
}
```

### 3.2 Fábrica de Viajes con Estado

La TripFactory demuestra cómo el patrón Factory se integra con el sistema de estados del dominio para crear instancias correctamente inicializadas según el contexto de negocio.

```typescript
// src/modules/trips/factory.ts
class TripFactory {
  createTrip(data: CreateTripDTO, userId: string): Trip {
    const trip = new Trip({
      id: ulid(),
      userId,
      origin: new Location(data.origin),
      destination: new Location(data.destination),
      cargo: new Cargo(data.cargo),
      dates: {
        carga: new Date(data.fechaCarga),
        entrega: new Date(data.fechaEntrega)
      },
      pricing: {
        maxPrice: data.precioMaximo,
        reservePrice: data.reservePrice
      },
      conditions: data.condiciones || [],
      status: TripStatus.DRAFT,
      createdAt: new Date()
    })
    return trip
  }

  createAuction(tripId: string, config: AuctionConfig): Auction {
    return new Auction({
      id: ulid(),
      tripId,
      status: AuctionStatus.PENDING,
      startTime: new Date(),
      endTime: new Date(Date.now() + config.durationMs),
      extensions: 0,
      maxExtensions: config.maxExtensions || 12,
      reservePrice: config.reservePrice,
      minIncrement: config.minIncrement || 1000
    })
  }
}
```

El uso del patrón Factory en Spottruck permite centralizar las reglas de validación y los procesos de inicialización de objetos de dominio, evitando la duplicación de esta lógica en múltiples puntos del código y facilitando el mantenimiento cuando los requisitos de creación cambian.

---

## 4. Patrón Observer (Eventos en Tiempo Real)

### 4.1 Implementación del Bus de Eventos

El patrón Observer en Spottruck se implementa mediante un Event Bus centralizado que permite la comunicación desacoplada entre componentes del sistema. Este patrón es esencial para mantener la coherencia en una arquitectura de microservicios donde múltiples servicios necesitan reaccionar a eventos del dominio.

```typescript
// src/shared/events/event-bus.ts
interface AppEvent {
  type: string
  payload: Record<string, unknown>
  timestamp: Date
  metadata?: {
    correlationId?: string
    userId?: string
  }
}

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map()
  private pubsub: RedisPubSub

  constructor(redis: Redis) {
    this.pubsub = new RedisPubSub(redis)
  }

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
  }

  async publish(event: AppEvent): Promise<void> {
    // Publicar en Redis para suscriptores distribuidos
    await this.pubsub.publish(`events:${event.type}`, JSON.stringify(event))
    
    // Manejar handlers locales sincrónicamente
    const handlers = this.handlers.get(event.type) || []
    await Promise.all(handlers.map(h => h.handle(event)))
  }

  subscribeToChannel(channel: string, handler: (msg: string) => void): void {
    this.pubsub.subscribe(channel, handler)
  }
}

// Definiciones de eventos del dominio
const TripEvents = {
  CREATED: 'trip.created',
  PUBLISHED: 'trip.published',
  CANCELLED: 'trip.cancelled',
  ASSIGNED: 'trip.assigned',
  STARTED: 'trip.started',
  COMPLETED: 'trip.completed'
} as const

const AuctionEvents = {
  STARTED: 'auction.started',
  BID_PLACED: 'auction.bid_placed',
  BID_MODIFIED: 'auction.bid_modified',
  EXTENDED: 'auction.extended',
  CLOSED: 'auction.closed',
  CANCELLED: 'auction.cancelled'
} as const
```

### 4.2 Manejadores de Eventos

Los event handlers implementan la lógica de reacción a los eventos publicados en el bus. En Spottruck, estos handlers son responsables de actualizar estados, enviar notificaciones y mantener la consistencia entre diferentes partes del sistema.

```typescript
// src/modules/auction/handlers/auction-event-handler.ts
class AuctionEventHandler {
  constructor(
    private readonly notifyService: NotifyService,
    private readonly bidRepository: BidRepository,
    private readonly tripRepository: TripRepository
  ) {}

  async handleBidPlaced(event: AppEvent): Promise<void> {
    const { auctionId, bid, currentLowest, userId } = event.payload

    // Verificar extensión anti-sniping
    const auction = await this.auctionRepository.findById(auctionId)
    const timeRemaining = auction.endTime.getTime() - Date.now()
    
    if (timeRemaining < ANTI_SNIPE_THRESHOLD_MS) {
      await this.extendAuction(auctionId, ANTI_SNIPE_EXTENSION_MS)
      
      // Notificar extensión
      await this.notifyService.publishToRoom(
        `trip:${auction.tripId}`,
        {
          type: 'auction_extended',
          auctionId,
          newEndTime: auction.endTime
        }
      )
    }

    // Broadcast del nuevo precio más bajo
    await this.notifyService.publishToRoom(
      `trip:${auction.tripId}:auction`,
      {
        type: 'bid_update',
        currentLowest: currentLowest,
        bidCount: await this.bidRepository.countForAuction(auctionId)
      }
    )
  }

  async handleAuctionClosed(event: AppEvent): Promise<void> {
    const { auctionId, winnerId, finalPrice } = event.payload

    const auction = await this.auctionRepository.findById(auctionId)
    const trip = await this.tripRepository.findById(auction.tripId)

    // Determinar ganador
    const winningBid = await this.bidRepository.findWinningBid(auctionId)
    
    await this.notifyService.sendToUser(winnerId, {
      type: 'auction_won',
      tripId: trip.id,
      price: finalPrice,
      pickupInstructions: trip.pickupInstructions
    })

    // Marcar viaje como asignado
    await this.tripRepository.updateStatus(trip.id, TripStatus.ASSIGNED)
  }
}
```

La implementación del patrón Observer en Spottruck permite que el sistema mantenga una arquitectura altamente desacoplada donde los componentes no necesitan conocer la existencia de otros componentes con los que interactúan, únicamente necesitan suscribirse a los eventos relevantes para su funcionamiento.

---

## 5. Patrón CQRS (Command Query Responsibility Segregation)

### 5.1 Lado de Comandos

CQRS (Command Query Responsibility Segregation) es un patrón fundamental en Spottruck que separa claramente las operaciones de escritura (comandos) de las operaciones de lectura (consultas). Esta separación es particularmente valiosa en un sistema de subastas donde la alta concurrentura en lecturas requiere optimización específica.

```typescript
// src/modules/trips/commands/place-bid.command.ts
interface PlaceBidCommand {
  tripId: string
  userId: string
  amount: number
  message?: string
  estimatedArrival: Date
}

class PlaceBidCommandHandler {
  async handle(cmd: PlaceBidCommand): Promise<BidResult> {
    // Validar estado de la auction
    const auction = await this.auctionRepository.findActiveByTripId(cmd.tripId)
    if (!auction) {
      throw new AuctionClosedException('No active auction for this trip')
    }

    // Verificar monto de la oferta
    const currentLowest = await this.bidRepository.getLowestBid(cmd.tripId)
    if (cmd.amount >= currentLowest) {
      throw new InvalidBidAmountException(
        `Bid must be less than current lowest: ${currentLowest}`
      )
    }

    // Verificar límite de ofertas activas del usuario
    const activeBids = await this.bidRepository.countActiveByUser(cmd.userId)
    if (activeBids >= MAX_ACTIVE_BIDS) {
      throw new BidLimitExceededException('Maximum 3 active bids allowed')
    }

    // Crear oferta
    const bid = Bid.create({
      id: ulid(),
      auctionId: auction.id,
      userId: cmd.userId,
      amount: cmd.amount,
      message: cmd.message,
      estimatedArrival: cmd.estimatedArrival,
      status: BidStatus.PLACED,
      createdAt: new Date()
    })

    await this.bidRepository.save(bid)

    // Publicar evento
    await this.eventBus.publish({
      type: AuctionEvents.BID_PLACED,
      payload: {
        auctionId: auction.id,
        bidId: bid.id,
        userId: cmd.userId,
        amount: cmd.amount
      },
      timestamp: new Date()
    })

    return new BidResult(bid.id, cmd.amount)
  }
}
```

### 5.2 Lado de Consultas (Modelo de Lectura)

El lado de consultas en CQRS está optimizado para operaciones de lectura frecuentes y concurrentes. En Spottruck, las consultas del modelo de lectura se benefician de cachés en Redis y proyecciones optimizadas para proporcionar tiempos de respuesta mínimos.

```typescript
// src/modules/auction/queries/auction-status.query.ts
interface AuctionStatusDTO {
  auctionId: string
  tripId: string
  currentLowest: number
  bidCount: number
  endTime: Date
  isExtended: boolean
  timeRemaining: number
}

class GetAuctionStatusQuery {
  async execute(tripId: string): Promise<AuctionStatusDTO> {
    // Usar caché Redis para lecturas rápidas
    const cached = await this.cache.get(`auction:${tripId}`)
    if (cached) {
      return JSON.parse(cached)
    }

    // Fallback a base de datos
    const auction = await this.auctionRepository.findByTripId(tripId)
    const lowestBid = await this.bidRepository.getLowestBid(tripId)
    const bidCount = await this.bidRepository.countForAuction(auction.id)

    const result: AuctionStatusDTO = {
      auctionId: auction.id,
      tripId,
      currentLowest: lowestBid?.amount || auction.pricing.maxPrice,
      bidCount,
      endTime: auction.endTime,
      isExtended: auction.extensions > 0,
      timeRemaining: auction.endTime.getTime() - Date.now()
    }

    // Caché por 30 segundos
    await this.cache.setex(
      `auction:${tripId}`,
      30,
      JSON.stringify(result)
    )

    return result
  }
}
```

### 5.3 Actualizaciones del Modelo de Lectura (Proyecciones)

Las proyecciones son responsables de mantener actualizado el modelo de lectura a partir de los eventos del dominio. Este patrón permite que el sistema mantenga vistas materializadas optimizadas para diferentes casos de uso.

```typescript
// src/modules/auction/projections/auction.projection.ts
class AuctionProjection {
  onBidPlaced(event: AppEvent): void {
    const { auctionId, amount, userId } = event.payload

    // Actualizar modelo de lectura desnormalizado
    const readModel = this.readModelRepo.findByAuctionId(auctionId)
    readModel.bids.push({
      amount,
      userId,
      timestamp: event.timestamp
    })
    readModel.currentLowest = amount
    readModel.bidCount++
    
    this.readModelRepo.save(readModel)

    // Invalidar caché
    this.cache.del(`auction:${readModel.tripId}`)
  }

  onAuctionClosed(event: AppEvent): void {
    const { auctionId, winnerId } = event.payload

    const readModel = this.readModelRepo.findByAuctionId(auctionId)
    readModel.status = 'closed'
    readModel.winnerId = winnerId
    readModel.closedAt = event.timestamp

    this.readModelRepo.save(readModel)

    // Actualizar caché con estado final
    this.cache.setex(
      `auction:${readModel.tripId}`,
      3600, // 1 hora de caché para subastas cerradas
      JSON.stringify(readModel)
    )
  }
}
```

La aplicación del patrón CQRS en Spottruck proporciona beneficios significativos en términos de rendimiento y escalabilidad. El modelo de escritura puede optimizarse para integridad de datos y transacciones complejas, mientras que el modelo de lectura puede optimizarse independientemente para consultas frecuentes y concurrentes sin comprometer la consistencia del sistema.

---

## 6. Event Sourcing

### 6.1 Event Store

Event Sourcing en Spottruck complementa CQRS al almacenar el historial completo de cambios como una secuencia de eventos inmutables. Este enfoque proporciona un audit trail completo y permite reconstruir el estado de cualquier entidad en cualquier punto del tiempo.

```typescript
// src/shared/event-store/event-store.ts
interface StoredEvent {
  id: string
  aggregateId: string
  aggregateType: string
  eventType: string
  payload: Record<string, unknown>
  metadata: {
    correlationId?: string
    causationId?: string
    userId?: string
  }
  timestamp: Date
  version: number
}

class EventStore {
  constructor(private db: DatabasePool) {}

  async append(
    aggregateId: string,
    aggregateType: string,
    events: AppEvent[],
    expectedVersion: number
  ): Promise<void> {
    await this.db.transaction(async (client) => {
      // Verificación de concurrencia optimista
      const current = await client.query(
        'SELECT version FROM event_store WHERE aggregate_id = $1 ORDER BY version DESC LIMIT 1',
        [aggregateId]
      )
      
      if (current.rows[0] && current.rows[0].version !== expectedVersion) {
        throw new ConcurrencyException('Aggregate has been modified')
      }

      // Append de eventos
      for (let i = 0; i < events.length; i++) {
        const event = events[i]
        await client.query(
          `INSERT INTO event_store (id, aggregate_id, aggregate_type, event_type, payload, metadata, timestamp, version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            ulid(),
            aggregateId,
            aggregateType,
            event.type,
            JSON.stringify(event.payload),
            JSON.stringify(event.metadata || {}),
            event.timestamp,
            expectedVersion + i + 1
          ]
        )
      }
    })
  }

  async getEventsForAggregate(aggregateId: string): Promise<StoredEvent[]> {
    const result = await this.db.query(
      'SELECT * FROM event_store WHERE aggregate_id = $1 ORDER BY version ASC',
      [aggregateId]
    )
    return result.rows
  }
}
```

### 6.2 Aggregate Root

El Aggregate Root en Event Sourcing encapsula la lógica de negocio y genera eventos que representan todos los cambios de estado. Cada aggregate mantiene su propia versión y valida que las operaciones sean válidas según el estado actual.

```typescript
// src/modules/auction/aggregate/auction.aggregate.ts
class AuctionAggregate {
  private version = 0
  private uncommittedEvents: AppEvent[] = []

  constructor(
    private id: string,
    private tripId: string,
    private status: AuctionStatus,
    private currentLowest: number,
    private bids: Bid[] = [],
    private endTime: Date,
    private extensions: number = 0
  ) {}

  // Manejadores de comandos
  placeBid(userId: string, amount: number): void {
    if (this.status !== AuctionStatus.ACTIVE) {
      throw new AuctionNotActiveException()
    }

    if (amount >= this.currentLowest) {
      throw new InvalidBidAmountException()
    }

    const bid = new Bid({
      id: ulid(),
      auctionId: this.id,
      userId,
      amount,
      status: BidStatus.PLACED,
      createdAt: new Date()
    })

    this.bids.push(bid)

    this.recordThat('bid.placed', {
      auctionId: this.id,
      bidId: bid.id,
      userId,
      amount,
      previousLowest: this.currentLowest
    })

    this.currentLowest = amount
  }

  extend(newEndTime: Date): void {
    this.recordThat('auction.extended', {
      auctionId: this.id,
      previousEndTime: this.endTime,
      newEndTime,
      extensions: this.extensions + 1
    })

    this.endTime = newEndTime
    this.extensions++
  }

  close(winnerId: string): void {
    if (this.status !== AuctionStatus.ACTIVE) {
      throw new AuctionNotActiveException()
    }

    this.recordThat('auction.closed', {
      auctionId: this.id,
      winnerId,
      finalPrice: this.currentLowest,
      totalBids: this.bids.length
    })

    this.status = AuctionStatus.CLOSED
  }

  // Helpers de Event Sourcing
  private recordThat(eventType: string, payload: Record<string, unknown>): void {
    this.uncommittedEvents.push({
      type: eventType,
      payload,
      timestamp: new Date(),
      metadata: { aggregateId: this.id }
    })
  }

  getUncommittedEvents(): AppEvent[] {
    return [...this.uncommittedEvents]
  }

  // Rehidratación desde eventos
  static fromEvents(events: StoredEvent[]): AuctionAggregate {
    const aggregate = new AuctionAggregate('', '', AuctionStatus.PENDING, 0, [], new Date(), 0)
    
    for (const event of events) {
      aggregate.replayEvent(event)
    }

    return aggregate
  }

  private replayEvent(event: StoredEvent): void {
    switch (event.eventType) {
      case 'bid.placed':
        this.currentLowest = event.payload.amount as number
        this.bids.push(...)
        break
      case 'auction.extended':
        this.endTime = new Date(event.payload.newEndTime as string)
        this.extensions = event.payload.extensions as number
        break
      case 'auction.closed':
        this.status = AuctionStatus.CLOSED
        break
    }
    this.version++
  }
}
```

Los beneficios de Event Sourcing en Spottruck son múltiples. Primero, proporciona un historial completo e inmutable de todos los cambios, lo que facilita la auditoría y el debugging. Segundo, permite reconstruir el estado de cualquier auction en cualquier punto del tiempo, útil para análisis retrospectivos y resolución de disputas. Tercero, habilita patrones avanzados como temporal queries y event replay para nuevos casos de uso futuros.

---

## 7. Conclusión

Los patrones de diseño implementados en Spottruck forman una arquitectura coherente y robusta que soporta los requisitos específicos de una plataforma de subastas de transporte. La combinación del Repository Pattern con el Unit of Work garantiza la consistencia transaccional, mientras que CQRS y Event Sourcing proporcionan la base para escalar horizontalmente y mantener un historial completo de operaciones.

El patrón Observer, implementado mediante el Event Bus, asegura que todas las partes del sistema permanezcan sincronizadas de manera desacoplada, permitiendo que nuevos features se agreguen sin modificar código existente. Finalmente, los patrones de resiliencia como Circuit Breaker y Retry protegen al sistema de fallos en servicios externos, manteniendo la disponibilidad incluso bajo condiciones adversas.

---

*Documento generado: 2026-06-04*
*Versión de patrones de diseño: 1.0*
