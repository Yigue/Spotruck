import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// ─── Mocks — must be before any module imports that use them ───────────────
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    trip: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auction: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bid: { create: jest.fn(), findMany: jest.fn() },
    payment: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    rating: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
  })),
}))

jest.mock('jsonwebtoken')
jest.mock('../../config/index.js', () => ({
  config: {
    jwt: { secret: 'test-secret', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
    db: { url: 'postgresql://test' },
    redis: { url: 'redis://localhost' },
  },
}))

// ─── Now import modules under test ─────────────────────────────────────────
import { paymentsRouter } from '../../routes/payments.js'
import { prisma } from '../../models/prisma.js'
import * as jwt from 'jsonwebtoken'

// ─── Test helpers ──────────────────────────────────────────────────────────
function mockReq(body = {}, params = {}, query = {}, user?: Record<string, unknown>) {
  return { body, params, query, user, headers: {}, get: jest.fn() } as any
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

function getHandler(router: any, path: string, methodIndex = 0) {
  const layer = router.stack.find((l: any) => l.route?.path === path)
  return layer?.route?.stack[methodIndex]?.handle
}

function mockJwtAuth() {
  ;(jwt.verify as jest.Mock).mockReturnValue({ sub: 'company-user-1', role: 'COMPANY', email: 'company@example.com' })
}

describe('PaymentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockJwtAuth()
  })

  describe('POST /payments/hold', () => {
    it('creates a payment hold for a trip in AUCTION status', async () => {
      const mockTrip = {
        id: 'trip-uuid-1',
        status: 'AUCTION',
        auction: { currentPrice: 50000 },
      }
      const mockPayment = {
        id: 'payment-uuid-1',
        tripId: 'trip-uuid-1',
        userId: 'company-user-1',
        amount: 50000,
        platformFee: 4000,
        netAmount: 46000,
        status: 'HELD',
        holdExpiresAt: new Date(),
      }
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip)
      ;(prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment)

      const req = mockReq({ tripId: 'trip-uuid-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/hold', 1)
      await handler(req, res, next)

      expect(prisma.trip.findUnique).toHaveBeenCalledWith({
        where: { id: 'trip-uuid-1' },
        include: { auction: true },
      })
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tripId: 'trip-uuid-1',
          userId: 'company-user-1',
          amount: 50000,
          platformFee: 4000,
          netAmount: 46000,
          status: 'HELD',
        }),
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ data: mockPayment })
    })

    it('returns 404 when trip not found', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

      const req = mockReq({ tripId: 'non-existent-trip' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/hold', 1)
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Trip not found')
    })

    it('returns 400 when trip is not in AUCTION status', async () => {
      const mockTrip = {
        id: 'trip-uuid-1',
        status: 'ASSIGNED',
        auction: { currentPrice: 50000 },
      }
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip)

      const req = mockReq({ tripId: 'trip-uuid-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/hold', 1)
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Trip must be in AUCTION status')
    })
  })

  describe('POST /payments/release', () => {
    it('releases a held payment and sets trip to SETTLED', async () => {
      const mockPayment = {
        id: 'payment-uuid-1',
        tripId: 'trip-uuid-1',
        status: 'HELD',
        amount: 50000,
      }
      const mockUpdatedPayment = { ...mockPayment, status: 'RELEASED' }
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      ;(prisma.payment.update as jest.Mock).mockResolvedValue(mockUpdatedPayment)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue({ id: 'trip-uuid-1', status: 'SETTLED' })

      const req = mockReq({ tripId: 'trip-uuid-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/release', 1)
      await handler(req, res, next)

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { tripId: 'trip-uuid-1', status: 'HELD' },
      })
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-uuid-1' },
        data: { status: 'RELEASED' },
      })
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-uuid-1' },
        data: { status: 'SETTLED' },
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockUpdatedPayment })
    })

    it('returns 404 when no held payment found for trip', async () => {
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(null)

      const req = mockReq({ tripId: 'trip-no-payment' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/release', 1)
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Held payment for this trip')
    })
  })

  describe('GET /payments/:tripId', () => {
    it('returns payment for a trip', async () => {
      const mockPayment = {
        id: 'payment-uuid-1',
        tripId: 'trip-uuid-1',
        amount: 50000,
        status: 'HELD',
      }
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)

      const req = mockReq({}, { tripId: 'trip-uuid-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/:tripId', 1)
      await handler(req, res, next)

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { tripId: 'trip-uuid-1' },
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockPayment })
    })

    it('returns 404 when payment not found for trip', async () => {
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(null)

      const req = mockReq({}, { tripId: 'trip-no-payment' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/:tripId', 1)
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Payment not found')
    })
  })
})
