import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const createRatingSchema = z.object({
  tripId: z.string().uuid(),
  toUserId: z.string().uuid(),
  score: z.number().min(1).max(5),
  punctuality: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  cargoCondition: z.number().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
})

// POST /ratings
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createRatingSchema.parse(req.body)

    if (req.user!.sub === data.toUserId) {
      return next(errors.badRequest('Cannot rate yourself'))
    }

    const existing = await prisma.rating.findUnique({
      where: { tripId_fromUserId: { tripId: data.tripId, fromUserId: req.user!.sub } },
    })
    if (existing) return next(errors.conflict('Already rated this trip'))

    const [rating] = await prisma.$transaction([
      prisma.rating.create({
        data: {
          tripId: data.tripId,
          fromUserId: req.user!.sub,
          toUserId: data.toUserId,
          score: data.score,
          punctuality: data.punctuality,
          communication: data.communication,
          cargoCondition: data.cargoCondition,
          comment: data.comment,
        },
      }),
      // Update user rating avg
      prisma.user.update({
        where: { id: data.toUserId },
        data: {
          ratingCount: { increment: 1 },
          // Recalculate avg: (oldAvg * oldCount + newScore) / newCount
        },
      }),
    ])

    // Recalculate average
    const stats = await prisma.rating.aggregate({
      where: { toUserId: data.toUserId },
      _avg: { score: true },
      _count: { score: true },
    })
    if (stats._avg.score !== null) {
      await prisma.user.update({
        where: { id: data.toUserId },
        data: { ratingAvg: stats._avg.score },
      })
    }

    res.status(201).json({ data: rating })
  } catch (err) {
    next(err)
  }
})

// GET /ratings/user/:userId
router.get('/user/:userId', authenticate, async (req, res, next) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { toUserId: req.params.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        fromUser: { select: { id: true, companyName: true, role: true } },
        trip: { select: { id: true, originAddress: true, destAddress: true } },
      },
    })
    res.json({ data: ratings })
  } catch (err) {
    next(err)
  }
})

export { router as ratingsRouter }
