import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { config } from '../config/index.js'
import { errors } from '../utils/errors.js'
import { notificationService } from '../services/notificationService.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

const createAuctionSchema = z.object({
  tripId: z.string().uuid(),
  type: z.enum(['OPEN', 'DUTCH', 'SEALED']).default('OPEN'),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  reservePrice: z.number().positive().optional(),
})

const bidSchema = z.object({
  amount: z.number().positive(),
  note: z.string().max(500).optional(),
  truckId: z.string().uuid().optional(),
})

// GET /auctions
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, type, page = '1', limit = '20' } = req.query
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (type) where.type = type

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { startTime: 'desc' },
        include: {
          trip: {
            select: { id: true, originAddress: true, destAddress: true, cargoType: true, basePrice: true, scheduledDate: true },
          },
          _count: { select: { bids: true } },
        },
      }),
      prisma.auction.count({ where }),
    ])

    res.json({ data: auctions, meta: { total, page: Number(page), limit: Number(limit) } })
  } catch (err) {
    next(err)
  }
})

// GET /auctions/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id as string },
      include: {
        trip: {
          include: { user: { select: { id: true, companyName: true, ratingAvg: true } } },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, companyName: true, ratingAvg: true, ratingCount: true, phone: true, tripsCompleted: true } },
            truck: { select: { id: true, plate: true, type: true, capacityKg: true } },
          },
        },
      },
    })
    if (!auction) return next(errors.notFound('Auction'))
    res.json({ data: auction })
  } catch (err) {
    next(err)
  }
})

// POST /auctions
router.post('/', authenticate, requireRole('COMPANY', 'ADMIN'), async (req, res, next) => {
  try {
    const data = createAuctionSchema.parse(req.body)

    const trip = await prisma.trip.findUnique({ where: { id: data.tripId } })
    if (!trip) return next(errors.notFound('Trip'))
    if (trip.userId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return next(errors.forbidden('Not your trip'))
    }
    if (trip.status !== 'OPEN') return next(errors.badRequest('Trip must be OPEN to create auction'))

    const now = new Date()
    const auction = await prisma.auction.create({
      data: {
        tripId: data.tripId,
        type: data.type,
        startTime: data.startTime ? new Date(data.startTime!) : now,
        endTime: data.endTime ? new Date(data.endTime!) : new Date(now.getTime() + 24 * 60 * 60 * 1000),
        reservePrice: data.reservePrice ?? trip.basePrice * 0.9,
        currentPrice: trip.basePrice,
        status: 'OPEN',
      },
    })

    await prisma.trip.update({ where: { id: data.tripId }, data: { status: 'AUCTION' } })

    res.status(201).json({ data: auction })
  } catch (err) {
    next(err)
  }
})

// POST /auctions/:id/bid
router.post('/:id/bid', authenticate, requireRole('DRIVER'), async (req, res, next) => {
  try {
    const { amount, note, truckId } = bidSchema.parse(req.body)
    const auctionId = req.params.id as string

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { trip: true },
    })
    if (!auction) return next(errors.notFound('Auction'))
    if (auction.status !== 'OPEN') return next(errors.badRequest('Auction is not open'))
    if (new Date() > auction.endTime) return next(errors.badRequest('Auction has ended'))

    const minBid = auction.currentPrice * (1 - config.auction.minBidDecrementPercent)
    if (amount >= minBid) return next(errors.badRequest(`Bid must be lower than ${minBid}`))

    if (truckId) {
      const truck = await prisma.truck.findUnique({ where: { id: truckId } })
      if (!truck || truck.ownerId !== req.user!.sub) return next(errors.badRequest('Invalid truck'))
      if (!truck.active) return next(errors.badRequest('Truck is not active'))
      if (auction.trip.weightKg && truck.capacityKg < auction.trip.weightKg) {
        return next(errors.badRequest('Truck capacity is below the cargo weight'))
      }
    }

    // Anti-sniping extension
    const now = new Date()
    const timeLeft = auction.endTime.getTime() - now.getTime()
    const antiSnipingWindow = config.auction.antiSnipingWindowMinutes * 60 * 1000

    let newEndTime = auction.endTime
    if (timeLeft < antiSnipingWindow && auction.extensionCount < config.auction.maxExtensions) {
      newEndTime = new Date(now.getTime() + config.auction.antiSnipingExtensionMinutes * 60 * 1000)
    }

    const [bid] = await prisma.$transaction([
      prisma.bid.create({ data: { auctionId, userId: req.user!.sub, amount, note, truckId } }),
      prisma.auction.update({
        where: { id: auctionId },
        data: { currentPrice: amount, endTime: newEndTime, extensionCount: { increment: newEndTime > auction.endTime ? 1 : 0 } },
      }),
    ])

    await notificationService.createInApp(
      auction.trip.userId,
      'NEW_BID',
      'Nueva oferta en tu publicación',
      `Un transportista ofreció ${amount} ARS por ${auction.trip.originAddress} → ${auction.trip.destAddress}`,
      { tripId: auction.tripId, auctionId, bidId: bid.id }
    )

    res.status(201).json({ data: bid })
  } catch (err) {
    next(err)
  }
})

// GET /auctions/:id/bids
router.get('/:id/bids', authenticate, async (req, res, next) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { auctionId: req.params.id as string },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, companyName: true, ratingAvg: true, ratingCount: true, phone: true, tripsCompleted: true } },
        truck: { select: { id: true, plate: true, type: true, capacityKg: true } },
      },
    })
    res.json({ data: bids })
  } catch (err) {
    next(err)
  }
})

export { router as auctionsRouter }
