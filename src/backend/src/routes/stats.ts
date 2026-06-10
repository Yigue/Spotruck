import { Router } from 'express'
import { prisma } from '../models/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const MONTHS_BACK = 6

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function lastMonths(n: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  return keys
}

// GET /stats/me — estadísticas y gráficos según el rol
// ("Estadísticas y Gráficos" era un beneficio prometido del proyecto original)
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.sub
    const since = new Date()
    since.setMonth(since.getMonth() - (MONTHS_BACK - 1))
    since.setDate(1)
    since.setHours(0, 0, 0, 0)

    const months = lastMonths(MONTHS_BACK)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, ratingAvg: true, ratingCount: true, tripsCompleted: true, trustScore: true },
    })

    if (user?.role === 'DRIVER') {
      const [bidsByStatus, releasedPayments, ratings] = await Promise.all([
        prisma.bid.groupBy({
          by: ['status'],
          where: { userId },
          _count: { _all: true },
        }),
        prisma.payment.findMany({
          where: { userId, status: 'RELEASED', createdAt: { gte: since } },
          select: { netAmount: true, createdAt: true },
        }),
        prisma.rating.findMany({
          where: { toUserId: userId },
          select: { score: true },
        }),
      ])

      const bids = Object.fromEntries(bidsByStatus.map((b) => [b.status, b._count._all]))
      const bidsTotal = Object.values(bids).reduce((a, b) => a + b, 0)

      const incomeByMonth = months.map((m) => ({
        month: m,
        amount: releasedPayments
          .filter((p) => monthKey(p.createdAt) === m)
          .reduce((sum, p) => sum + p.netAmount, 0),
        trips: releasedPayments.filter((p) => monthKey(p.createdAt) === m).length,
      }))

      const scoreDistribution = [1, 2, 3, 4, 5].map((s) => ({
        score: s,
        count: ratings.filter((r) => Math.round(r.score) === s).length,
      }))

      res.json({
        data: {
          role: 'DRIVER',
          kpis: {
            tripsCompleted: user.tripsCompleted,
            ratingAvg: user.ratingAvg,
            ratingCount: user.ratingCount,
            trustScore: user.trustScore,
            bidsTotal,
            bidsAccepted: bids.ACCEPTED ?? 0,
            acceptanceRate: bidsTotal > 0 ? (bids.ACCEPTED ?? 0) / bidsTotal : 0,
            totalIncome: releasedPayments.reduce((sum, p) => sum + p.netAmount, 0),
          },
          incomeByMonth,
          bidsByStatus: bids,
          scoreDistribution,
        },
      })
      return
    }

    // COMPANY (y ADMIN ve sus propios datos como empresa)
    const [trips, payments, ratings] = await Promise.all([
      prisma.trip.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true, cargoType: true, status: true, distanceKm: true },
      }),
      prisma.payment.findMany({
        where: { trip: { userId }, status: { in: ['HELD', 'RELEASED'] }, createdAt: { gte: since } },
        select: { amount: true, createdAt: true },
      }),
      prisma.rating.findMany({
        where: { toUserId: userId },
        select: { score: true },
      }),
    ])

    const tripsByMonth = months.map((m) => ({
      month: m,
      trips: trips.filter((t) => monthKey(t.createdAt) === m).length,
      spend: payments
        .filter((p) => monthKey(p.createdAt) === m)
        .reduce((sum, p) => sum + p.amount, 0),
    }))

    const byCargoType = ['BULK', 'PALLETS', 'GENERAL', 'REFRIGERATED'].map((type) => ({
      type,
      count: trips.filter((t) => t.cargoType === type).length,
    }))

    const scoreDistribution = [1, 2, 3, 4, 5].map((s) => ({
      score: s,
      count: ratings.filter((r) => Math.round(r.score) === s).length,
    }))

    res.json({
      data: {
        role: 'COMPANY',
        kpis: {
          tripsPublished: trips.length,
          tripsSettled: trips.filter((t) => t.status === 'SETTLED').length,
          totalSpend: payments.reduce((sum, p) => sum + p.amount, 0),
          totalKm: trips.reduce((sum, t) => sum + (t.distanceKm ?? 0), 0),
          ratingAvg: user?.ratingAvg ?? 0,
          ratingCount: user?.ratingCount ?? 0,
        },
        tripsByMonth,
        byCargoType,
        scoreDistribution,
      },
    })
  } catch (err) {
    next(err)
  }
})

export { router as statsRouter }
