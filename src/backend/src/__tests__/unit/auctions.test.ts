import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: { findUnique: jest.fn() },
    trip: { findUnique: jest.fn(), update: jest.fn() },
    auction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bid: { create: jest.fn(), findMany: jest.fn() },
    payment: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    rating: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
  })),
}))

jest.mock('../config/index.js', () => ({
  config: {
    jwt: { secret: 'test-secret', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
    db: { url: 'postgresql://test' },
    redis: { url: 'redis://localhost:6379' },
    mercadopago: { accessToken: '', webhookSecret: '' },
    auction: {
      antiSnipingWindowMinutes: 5,
      antiSnipingExtensionMinutes: 2,
      minBidDecrementPercent: 0.10,
      maxExtensions: 3,
    },
    payment: { platformFeePercent: 0.08, holdDurationHours: 72 },
  },
}))

import { auctionsRouter } from '../routes/auctions.js'

function mockReq(body = {}, params = {}, query = {}, user = { sub: 'company-1', role: 'COMPANY', email: 'co@example.com' }) {
  return { body, params, query, user }
}

function mockRes() {
  const res: Record<string, jest.Mock> = {}
  res.status = jest.fn().mockReturnThis()
  res.json = jest.fn().mockReturnThis()
  return res as any
}

function mockNext() {
  return jest.fn()
}

describe('AuctionsService', () => {
  let mockPrisma: any

  beforeEach(() => {
    jest.clearAllMocks()
    const { PrismaClient } = require('@prisma/client')
    mockPrisma = new PrismaClient() as any
  })

  describe('GET /auctions', () => {
    it('returns paginated auctions with trip info', async () => {
      const mockAuctions = [
        {
          id: 'auction-1',
          type: 'OPEN',
          status: 'OPEN',
          currentPrice: 45000,
          startTime: new Date(),
          endTime: new Date(),
          trip: { id: 'trip-1', originAddress: 'Buenos Aires', destAddress: 'Córdoba', cargoType: 'GENERAL', basePrice: 50000, scheduledDate: new Date() },
          _count: { bids: 3 },
        },
      ]
      mockPrisma.auction.findMany.mockResolvedValue(mockAuctions)
      mockPrisma.auction.count.mockResolvedValue(1)

      const req = mockReq({}, {}, { page: '1', limit: '20' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({
        data: mockAuctions,
        meta: { total: 1, page: 1, limit: 20 },
      })
    })

    it('filters by status and type', async () => {
      mockPrisma.auction.findMany.mockResolvedValue([])
      mockPrisma.auction.count.mockResolvedValue(0)

      const req = mockReq({}, {}, { status: 'OPEN', type: 'DUTCH' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(mockPrisma.auction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'OPEN', type: 'DUTCH' }),
        })
      )
    })
  })

  describe('GET /auctions/:id', () => {
    it('returns auction with trip and bids', async () => {
      const mockAuction = {
        id: 'auction-1',
        type: 'OPEN',
        status: 'OPEN',
        currentPrice: 45000,
        reservePrice: 40000,
        trip: {
          id: 'trip-1',
          user: { id: 'company-1', companyName: 'Acme', ratingAvg: 4.5 },
        },
        bids: [
          { id: 'bid-1', amount: 45000, user: { id: 'driver-1', companyName: 'Fast', ratingAvg: 4.8 } },
          { id: 'bid-2', amount: 44000, user: { id: 'driver-2', companyName: 'Quick', ratingAvg: 4.6 } },
        ],
      }
      mockPrisma.auction.findUnique.mockResolvedValue(mockAuction)

      const req = mockReq({}, { id: 'auction-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ data: mockAuction })
    })

    it('returns 404 for non-existent auction', async () => {
      mockPrisma.auction.findUnique.mockResolvedValue(null)

      const req = mockReq({}, { id: 'non-existent' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(404)
    })
  })

  describe('POST /auctions', () => {
    it('creates auction for OPEN trip owned by company', async () => {
      const mockTrip = { id: 'trip-1', userId: 'company-1', status: 'OPEN', basePrice: 50000 }
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.auction.create.mockResolvedValue({
        id: 'auction-new',
        tripId: 'trip-1',
        type: 'OPEN',
        currentPrice: 50000,
        reservePrice: 45000,
        status: 'PENDING',
      })
      mockPrisma.trip.update.mockResolvedValue({ ...mockTrip, status: 'AUCTION' })

      const req = mockReq({
        tripId: 'trip-1',
        type: 'OPEN',
        startTime: '2024-12-01T00:00:00Z',
        endTime: '2024-12-02T00:00:00Z',
        reservePrice: 45000,
      })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(mockPrisma.auction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tripId: 'trip-1',
          type: 'OPEN',
          currentPrice: 50000,
          reservePrice: 45000,
          status: 'PENDING',
        }),
      })
      expect(mockPrisma.trip.update).toHaveBeenCalledWith({ where: { id: 'trip-1' }, data: { status: 'AUCTION' } })
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('defaults reservePrice to 90% of trip basePrice', async () => {
      const mockTrip = { id: 'trip-1', userId: 'company-1', status: 'OPEN', basePrice: 50000 }
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.auction.create.mockResolvedValue({
        id: 'auction-new',
        tripId: 'trip-1',
        type: 'OPEN',
        currentPrice: 50000,
        reservePrice: 45000,
        status: 'PENDING',
      })
      mockPrisma.trip.update.mockResolvedValue({ ...mockTrip, status: 'AUCTION' })

      const req = mockReq({
        tripId: 'trip-1',
        type: 'OPEN',
        startTime: '2024-12-01T00:00:00Z',
        endTime: '2024-12-02T00:00:00Z',
        // No reservePrice provided
      })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(mockPrisma.auction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reservePrice: 50000 * 0.9 }),
        })
      )
    })

    it('returns 404 when trip not found', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      const req = mockReq({
        tripId: 'non-existent-trip',
        type: 'OPEN',
        startTime: '2024-12-01T00:00:00Z',
        endTime: '2024-12-02T00:00:00Z',
      })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(404)
    })

    it('returns 403 when trip belongs to different company', async () => {
      const mockTrip = { id: 'trip-1', userId: 'other-company', status: 'OPEN', basePrice: 50000 }
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)

      const req = mockReq({
        tripId: 'trip-1',
        type: 'OPEN',
        startTime: '2024-12-01T00:00:00Z',
        endTime: '2024-12-02T00:00:00Z',
      })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(403)
    })

    it('returns 400 when trip not in OPEN status', async () => {
      const mockTrip = { id: 'trip-1', userId: 'company-1', status: 'DRAFT', basePrice: 50000 }
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)

      const req = mockReq({
        tripId: 'trip-1',
        type: 'OPEN',
        startTime: '2024-12-01T00:00:00Z',
        endTime: '2024-12-02T00:00:00Z',
      })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Trip must be OPEN to create auction')
    })
  })

  describe('POST /auctions/:id/bid', () => {
    it('creates bid lower than current price as DRIVER', async () => {
      const mockAuction = {
        id: 'auction-1',
        status: 'OPEN',
        currentPrice: 45000,
        endTime: new Date(Date.now() + 3600000), // 1 hour from now
        extensionCount: 0,
        trip: { userId: 'company-1' },
      }
      mockPrisma.auction.findUnique.mockResolvedValue(mockAuction)
      mockPrisma.bid.create.mockResolvedValue({ id: 'bid-new', auctionId: 'auction-1', userId: 'driver-1', amount: 44000 })
      mockPrisma.auction.update.mockResolvedValue({ ...mockAuction, currentPrice: 44000 })

      const req = mockReq(
        { amount: 44000 },
        { id: 'auction-1' },
        {},
        { sub: 'driver-1', role: 'DRIVER', email: 'driver@example.com' }
      )
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/:id/bid')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(mockPrisma.bid.create).toHaveBeenCalledWith({
        data: { auctionId: 'auction-1', userId: 'driver-1', amount: 44000 },
      })
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('returns 404 for non-existent auction', async () => {
      mockPrisma.auction.findUnique.mockResolvedValue(null)

      const req = mockReq({ amount: 44000 }, { id: 'non-existent' }, {}, { sub: 'driver-1', role: 'DRIVER', email: 'driver@x.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/:id/bid')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(404)
    })

    it('returns 400 for non-OPEN auction', async () => {
      const mockAuction = { id: 'auction-1', status: 'CLOSED', currentPrice: 45000, endTime: new Date() }
      mockPrisma.auction.findUnique.mockResolvedValue(mockAuction)

      const req = mockReq({ amount: 44000 }, { id: 'auction-1' }, {}, { sub: 'driver-1', role: 'DRIVER', email: 'd@x.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/:id/bid')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Auction is not open')
    })

    it('returns 400 when auction has ended', async () => {
      const mockAuction = {
        id: 'auction-1',
        status: 'OPEN',
        currentPrice: 45000,
        endTime: new Date(Date.now() - 1000), // in the past
        extensionCount: 0,
        trip: { userId: 'company-1' },
      }
      mockPrisma.auction.findUnique.mockResolvedValue(mockAuction)

      const req = mockReq({ amount: 44000 }, { id: 'auction-1' }, {}, { sub: 'driver-1', role: 'DRIVER', email: 'd@x.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/:id/bid')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Auction has ended')
    })

    it('returns 400 when bid is not lower than min allowed', async () => {
      const mockAuction = {
        id: 'auction-1',
        status: 'OPEN',
        currentPrice: 45000,
        endTime: new Date(Date.now() + 3600000),
        extensionCount: 0,
        trip: { userId: 'company-1' },
      }
      mockPrisma.auction.findUnique.mockResolvedValue(mockAuction)

      const req = mockReq({ amount: 50000 }, { id: 'auction-1' }, {}, { sub: 'driver-1', role: 'DRIVER', email: 'd@x.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/:id/bid')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(400)
      expect(err.message).toContain('Bid must be lower than')
    })

    it('extends endTime when bid placed in anti-sniping window', async () => {
      const mockAuction = {
        id: 'auction-1',
        status: 'OPEN',
        currentPrice: 45000,
        endTime: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes from now (within 5 min window)
        extensionCount: 0,
        trip: { userId: 'company-1' },
      }
      mockPrisma.auction.findUnique.mockResolvedValue(mockAuction)
      mockPrisma.bid.create.mockResolvedValue({ id: 'bid-new', auctionId: 'auction-1', userId: 'driver-1', amount: 44000 })
      mockPrisma.auction.update.mockResolvedValue({ ...mockAuction, currentPrice: 44000 })

      const req = mockReq({ amount: 44000 }, { id: 'auction-1' }, {}, { sub: 'driver-1', role: 'DRIVER', email: 'd@x.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/:id/bid')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(mockPrisma.auction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endTime: expect.any(Date),
            extensionCount: expect.any(Number),
          }),
        })
      )
    })
  })

  describe('GET /auctions/:id/bids', () => {
    it('returns bids ordered by creation date descending', async () => {
      const mockBids = [
        { id: 'bid-1', amount: 45000, createdAt: new Date(), user: { id: 'driver-1', companyName: 'Fast', ratingAvg: 4.8 } },
        { id: 'bid-2', amount: 44000, createdAt: new Date(), user: { id: 'driver-2', companyName: 'Quick', ratingAvg: 4.6 } },
      ]
      mockPrisma.bid.findMany.mockResolvedValue(mockBids)

      const req = mockReq({}, { id: 'auction-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (auctionsRouter as any).stack.find((l: any) => l.route?.path === '/:id/bids')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(mockPrisma.bid.findMany).toHaveBeenCalledWith({
        where: { auctionId: 'auction-1' },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, companyName: true, ratingAvg: true } } },
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockBids })
    })
  })
})