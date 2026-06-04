import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: { findUnique: jest.fn() },
    trip: { findUnique: jest.fn(), update: jest.fn() },
    auction: { findUnique: jest.fn(), count: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
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
    payment: {
      platformFeePercent: 0.08,
      holdDurationHours: 72,
    },
  },
}))

import { paymentsRouter } from '../routes/payments.js'

function mockReq(body = {}, params = {}, user = { sub: 'company-1', role: 'COMPANY', email: 'co@example.com' }) {
  return { body, params, user }
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

describe('PaymentsService', () => {
  let mockPrisma: any

  beforeEach(() => {
    jest.clearAllMocks()
    const { PrismaClient } = require('@prisma/client')
    mockPrisma = new PrismaClient() as any
  })

  describe('POST /payments/hold', () => {
    it('creates a HELD payment for trip in AUCTION status', async () => {
      const mockTrip = {
        id: 'trip-1',
        status: 'AUCTION',
        auction: { id: 'auction-1', currentPrice: 50000 },
      }
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment-1',
        tripId: 'trip-1',
        userId: 'company-1',
        amount: 50000,
        platformFee: 4000,
        netAmount: 46000,
        status: 'HELD',
        holdExpiresAt: expect.any(Date),
      })

      const req = mockReq({ tripId: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (paymentsRouter as any).stack.find((l: any) => l.route?.path === '/hold')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tripId: 'trip-1',
          userId: 'company-1',
          amount: 50000,
          platformFee: 50000 * 0.08,
          netAmount: 50000 - 50000 * 0.08,
          status: 'HELD',
        }),
      })
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('calculates correct platform fee (8%) and net amount', async () => {
      const mockTrip = {
        id: 'trip-1',
        status: 'AUCTION',
        auction: { id: 'auction-1', currentPrice: 100000 },
      }
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment-1',
        tripId: 'trip-1',
        amount: 100000,
        platformFee: 8000,
        netAmount: 92000,
        status: 'HELD',
      })

      const req = mockReq({ tripId: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (paymentsRouter as any).stack.find((l: any) => l.route?.path === '/hold')?.route?.stack[0]?.handle
      await handler(req, res, next)

      const createCall = mockPrisma.payment.create.mock.calls[0][0]
      expect(createCall.data.platformFee).toBe(8000)
      expect(createCall.data.netAmount).toBe(92000)
    })

    it('sets hold expiration based on config (72 hours)', async () => {
      const mockTrip = {
        id: 'trip-1',
        status: 'AUCTION',
        auction: { id: 'auction-1', currentPrice: 50000 },
      }
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.payment.create.mockImplementation(async (args) => ({
        id: 'payment-1',
        ...args.data,
      }))

      const req = mockReq({ tripId: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const beforeTime = Date.now()
      const handler = (paymentsRouter as any).stack.find((l: any) => l.route?.path === '/hold')?.route?.stack[0]?.handle
      await handler(req, res, next)
      const afterTime = Date.now()

      const createCall = mockPrisma.payment.create.mock.calls[0][0]
      const holdExpiry = createCall.data.holdExpiresAt.getTime()
      const expectedMin = beforeTime + 72 * 60 * 60 * 1000
      const expectedMax = afterTime + 72 * 60 * 60 * 1000
      expect(holdExpiry).toBeGreaterThanOrEqual(expectedMin)
      expect(holdExpiry).toBeLessThanOrEqual(expectedMax)
    })

    it('returns 404 when trip not found', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      const req = mockReq({ tripId: 'non-existent' })
      const res = mockRes()
      const next = mockNext()

      const handler = (paymentsRouter as any).stack.find((l: any) => l.route?.path === '/hold')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(404)
    })

    it('returns 400 when trip not in AUCTION status', async () => {
      const mockTrip = { id: 'trip-1', status: 'DRAFT', auction: null }
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)

      const req = mockReq({ tripId: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (paymentsRouter as any).stack.find((l: any) => l.route?.path === '/hold')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Trip must be in AUCTION status')
    })
  })

  describe('POST /payments/release', () => {
    it('releases held payment and sets trip to SETTLED', async () => {
      const mockPayment = { id: 'payment-1', tripId: 'trip-1', status: 'HELD', amount: 50000 }
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment)
      mockPrisma.payment.update.mockResolvedValue({ ...mockPayment, status: 'RELEASED' })
      mockPrisma.trip.update.mockResolvedValue({ id: 'trip-1', status: 'SETTLED' })

      const req = mockReq({ tripId: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (paymentsRouter as any).stack.find((l: any) => l.route?.path === '/release')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: { status: 'RELEASED' },
      })
      expect(mockPrisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: { status: 'SETTLED' },
      })
      expect(res.json).toHaveBeenCalled()
    })

    it('returns 404 when no held payment found for trip', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null)

      const req = mockReq({ tripId: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (paymentsRouter as any).stack.find((l: any) => l.route?.path === '/release')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Held payment for this trip')
    })
  })

  describe('GET /payments/:tripId', () => {
    it('returns payment for given trip', async () => {
      const mockPayment = { id: 'payment-1', tripId: 'trip-1', amount: 50000, status: 'HELD' }
      mockPrisma.payment.findFirst.mockResolvedValue(mockPayment)

      const req = mockReq({}, { tripId: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (paymentsRouter as any).stack.find((l: any) => l.route?.path === '/:tripId')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ data: mockPayment })
    })

    it('returns 404 when no payment found for trip', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null)

      const req = mockReq({}, { tripId: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (paymentsRouter as any).stack.find((l: any) => l.route?.path === '/:tripId')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(404)
    })
  })
})