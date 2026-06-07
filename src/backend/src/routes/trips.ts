import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

const createTripSchema = z.object({
  originAddress: z.string().min(1),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destAddress: z.string().min(1),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  cargoType: z.enum(['BULK', 'PALLETS', 'GENERAL', 'REFRIGERATED']),
  cargoDesc: z.string().optional(),
  weightKg: z.number().positive().optional(),
  scheduledDate: z.string().datetime(),
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
        user: { select: { id: true, companyName: true, ratingAvg: true } },
        auction: {
          include: {
            bids: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: { user: { select: { id: true, companyName: true, ratingAvg: true } } },
            },
          },
        },
        trackingLogs: { orderBy: { recordedAt: 'desc' }, take: 100 },
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
        userId: req.user!.sub,
        originAddress: data.originAddress,
        originLat: data.originLat,
        originLng: data.originLng,
        destAddress: data.destAddress,
        destLat: data.destLat,
        destLng: data.destLng,
        cargoType: data.cargoType,
        cargoDesc: data.cargoDesc,
        weightKg: data.weightKg,
        scheduledDate: new Date(data.scheduledDate),
        basePrice: data.basePrice,
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

export { router as tripsRouter }
