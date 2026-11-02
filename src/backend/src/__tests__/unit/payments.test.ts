import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// ─── Mocks — must be before any module imports that use them ───────────────
jest.mock('@prisma/client', () => require('./prismaClientMock'))

jest.mock('jsonwebtoken')
jest.mock('../../config/index.js', () => require('./configMock'))

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
        id: '22222222-2222-4222-8222-222222222222',
        userId: 'company-user-1',
        status: 'AUCTION',
        auction: { currentPrice: 50000 },
      }
      const mockPayment = {
        id: 'payment-uuid-1',
        tripId: '22222222-2222-4222-8222-222222222222',
        userId: 'company-user-1',
        amount: 50000,
        platformFee: 4000,
        netAmount: 46000,
        status: 'HELD',
        holdExpiresAt: new Date(),
      }
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip)
      ;(prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment)

      const req = mockReq({ tripId: '22222222-2222-4222-8222-222222222222' }, {}, {}, { sub: 'company-user-1', role: 'COMPANY', email: 'company@example.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/hold', 1)
      await handler(req, res, next)

      expect(prisma.trip.findUnique).toHaveBeenCalledWith({
        where: { id: '22222222-2222-4222-8222-222222222222' },
        include: { auction: true },
      })
      const createArgs = (prisma.payment.create as jest.Mock).mock.calls[0][0] as any
      expect(createArgs.data.tripId).toBe('22222222-2222-4222-8222-222222222222')
      expect(createArgs.data.userId).toBe('company-user-1')
      expect(createArgs.data.status).toBe('HELD')
      // Los montos son Prisma.Decimal: se comparan por valor numérico
      expect(Number(createArgs.data.amount.toString())).toBe(50000)
      expect(Number(createArgs.data.platformFee.toString())).toBe(4000)
      expect(Number(createArgs.data.netAmount.toString())).toBe(46000)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ data: mockPayment })
    })

    it('returns 404 when trip not found', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

      const req = mockReq({ tripId: '33333333-3333-4333-8333-333333333333' }, {}, {}, { sub: 'company-user-1', role: 'COMPANY', email: 'company@example.com' })
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
        id: '22222222-2222-4222-8222-222222222222',
        userId: 'company-user-1',
        status: 'ASSIGNED',
        auction: { currentPrice: 50000 },
      }
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip)

      const req = mockReq({ tripId: '22222222-2222-4222-8222-222222222222' }, {}, {}, { sub: 'company-user-1', role: 'COMPANY', email: 'company@example.com' })
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
        tripId: '22222222-2222-4222-8222-222222222222',
        status: 'HELD',
        amount: 50000,
      }
      const mockUpdatedPayment = { ...mockPayment, status: 'RELEASED' }
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue({ id: mockPayment.tripId, userId: 'company-user-1' })
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      ;(prisma.payment.update as jest.Mock).mockResolvedValue(mockUpdatedPayment)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue({ id: '22222222-2222-4222-8222-222222222222', status: 'SETTLED' })

      const req = mockReq({ tripId: '22222222-2222-4222-8222-222222222222' }, {}, {}, { sub: 'company-user-1', role: 'COMPANY', email: 'company@example.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/release', 1)
      await handler(req, res, next)

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { tripId: '22222222-2222-4222-8222-222222222222', status: 'HELD' },
      })
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-uuid-1' },
        data: { status: 'RELEASED' },
      })
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: '22222222-2222-4222-8222-222222222222' },
        data: { status: 'SETTLED' },
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockUpdatedPayment })
    })

    it('returns 404 when no held payment found for trip', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue({ id: 'x', userId: 'company-user-1' })
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(null)

      const req = mockReq({ tripId: '33333333-3333-4333-8333-333333333333' }, {}, {}, { sub: 'company-user-1', role: 'COMPANY', email: 'company@example.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/release', 1)
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(404)
      expect(err.message).toBe('Held payment for this trip not found')
    })
  })

  describe('GET /payments/:tripId', () => {
    it('returns payment for a trip', async () => {
      // El endpoint ahora exige ser parte del pago (dueño del viaje,
      // transportista que cobra o admin)
      const mockPayment = {
        id: 'payment-uuid-1',
        tripId: '22222222-2222-4222-8222-222222222222',
        userId: 'driver-uuid-1',
        amount: 50000,
        status: 'HELD',
        trip: { userId: 'company-uuid-1' },
      }
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)

      const req = mockReq({}, { tripId: '22222222-2222-4222-8222-222222222222' }, {}, {
        sub: 'company-uuid-1',
        role: 'COMPANY',
      })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(paymentsRouter, '/:tripId', 1)
      await handler(req, res, next)

      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { tripId: '22222222-2222-4222-8222-222222222222' },
        include: { trip: { select: { userId: true } } },
      })
      const { trip: _trip, ...expected } = mockPayment
      expect(res.json).toHaveBeenCalledWith({ data: expected })
    })

    it('returns 404 when payment not found for trip', async () => {
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(null)

      const req = mockReq({}, { tripId: '33333333-3333-4333-8333-333333333333' })
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
