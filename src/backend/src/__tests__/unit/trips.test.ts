import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    trip: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
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
    payment: { platformFeePercent: 0.08, holdDurationHours: 72 },
  },
}))

import { tripsRouter } from '../routes/trips.js'

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

describe('TripsService', () => {
  let mockPrisma: any

  beforeEach(() => {
    jest.clearAllMocks()
    const { PrismaClient } = require('@prisma/client')
    mockPrisma = new PrismaClient() as any
  })

  describe('GET /trips', () => {
    it('returns paginated trips list', async () => {
      const mockTrips = [
        {
          id: 'trip-1',
          originAddress: 'Buenos Aires',
          destAddress: 'Córdoba',
          cargoType: 'GENERAL',
          basePrice: 50000,
          status: 'OPEN',
          createdAt: new Date(),
          user: { id: 'company-1', companyName: 'Acme', ratingAvg: 4.5 },
          auction: { id: 'auction-1', status: 'OPEN', currentPrice: 48000, type: 'OPEN', endTime: new Date() },
        },
      ]
      mockPrisma.trip.findMany.mockResolvedValue(mockTrips)
      mockPrisma.trip.count.mockResolvedValue(1)

      const req = mockReq({}, {}, { page: '1', limit: '20' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        })
      )
      expect(res.json).toHaveBeenCalledWith({
        data: mockTrips,
        meta: { total: 1, page: 1, limit: 20 },
      })
    })

    it('applies status and cargoType filters', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([])
      mockPrisma.trip.count.mockResolvedValue(0)

      const req = mockReq({}, {}, { status: 'OPEN', cargoType: 'REFRIGERATED', page: '1', limit: '20' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'OPEN', cargoType: 'REFRIGERATED' }),
        })
      )
    })

    it('applies price range filters', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([])
      mockPrisma.trip.count.mockResolvedValue(0)

      const req = mockReq({}, {}, { minPrice: '10000', maxPrice: '50000', page: '1', limit: '20' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            basePrice: expect.objectContaining({ gte: 10000, lte: 50000 }),
          }),
        })
      )
    })
  })

  describe('GET /trips/:id', () => {
    it('returns trip with auction and tracking logs', async () => {
      const mockTrip = {
        id: 'trip-1',
        originAddress: 'Buenos Aires',
        destAddress: 'Córdoba',
        status: 'AUCTION',
        user: { id: 'company-1', companyName: 'Acme', ratingAvg: 4.5 },
        auction: {
          id: 'auction-1',
          status: 'OPEN',
          currentPrice: 45000,
          bids: [
            {
              id: 'bid-1',
              amount: 45000,
              user: { id: 'driver-1', companyName: 'Fast Transport', ratingAvg: 4.9 },
            },
          ],
        },
        trackingLogs: [{ id: 'log-1', recordedAt: new Date(), location: 'km 50' }],
      }
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)

      const req = mockReq({}, { id: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ data: mockTrip })
    })

    it('returns 404 for non-existent trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      const req = mockReq({}, { id: 'non-existent-trip' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[0]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(404)
    })
  })

  describe('POST /trips', () => {
    it('creates a new trip for COMPANY role', async () => {
      const mockTrip = {
        id: 'trip-new',
        userId: 'company-1',
        originAddress: 'Buenos Aires',
        originLat: -34.6,
        originLng: -58.4,
        destAddress: 'Rosario',
        destLat: -32.9,
        destLng: -60.7,
        cargoType: 'GENERAL',
        basePrice: 35000,
        status: 'DRAFT',
      }
      mockPrisma.trip.create.mockResolvedValue(mockTrip)

      const req = mockReq({
        originAddress: 'Buenos Aires',
        originLat: -34.6,
        originLng: -58.4,
        destAddress: 'Rosario',
        destLat: -32.9,
        destLng: -60.7,
        cargoType: 'GENERAL',
        cargoDesc: 'General merchandise',
        weightKg: 500,
        scheduledDate: '2024-12-01T00:00:00Z',
        basePrice: 35000,
      })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(mockPrisma.trip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'company-1',
          originAddress: 'Buenos Aires',
          cargoType: 'GENERAL',
          basePrice: 35000,
        }),
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ data: mockTrip })
    })

    it('returns 403 for DRIVER role', async () => {
      const req = mockReq(
        {
          originAddress: 'Buenos Aires',
          originLat: -34.6,
          originLng: -58.4,
          destAddress: 'Rosario',
          destLat: -32.9,
          destLng: -60.7,
          cargoType: 'GENERAL',
          scheduledDate: '2024-12-01T00:00:00Z',
          basePrice: 35000,
        },
        {},
        {},
        { sub: 'driver-1', role: 'DRIVER', email: 'driver@example.com' }
      )
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(403)
    })
  })

  describe('PUT /trips/:id', () => {
    it('allows owner to update trip in DRAFT status', async () => {
      const existingTrip = { id: 'trip-1', userId: 'company-1', status: 'DRAFT' }
      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)
      mockPrisma.trip.update.mockResolvedValue({ ...existingTrip, basePrice: 40000 })

      const req = mockReq({ basePrice: 40000 }, { id: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(mockPrisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: { basePrice: 40000 },
      })
      expect(res.json).toHaveBeenCalled()
    })

    it('allows ADMIN to update any trip', async () => {
      const existingTrip = { id: 'trip-1', userId: 'company-1', status: 'DRAFT' }
      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)
      mockPrisma.trip.update.mockResolvedValue({ ...existingTrip, basePrice: 40000 })

      const req = mockReq(
        { basePrice: 40000 },
        { id: 'trip-1' },
        {},
        { sub: 'admin-1', role: 'ADMIN', email: 'admin@example.com' }
      )
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(mockPrisma.trip.update).toHaveBeenCalled()
    })

    it('returns 404 for non-existent trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      const req = mockReq({ basePrice: 40000 }, { id: 'non-existent' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(404)
    })

    it('returns 403 when non-owner non-admin tries to update', async () => {
      const existingTrip = { id: 'trip-1', userId: 'company-1', status: 'DRAFT' }
      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)

      const req = mockReq(
        { basePrice: 40000 },
        { id: 'trip-1' },
        {},
        { sub: 'other-company', role: 'COMPANY', email: 'other@example.com' }
      )
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(403)
    })

    it('returns 400 when editing trip in AUCTION status', async () => {
      const existingTrip = { id: 'trip-1', userId: 'company-1', status: 'AUCTION' }
      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)

      const req = mockReq({ basePrice: 40000 }, { id: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Cannot edit trip in current status')
    })
  })

  describe('DELETE /trips/:id', () => {
    it('allows owner to delete trip in DRAFT status', async () => {
      const existingTrip = { id: 'trip-1', userId: 'company-1', status: 'DRAFT' }
      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)
      mockPrisma.trip.delete.mockResolvedValue(existingTrip)

      const req = mockReq({}, { id: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[2]?.handle
      await handler(req, res, next)

      expect(mockPrisma.trip.delete).toHaveBeenCalledWith({ where: { id: 'trip-1' } })
      expect(res.json).toHaveBeenCalledWith({ data: { success: true } })
    })

    it('returns 400 when deleting trip in IN_PROGRESS status', async () => {
      const existingTrip = { id: 'trip-1', userId: 'company-1', status: 'IN_PROGRESS' }
      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)

      const req = mockReq({}, { id: 'trip-1' })
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[2]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Cannot delete trip in current status')
    })

    it('returns 403 when non-owner tries to delete', async () => {
      const existingTrip = { id: 'trip-1', userId: 'company-1', status: 'DRAFT' }
      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)

      const req = mockReq(
        {},
        { id: 'trip-1' },
        {},
        { sub: 'other-company', role: 'COMPANY', email: 'other@example.com' }
      )
      const res = mockRes()
      const next = mockNext()

      const handler = (tripsRouter as any).stack.find((l: any) => l.route?.path === '/:id')?.route?.stack[2]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(403)
    })
  })
})