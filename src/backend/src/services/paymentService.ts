import { prisma } from '../models/prisma.js'
import { config } from '../config/index.js'
import { errors } from '../utils/errors.js'
import { mercadopagoService } from './mercadopagoService.js'
import { notificationService } from './notificationService.js'

// Redondeo a centavos: los montos viven en Float (Double) — esto evita el
// drift de coma flotante. Migración a Decimal pendiente para producción.
const round2 = (n: number) => Math.round(n * 100) / 100

export const paymentService = {
  async createHold(tripId: string, driverId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { user: { select: { id: true, email: true } } },
    })
    if (!trip) throw errors.notFound('Trip')

    const auction = await prisma.auction.findUnique({ where: { tripId } })
    if (!auction) throw errors.notFound('Auction for this trip')

    const amount = round2(auction.currentPrice)
    const platformFee = round2(amount * config.payment.platformFeePercent)
    const netAmount = round2(amount - platformFee)
    const holdExpiresAt = new Date(Date.now() + config.payment.holdDurationHours * 60 * 60 * 1000)

    // Con MercadoPago configurado el pago nace PENDING y pasa a HELD cuando
    // la empresa paga (webhook). Sin credenciales: modo simulado, HELD directo.
    const useMP = mercadopagoService.isConfigured()

    const payment = await prisma.payment.create({
      data: {
        tripId,
        userId: driverId,
        amount,
        platformFee,
        netAmount,
        status: useMP ? 'PENDING' : 'HELD',
        holdExpiresAt,
      },
    })

    if (useMP) {
      try {
        const preference = await mercadopagoService.createPreference({
          paymentId: payment.id,
          title: `Flete ${trip.originAddress} → ${trip.destAddress}`,
          amount,
          payerEmail: trip.user.email,
        })
        const updated = await prisma.payment.update({
          where: { id: payment.id },
          data: { mercadopagoId: preference.id, paymentUrl: preference.initPoint },
        })
        await notificationService.createInApp(
          trip.userId,
          'PAYMENT_PENDING',
          'Pagá el viaje para confirmar al transportista',
          `El pago de ${amount} ARS queda en custodia hasta que confirmes la entrega`,
          { tripId, paymentId: payment.id, paymentUrl: preference.initPoint }
        )
        return updated
      } catch (err) {
        console.error('[MP] No se pudo crear la preferencia de pago:', err)
      }
    }

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