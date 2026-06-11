import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../models/prisma.js'
import { config } from '../config/index.js'
import { errors } from '../utils/errors.js'
import { mercadopagoService } from '../services/mercadopagoService.js'
import { notificationService } from '../services/notificationService.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// POST /payments/webhook — notificaciones de MercadoPago (sin auth: las
// llama MP; se valida la firma x-signature si hay webhook secret)
router.post('/webhook', async (req, res) => {
  try {
    const dataId =
      (req.query['data.id'] as string | undefined) ??
      (req.body as { data?: { id?: string } })?.data?.id
    const type = (req.query.type as string | undefined) ?? (req.body as { type?: string })?.type

    // MP reintenta si no respondemos 200; los eventos que no son de pago se ignoran
    if (type !== 'payment' || !dataId) {
      res.sendStatus(200)
      return
    }

    const validSignature = mercadopagoService.verifyWebhookSignature({
      signature: req.headers['x-signature'] as string | undefined,
      requestId: req.headers['x-request-id'] as string | undefined,
      dataId,
    })
    if (!validSignature) {
      res.sendStatus(401)
      return
    }

    const mpPayment = await mercadopagoService.getPayment(dataId)
    if (!mpPayment.external_reference) {
      res.sendStatus(200)
      return
    }

    const payment = await prisma.payment.findUnique({
      where: { id: mpPayment.external_reference },
      include: { trip: { select: { id: true, userId: true, originAddress: true, destAddress: true } } },
    })
    if (!payment) {
      res.sendStatus(200)
      return
    }

    // approved → el dinero queda en custodia (HELD) hasta confirmar la entrega
    if (mpPayment.status === 'approved' && payment.status === 'PENDING') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'HELD', mercadopagoStatus: mpPayment.status },
      })
      await notificationService.createInApp(
        payment.userId,
        'PAYMENT_HELD',
        'La empresa pagó el viaje',
        `El pago de ${payment.amount} ARS quedó en custodia. Se libera al confirmar la entrega`,
        { tripId: payment.tripId, paymentId: payment.id }
      )
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { mercadopagoStatus: mpPayment.status },
      })
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('[MP] Error procesando webhook:', err)
    // 500 para que MP reintente
    res.sendStatus(500)
  }
})

// POST /payments/hold — crear hold de pago al asignar transportista
router.post('/hold', authenticate, async (req, res, next) => {
  try {
    const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.body)

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { auction: true },
    })
    if (!trip) return next(errors.notFound('Trip'))
    if (trip.userId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return next(errors.forbidden('Only the trip owner can hold a payment'))
    }
    if (trip.status !== 'AUCTION') return next(errors.badRequest('Trip must be in AUCTION status'))

    const amount = new Prisma.Decimal(trip.auction!.currentPrice).toDecimalPlaces(2)
    const platformFee = amount.mul(config.payment.platformFeePercent).toDecimalPlaces(2)
    const netAmount = amount.minus(platformFee)
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

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) return next(errors.notFound('Trip'))
    if (trip.userId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return next(errors.forbidden('Only the trip owner can release a payment'))
    }

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

// GET /payments/:tripId — solo la empresa dueña del viaje, el transportista
// que cobra o un admin pueden ver los montos
router.get('/:tripId', authenticate, async (req, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { tripId: req.params.tripId as string },
      include: { trip: { select: { userId: true } } },
    })
    if (!payment) return next(errors.notFound('Payment'))

    const requester = req.user!.sub
    const isParty = payment.trip.userId === requester || payment.userId === requester
    if (!isParty && req.user!.role !== 'ADMIN') return next(errors.forbidden())

    const { trip: _trip, ...data } = payment
    res.json({ data })
  } catch (err) {
    next(err)
  }
})

export { router as paymentsRouter }
