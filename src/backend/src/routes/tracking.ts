import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { broadcastToTrip } from '../websocket/index.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// GET /tracking/:tripId/current — última posición
router.get('/:tripId/current', authenticate, async (req, res, next) => {
  try {
    const log = await prisma.trackingLog.findFirst({
      where: { tripId: req.params.tripId as string },
      orderBy: { recordedAt: 'desc' },
    })
    if (!log) return next(errors.notFound('Tracking data'))
    res.json({ data: log })
  } catch (err) {
    next(err)
  }
})

// GET /tracking/:tripId/history — historial de posiciones
router.get('/:tripId/history', authenticate, async (req, res, next) => {
  try {
    const { limit = '100' } = req.query
    const logs = await prisma.trackingLog.findMany({
      where: { tripId: req.params.tripId as string },
      orderBy: { recordedAt: 'desc' },
      take: Number(limit),
    })
    res.json({ data: logs })
  } catch (err) {
    next(err)
  }
})

// POST /tracking/:tripId — registrar posición (desde GPS del truck)
router.post('/:tripId', authenticate, async (req, res, next) => {
  try {
    const { lat, lng, speed, heading } = z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      speed: z.number().optional(),
      heading: z.number().optional(),
    }).parse(req.body)

    const trip = await prisma.trip.findUnique({ where: { id: req.params.tripId as string } })
    if (!trip) return next(errors.notFound('Trip'))
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(trip.status)) {
      return next(errors.badRequest('Trip not in progress'))
    }

    const log = await prisma.trackingLog.create({
      data: {
        tripId: req.params.tripId as string,
        lat,
        lng,
        speed,
        heading,
      },
    })

    // Update trip status if needed
    if (trip.status === 'ASSIGNED') {
      await prisma.trip.update({ where: { id: req.params.tripId as string }, data: { status: 'IN_PROGRESS' } })
    }

    broadcastToTrip(trip.id, {
      type: 'tracking_update',
      lat,
      lng,
      speed,
      heading,
      recordedAt: log.recordedAt.toISOString(),
    })

    res.status(201).json({ data: log })
  } catch (err) {
    next(err)
  }
})

export { router as trackingRouter }
