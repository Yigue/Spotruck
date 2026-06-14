import { Prisma } from '@prisma/client'
import { prisma } from '../models/prisma.js'
import { config } from '../config/index.js'
import { errors } from '../utils/errors.js'
import { paymentService } from './paymentService.js'
import { notificationService } from './notificationService.js'
import { broadcastToAuction, broadcastToTrip } from '../websocket/index.js'

export const auctionService = {
  async startAuction(tripId: string) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) throw errors.notFound('Trip')
    if (trip.status !== 'OPEN') throw errors.badRequest('Trip must be OPEN to start auction')

    const auction = await prisma.auction.create({
      data: {
        tripId,
        currentPrice: trip.basePrice,
        status: 'PENDING',
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    await prisma.trip.update({ where: { id: tripId }, data: { status: 'AUCTION' } })

    return auction
  },

  async closeAuction(auctionId: string) {
    // Lock optimista: evita la adjudicación simultánea con la aceptación
    // manual de la empresa (o un cierre doble del cron)
    const locked = await prisma.auction.updateMany({
      where: { id: auctionId, status: 'OPEN' },
      data: { status: 'SETTLED' },
    })
    if (locked.count === 0) throw errors.badRequest('Auction is not OPEN')

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { trip: true, bids: { orderBy: { amount: 'asc' } } },
    })
    if (!auction) throw errors.notFound('Auction')

    let winnerId: string | null = null
    let winningAmount: Prisma.Decimal | null = null
    let winningBidId: string | null = null

    if (auction.type === 'OPEN' || auction.type === 'SEALED') {
      // Reverse auction: lowest price wins. SEALED also uses lowest.
      const winningBid = auction.bids[0] // sorted ASC, lowest first
      if (winningBid) {
        if (auction.reservePrice && new Prisma.Decimal(winningBid.amount).gt(auction.reservePrice)) {
          // Reserve not met - no winner
        } else {
          winnerId = winningBid.userId
          winningAmount = winningBid.amount
          winningBidId = winningBid.id
        }
      }
    } else if (auction.type === 'DUTCH') {
      // Dutch auction: first to accept the descending price wins
      const winningBid = auction.bids[auction.bids.length - 1] // last bid (first acceptance in dutch)
      if (winningBid) {
        winnerId = winningBid.userId
        winningAmount = winningBid.amount
        winningBidId = winningBid.id
      }
    }

    if (winningBidId) {
      await prisma.$transaction([
        prisma.bid.update({ where: { id: winningBidId }, data: { status: 'ACCEPTED' } }),
        prisma.bid.updateMany({
          where: { auctionId, id: { not: winningBidId }, status: 'PENDING' },
          data: { status: 'REJECTED' },
        }),
      ])
    }

    if (winnerId && winningAmount !== null) {
      // currentPrice = monto ganador (createHold lo usa para calcular el pago)
      await prisma.auction.update({
        where: { id: auctionId },
        data: { currentPrice: winningAmount },
      })
      // Lógica de pago unificada en paymentService (misma que la aceptación manual)
      await paymentService.createHold(auction.tripId, winnerId)
      await prisma.trip.update({ where: { id: auction.tripId }, data: { status: 'ASSIGNED' } })
    } else {
      // Venció sin adjudicar (sin ofertas o sin alcanzar la reserva): el viaje
      // no puede quedar zombie en AUCTION — se cancela y se avisa a la empresa
      await prisma.bid.updateMany({
        where: { auctionId, status: 'PENDING' },
        data: { status: 'REJECTED' },
      })
      await prisma.trip.update({ where: { id: auction.tripId }, data: { status: 'CANCELLED' } })
      await notificationService.createInApp(
        auction.trip.userId,
        'AUCTION_CLOSED',
        'Tu publicación venció sin adjudicar',
        auction.bids.length === 0
          ? `${auction.trip.originAddress} → ${auction.trip.destAddress} no recibió ofertas. Podés crear una nueva publicación ajustando el precio o las fechas`
          : 'Las ofertas no alcanzaron el precio de reserva. Podés volver a publicar el viaje',
        { tripId: auction.tripId }
      )
      broadcastToTrip(auction.tripId, { type: 'trip_update', status: 'CANCELLED' })
    }

    broadcastToAuction(auctionId, { status: 'SETTLED', winnerId, winningAmount })
    if (winnerId) broadcastToTrip(auction.tripId, { type: 'trip_update', status: 'ASSIGNED' })

    return { auctionId, winnerId, winningAmount }
  },

  async processBid(auctionId: string, userId: string, amount: number) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { trip: true },
    })
    if (!auction) throw errors.notFound('Auction')
    if (auction.status !== 'OPEN') throw errors.badRequest('Auction is not open')

    const now = new Date()
    if (now > auction.endTime) throw errors.badRequest('Auction has ended')

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw errors.notFound('User')
    if (user.role !== 'DRIVER') throw errors.forbidden('Only drivers can bid')

    if (new Prisma.Decimal(auction.currentPrice).lte(amount)) {
      throw errors.badRequest(`Bid must be lower than current price ${auction.currentPrice}`)
    }

    // Anti-sniping: extend if time remaining < 5min and extensionCount < maxExtensions
    const timeRemaining = auction.endTime.getTime() - now.getTime()
    const antiSnipingWindowMs = config.auction.antiSnipingWindowMinutes * 60 * 1000
    let newEndTime = auction.endTime

    if (timeRemaining < antiSnipingWindowMs && auction.extensionCount < config.auction.maxExtensions) {
      const extensionMs = config.auction.antiSnipingExtensionMinutes * 60 * 1000
      newEndTime = new Date(now.getTime() + extensionMs)
    }

    const [bid] = await prisma.$transaction([
      prisma.bid.create({ data: { auctionId, userId, amount } }),
      prisma.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: amount,
          endTime: newEndTime,
          extensionCount: { increment: newEndTime > auction.endTime ? 1 : 0 },
        },
      }),
    ])

    return bid
  },

  // Recalcula el precio de las subastas holandesas abiertas según el tiempo
  // transcurrido (basePrice → reservePrice de forma lineal). Determinístico:
  // el precio depende del reloj, no de la frecuencia del tick.
  async tickDutchAuctions() {
    const now = new Date()
    const auctions = await prisma.auction.findMany({
      where: { status: 'OPEN', type: 'DUTCH' },
      include: { trip: { select: { basePrice: true } } },
    })

    for (const a of auctions) {
      const start = a.startTime.getTime()
      const end = a.endTime.getTime()
      if (end <= start) continue
      const base = new Prisma.Decimal(a.trip.basePrice)
      const floor = a.reservePrice ? new Prisma.Decimal(a.reservePrice) : base.mul(0.5)
      const ratio = Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)))
      const newPrice = base.minus(base.minus(floor).mul(ratio)).toDecimalPlaces(2)

      if (!newPrice.equals(a.currentPrice)) {
        await prisma.auction.update({ where: { id: a.id }, data: { currentPrice: newPrice } })
        broadcastToAuction(a.id, {
          currentPrice: newPrice.toNumber(),
          endTime: a.endTime.toISOString(),
        })
      }
    }
  },

  async getAuctionStatus(auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        trip: true,
        _count: { select: { bids: true } },
        bids: {
          orderBy: { amount: 'asc' },
          take: 1,
          include: { user: { select: { id: true, companyName: true } } },
        },
      },
    })
    if (!auction) throw errors.notFound('Auction')

    const now = new Date()
    const timeRemaining = Math.max(0, auction.endTime.getTime() - now.getTime())

    return {
      ...auction,
      timeRemainingMs: timeRemaining,
      currentWinner: auction.bids[0]?.user ?? null,
    }
  },
}