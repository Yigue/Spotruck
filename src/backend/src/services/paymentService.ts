import { prisma } from '../models/prisma.js'
import { config } from '../config/index.js'
import { errors } from '../utils/errors.js'

export const paymentService = {
  async createHold(tripId: string, driverId: string) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) throw errors.notFound('Trip')

    const auction = await prisma.auction.findUnique({ where: { tripId } })
    if (!auction) throw errors.notFound('Auction for this trip')

    const amount = auction.currentPrice
    const platformFee = amount * config.payment.platformFeePercent
    const netAmount = amount - platformFee
    const holdExpiresAt = new Date(Date.now() + config.payment.holdDurationHours * 60 * 60 * 1000)

    const payment = await prisma.payment.create({
      data: {
        tripId,
        userId: driverId,
        amount,
        platformFee,
        netAmount,
        status: 'HELD',
        holdExpiresAt,
      },
    })

    return payment
  },

  async releasePayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) throw errors.notFound('Payment')
    if (payment.status !== 'HELD') throw errors.badRequest('Payment is not HELD')

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'RELEASED' },
    })

    await prisma.trip.update({ where: { id: payment.tripId }, data: { status: 'SETTLED' } })

    return updated
  },

  async calculatePenalty(tripId: string, _cancellerRole: string, hoursBefore: number) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) throw errors.notFound('Trip')

    let penaltyPercent: number
    if (hoursBefore > 48) {
      penaltyPercent = 0.10
    } else if (hoursBefore >= 24) {
      penaltyPercent = 0.20
    } else {
      penaltyPercent = 0.30
    }

    return trip.basePrice * penaltyPercent
  },

  async processRefund(paymentId: string, _reason: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) throw errors.notFound('Payment')

    let updated: Awaited<ReturnType<typeof prisma.payment.update>>
    if (payment.status === 'HELD') {
      updated = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      })
    } else if (payment.status === 'DISPUTED') {
      updated = await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      })
    } else {
      throw errors.badRequest('Only HELD or DISPUTED payments can be refunded')
    }

    return updated
  },
}