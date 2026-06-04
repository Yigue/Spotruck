import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { config } from '../config/index.js'
import { errors } from '../utils/errors.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// POST /payments/hold — crear hold de pago al asignar transportista
router.post('/hold', authenticate, async (req, res, next) => {
  try {
    const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.body)

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { auction: true },
    })
    if (!trip) return next(errors.notFound('Trip'))
    if (trip.status !== 'AUCTION') return next(errors.badRequest('Trip must be in AUCTION status'))

    const amount = trip.auction!.currentPrice
    const platformFee = amount * config.payment.platformFeePercent
    const netAmount = amount - platformFee
    const holdExpiresAt = new Date(Date.now() + config.payment.holdDurationHours * 60 * 60 * 1000)

    const payment = await prisma.payment.create({
      data: {
        tripId,
        userId: req.user!.sub,
        amount,
        platformFee,
        netAmount,
        status: 'HELD',
        holdExpiresAt,
      },
    })

    res.status(201).json({ data: payment })
  } catch (err) {
    next(err)
  }
})

// POST /payments/release — liberar pago post-entrega
router.post('/release', authenticate, async (req, res, next) => {
  try {
    const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.body)

    const payment = await prisma.payment.findFirst({
      where: { tripId, status: 'HELD' },
    })
    if (!payment) return next(errors.notFound('Held payment for this trip'))

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'RELEASED' },
    })

    await prisma.trip.update({ where: { id: tripId }, data: { status: 'SETTLED' } })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// GET /payments/:tripId
router.get('/:tripId', authenticate, async (req, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { tripId: req.params.tripId },
    })
    if (!payment) return next(errors.notFound('Payment'))
    res.json({ data: payment })
  } catch (err) {
    next(err)
  }
})

export { router as paymentsRouter }
