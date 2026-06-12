import { Prisma } from '@prisma/client'
import { config } from '../config/index.js'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { paymentService } from './paymentService.js'
import { notificationService } from './notificationService.js'
import { broadcastToAuction, broadcastToTrip } from '../websocket/index.js'

export const bidService = {
  async getMyBids(userId: string, page = 1, limit = 20, status?: string) {
    const where: any = { userId }
    if (status) where.status = status

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          auction: {
            include: {
              trip: {
                select: { id: true, originAddress: true, destAddress: true, scheduledDate: true, status: true, cargoType: true, basePrice: true }
              }
            }
          },
          truck: { select: { id: true, plate: true, type: true } }
        }
      }),
      prisma.bid.count({ where })
    ])
    return { data: bids, meta: { total, page, limit } }
  },

  async withdrawBid(bidId: string, userId: string) {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { auction: true }
    })
    if (!bid) throw errors.notFound('Bid')
    if (bid.userId !== userId) throw errors.forbidden('Not your bid')
    if (bid.status !== 'PENDING') throw errors.badRequest('Only PENDING bids can be withdrawn')
    if (bid.auction.status !== 'OPEN') throw errors.badRequest('Auction is not OPEN')

    const updated = await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'WITHDRAWN' }
    })
    return updated
  },

  async modifyBid(bidId: string, userId: string, amount?: number, note?: string) {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { auction: true }
    })
    if (!bid) throw errors.notFound('Bid')
    if (bid.userId !== userId) throw errors.forbidden('Not your bid')
    if (bid.status !== 'PENDING') throw errors.badRequest('Only PENDING bids can be modified')
    if (bid.auction.status !== 'OPEN') throw errors.badRequest('Auction is not OPEN')

    const auction = bid.auction
    const now = new Date()
    if (now > auction.endTime) throw errors.badRequest('Auction has ended')

    let newEndTime = auction.endTime
    let currentPriceToUpdate: number | undefined = undefined
    let extensionCountIncrement = 0

    if (amount !== undefined && amount !== Number(bid.amount)) {
      const minBid = new Prisma.Decimal(auction.currentPrice).mul(1 - config.auction.minBidDecrementPercent)
      if (minBid.lte(amount)) {
        throw errors.badRequest(`Bid amount must be lower than ${minBid.toNumber()}`)
      }

      const timeRemaining = auction.endTime.getTime() - now.getTime()
      const antiSnipingWindowMs = config.auction.antiSnipingWindowMinutes * 60 * 1000

      if (timeRemaining < antiSnipingWindowMs && auction.extensionCount < config.auction.maxExtensions) {
        const extensionMs = config.auction.antiSnipingExtensionMinutes * 60 * 1000
        newEndTime = new Date(now.getTime() + extensionMs)
        extensionCountIncrement = 1
      }
      currentPriceToUpdate = amount
    }

    const [updatedBid] = await prisma.$transaction([
      prisma.bid.update({
        where: { id: bidId },
        data: {
          ...(amount !== undefined && { amount }),
          ...(note !== undefined && { note })
        }
      }),
      ...(currentPriceToUpdate !== undefined ? [
        prisma.auction.update({
          where: { id: auction.id },
          data: {
            currentPrice: currentPriceToUpdate,
            endTime: newEndTime,
            extensionCount: { increment: extensionCountIncrement }
          }
        })
      ] : [])
    ])

    if (currentPriceToUpdate !== undefined) {
      broadcastToAuction(auction.id, {
        currentPrice: currentPriceToUpdate,
        endTime: newEndTime.toISOString(),
        bidId: bid.id
      })
    }

    return updatedBid
  },

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

    // Lock optimista: solo un proceso (aceptación manual o cron de cierre)
    // puede adjudicar la subasta — evita pagos duplicados
    const locked = await prisma.auction.updateMany({
      where: { id: bid.auctionId, status: 'OPEN' },
      data: { status: 'SETTLED', currentPrice: bid.amount },
    })
    if (locked.count === 0) throw errors.conflict('La subasta ya fue cerrada o adjudicada')

    await prisma.$transaction([
      prisma.bid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } }),
      prisma.bid.updateMany({
        where: { auctionId: bid.auctionId, id: { not: bidId }, status: 'PENDING' },
        data: { status: 'REJECTED' },
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
