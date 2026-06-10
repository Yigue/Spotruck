import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { paymentService } from './paymentService.js'
import { notificationService } from './notificationService.js'
import { broadcastToAuction, broadcastToTrip } from '../websocket/index.js'

export const bidService = {
  // La empresa acepta una oferta: cierra la subasta, rechaza el resto,
  // asigna el viaje y crea el hold de pago (flujo "Aceptar/Rechazar" de la app original)
  async acceptBid(bidId: string, requesterId: string, requesterRole: string) {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { auction: { include: { trip: true } } },
    })
    if (!bid) throw errors.notFound('Bid')

    const trip = bid.auction.trip
    if (trip.userId !== requesterId && requesterRole !== 'ADMIN') {
      throw errors.forbidden('Not your trip')
    }
    if (bid.status !== 'PENDING') throw errors.badRequest('Bid is not PENDING')
    if (bid.auction.status !== 'OPEN') throw errors.badRequest('Auction is not OPEN')

    await prisma.$transaction([
      prisma.bid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } }),
      prisma.bid.updateMany({
        where: { auctionId: bid.auctionId, id: { not: bidId }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      }),
      prisma.auction.update({
        where: { id: bid.auctionId },
        data: { status: 'SETTLED', currentPrice: bid.amount },
      }),
      prisma.trip.update({ where: { id: trip.id }, data: { status: 'ASSIGNED' } }),
    ])

    const payment = await paymentService.createHold(trip.id, bid.userId)

    broadcastToAuction(bid.auctionId, { status: 'SETTLED', currentPrice: bid.amount })
    broadcastToTrip(trip.id, { type: 'trip_update', status: 'ASSIGNED' })

    await notificationService.createInApp(
      bid.userId,
      'BID_ACCEPTED',
      '¡Tu oferta fue aceptada!',
      `Te asignaron el viaje ${trip.originAddress} → ${trip.destAddress} por ${bid.amount} ARS`,
      { tripId: trip.id, bidId: bid.id }
    )
    const rejected = await prisma.bid.findMany({
      where: { auctionId: bid.auctionId, status: 'REJECTED' },
      select: { id: true, userId: true },
    })
    for (const r of rejected) {
      await notificationService.createInApp(
        r.userId,
        'BID_REJECTED',
        'Tu oferta no fue seleccionada',
        `La empresa eligió otro transportista para ${trip.originAddress} → ${trip.destAddress}`,
        { tripId: trip.id, bidId: r.id }
      )
    }

    return { bid: { ...bid, status: 'ACCEPTED' as const }, payment }
  },

  async rejectBid(bidId: string, requesterId: string, requesterRole: string) {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { auction: { include: { trip: true } } },
    })
    if (!bid) throw errors.notFound('Bid')

    const trip = bid.auction.trip
    if (trip.userId !== requesterId && requesterRole !== 'ADMIN') {
      throw errors.forbidden('Not your trip')
    }
    if (bid.status !== 'PENDING') throw errors.badRequest('Bid is not PENDING')

    const updated = await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'REJECTED' },
    })

    await notificationService.createInApp(
      bid.userId,
      'BID_REJECTED',
      'Tu oferta fue rechazada',
      `La empresa rechazó tu oferta para ${trip.originAddress} → ${trip.destAddress}`,
      { tripId: trip.id, bidId: bid.id }
    )

    return updated
  },
}
