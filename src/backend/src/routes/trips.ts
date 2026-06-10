import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { notificationService } from '../services/notificationService.js'
import { paymentService } from '../services/paymentService.js'
import { broadcastToTrip } from '../websocket/index.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

const createTripSchema = z.object({
  originAddress: z.string().min(1),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  originProvince: z.string().optional(),
  originCity: z.string().optional(),
  destAddress: z.string().min(1),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  destProvince: z.string().optional(),
  destCity: z.string().optional(),
  distanceKm: z.number().positive().optional(),
  durationMin: z.number().int().positive().optional(),
  cargoType: z.enum(['BULK', 'PALLETS', 'GENERAL', 'REFRIGERATED']),
  cargoDesc: z.string().optional(),
  weightKg: z.number().positive().optional(),
  volumeDesc: z.string().optional(),
  scheduledDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  basePrice: z.number().positive(),
})

const updateTripSchema = createTripSchema.partial().strict()

const tripWhereSchema = z.object({
  status: z.string().optional(),
  cargoType: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

// GET /trips
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, cargoType, minPrice, maxPrice, page = '1', limit = '20' } = tripWhereSchema.parse(req.query)
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (cargoType) where.cargoType = cargoType
    if (minPrice || maxPrice) {
      where.basePrice = {}
      if (minPrice) (where.basePrice as Record<string, number>).gte = Number(minPrice)
      if (maxPrice) (where.basePrice as Record<string, number>).lte = Number(maxPrice)
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, companyName: true, ratingAvg: true } },
          auction: { select: { id: true, status: true, currentPrice: true, type: true, endTime: true } },
        },
      }),
      prisma.trip.count({ where }),
    ])

    res.json({ data: trips, meta: { total, page: Number(page), limit: Number(limit) } })
  } catch (err) {
    next(err)
  }
})

// GET /trips/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id as string },
      include: {
        user: { select: { id: true, companyName: true, ratingAvg: true, ratingCount: true, companyCuit: true, phone: true } },
        auction: {
          include: {
            bids: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: {
                user: { select: { id: true, companyName: true, ratingAvg: true, ratingCount: true, phone: true, tripsCompleted: true, documentsStatus: true } },
                truck: { select: { id: true, plate: true, type: true, capacityKg: true } },
              },
            },
          },
        },
        trackingLogs: { orderBy: { recordedAt: 'desc' }, take: 100 },
        ratings: { select: { fromUserId: true, toUserId: true, score: true } },
      },
    })
    if (!trip) return next(errors.notFound('Trip'))
    res.json({ data: trip })
  } catch (err) {
    next(err)
  }
})

// POST /trips
router.post('/', authenticate, requireRole('COMPANY', 'ADMIN'), async (req, res, next) => {
  try {
    const data = createTripSchema.parse(req.body)
    const trip = await prisma.trip.create({
      data: {
        ...data,
        userId: req.user!.sub,
        scheduledDate: new Date(data.scheduledDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    })
    res.status(201).json({ data: trip })
  } catch (err) {
    next(err)
  }
})

// PUT /trips/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id as string } })
    if (!trip) return next(errors.notFound('Trip'))
    if (trip.userId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return next(errors.forbidden())
    }
    if (!['DRAFT', 'OPEN'].includes(trip.status)) {
      return next(errors.badRequest('Cannot edit trip in current status'))
    }

    const data = updateTripSchema.parse(req.body)

    const updated = await prisma.trip.update({
      where: { id: req.params.id as string },
      data,
    })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /trips/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id as string } })
    if (!trip) return next(errors.notFound('Trip'))
    if (trip.userId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return next(errors.forbidden())
    }
    if (!['DRAFT', 'OPEN'].includes(trip.status)) {
      return next(errors.badRequest('Cannot delete trip in current status'))
    }

    await prisma.trip.delete({ where: { id: req.params.id as string } })
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

