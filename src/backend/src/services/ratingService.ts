import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'

export const ratingService = {
  async submitRating(data: {
    tripId: string
    fromUserId: string
    toUserId: string
    score: number
    punctuality?: number
    communication?: number
    cargoCondition?: number
    comment?: string
  }) {
    if (data.fromUserId === data.toUserId) {
      throw errors.badRequest('Cannot rate yourself')
    }

    const existing = await prisma.rating.findUnique({
      where: { tripId_fromUserId: { tripId: data.tripId, fromUserId: data.fromUserId } },
    })
    if (existing) throw errors.conflict('Already rated this trip')

    const rating = await prisma.rating.create({
      data: {
        tripId: data.tripId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        score: data.score,
        punctuality: data.punctuality,
        communication: data.communication,
        cargoCondition: data.cargoCondition,
        comment: data.comment,
      },
    })

    // Recalculate target user's ratingAvg
    const allRatings = await prisma.rating.findMany({ where: { toUserId: data.toUserId } })
    const avg = allRatings.reduce((sum: number, r: { score: number }) => sum + r.score, 0) / allRatings.length

    await prisma.user.update({
      where: { id: data.toUserId },
      data: { ratingAvg: avg, ratingCount: allRatings.length },
    })

    return rating
  },

  async getUserRatings(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { toUserId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: { select: { id: true, companyName: true, ratingAvg: true } },
          trip: { select: { id: true, originAddress: true, destAddress: true, scheduledDate: true } },
        },
      }),
      prisma.rating.count({ where: { toUserId: userId } }),
    ])

    return { data: ratings, meta: { total, page, limit } }
  },

  async calculateTrustScore(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw errors.notFound('User')

    const ratingCount = user.ratingCount
    const ratingAvg = user.ratingAvg
    const tripsCompleted = user.tripsCompleted

    // Elo-like formula: (ratingCount * ratingAvg / 5 + tripsCompleted * 0.1) / (ratingCount + 1)
    const trust = (ratingCount * ratingAvg / 5 + tripsCompleted * 0.1) / (ratingCount + 1)

    // Clamp 0-1
    const clamped = Math.min(1, Math.max(0, trust))

    await prisma.user.update({ where: { id: userId }, data: { trustScore: clamped } })

    return clamped
  },
}