// ─── Transiciones de estado del viaje (stepper de la app original) ───────────
// ASSIGNED (Preparando) → IN_PROGRESS (En viaje) → DELIVERED (Esperando
// confirmación) → SETTLED (Finalizada). El transportista avanza los dos
// primeros pasos y la empresa confirma el último.

async function getAssignedDriverId(tripId: string): Promise<string | null> {
  const acceptedBid = await prisma.bid.findFirst({
    where: { auction: { tripId }, status: 'ACCEPTED' },
    select: { userId: true },
  })
  return acceptedBid?.userId ?? null
}

// POST /trips/:id/start — el transportista asignado empieza el viaje
router.post('/:id/start', authenticate, requireRole('DRIVER'), async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id as string } })
    if (!trip) return next(errors.notFound('Trip'))
    if (trip.status !== 'ASSIGNED') return next(errors.badRequest('Trip must be ASSIGNED to start'))

    const driverId = await getAssignedDriverId(trip.id)
    if (driverId !== req.user!.sub) return next(errors.forbidden('You are not assigned to this trip'))

    const updated = await prisma.trip.update({ where: { id: trip.id }, data: { status: 'IN_PROGRESS' } })

    await notificationService.createInApp(
      trip.userId,
      'TRIP_STATE',
      'El transportista empezó el viaje',
      `${trip.originAddress} → ${trip.destAddress}`,
      { tripId: trip.id, status: 'IN_PROGRESS' }
    )
    broadcastToTrip(trip.id, { type: 'trip_update', status: 'IN_PROGRESS' })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// POST /trips/:id/finish — el transportista marca el viaje como terminado
router.post('/:id/finish', authenticate, requireRole('DRIVER'), async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id as string } })
    if (!trip) return next(errors.notFound('Trip'))
    if (trip.status !== 'IN_PROGRESS') return next(errors.badRequest('Trip must be IN_PROGRESS to finish'))

    const driverId = await getAssignedDriverId(trip.id)
    if (driverId !== req.user!.sub) return next(errors.forbidden('You are not assigned to this trip'))

    const updated = await prisma.trip.update({ where: { id: trip.id }, data: { status: 'DELIVERED' } })

    await notificationService.createInApp(
      trip.userId,
      'TRIP_STATE',
      'El transportista terminó el viaje',
      'Confirmá la entrega para finalizar y liberar el pago',
      { tripId: trip.id, status: 'DELIVERED' }
    )
    broadcastToTrip(trip.id, { type: 'trip_update', status: 'DELIVERED' })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// POST /trips/:id/confirm-delivery — la empresa confirma la entrega y se
// libera el pago al transportista
router.post('/:id/confirm-delivery', authenticate, requireRole('COMPANY', 'ADMIN'), async (req, res, next) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id as string } })
    if (!trip) return next(errors.notFound('Trip'))
    if (trip.userId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return next(errors.forbidden('Not your trip'))
    }
    if (trip.status !== 'DELIVERED') return next(errors.badRequest('Trip must be DELIVERED to confirm'))

    const payment = await prisma.payment.findFirst({
      where: { tripId: trip.id, status: 'HELD' },
    })
    if (payment) {
      // releasePayment también pasa el viaje a SETTLED
      await paymentService.releasePayment(payment.id)
    } else {
      await prisma.trip.update({ where: { id: trip.id }, data: { status: 'SETTLED' } })
    }

    const driverId = await getAssignedDriverId(trip.id)
    if (driverId) {
      await prisma.user.update({
        where: { id: driverId },
        data: { tripsCompleted: { increment: 1 } },
      })
      await notificationService.createInApp(
        driverId,
        'TRIP_STATE',
        'La empresa confirmó la entrega',
        'El viaje finalizó. ¡No te olvides de valorar a la empresa!',
        { tripId: trip.id, status: 'SETTLED' }
      )
    }

    broadcastToTrip(trip.id, { type: 'trip_update', status: 'SETTLED' })

    const updated = await prisma.trip.findUnique({ where: { id: trip.id } })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

export { router as tripsRouter }
