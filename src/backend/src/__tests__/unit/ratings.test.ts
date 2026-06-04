import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: { findUnique: jest.fn(), update: jest.fn() },
    trip: { findUnique: jest.fn() },
    auction: { findUnique: jest.fn(), count: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    bid: { create: jest.fn(), findMany: jest.fn() },
    payment: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    rating: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  })),
}))

jest.mock('jsonwebtoken')
jest.mock('../../config/index', () => ({
  config: {
    jwt: { secret: 'test-secret', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
    db: { url: 'postgresql://test' },
    redis: { url: 'redis://localhost:6379' },
  },
}))

import { ratingsRouter } from '../../routes/ratings.js'
import { prisma } from '../../models/prisma.js'
import * as jwt from 'jsonwebtoken'

function mockReq(body = {}, params = {}, query = {}, user = { sub: 'company-1', role: 'COMPANY', email: 'co@example.com' }) {
  return { body, params, query, user, headers: { authorization: 'Bearer test-token' } }
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

function mockJwtAuth(user = { sub: 'company-1', role: 'COMPANY', email: 'co@example.com' }) {
  ;(jwt.verify as jest.Mock).mockReturnValue(user)
}

describe('RatingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockJwtAuth()
  })

  describe('POST /ratings', () => {
    it('creates rating and updates user average', async () => {
      ;(prisma.rating.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.rating.create as jest.Mock).mockResolvedValue({
        id: 'rating-new',
        tripId: 'trip-1',
        fromUserId: 'company-1',
        toUserId: 'driver-1',
        score: 5,
        punctuality: 5,
        communication: 4,
        cargoCondition: 5,
        comment: 'Great service!',
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'driver-1', ratingAvg: 4.8, ratingCount: 10 })
      ;(prisma.rating.aggregate as jest.Mock).mockResolvedValue({ _avg: { score: 4.8 }, _count: { score: 10 } })

      const req = mockReq({
        tripId: 'trip-1',
        toUserId: 'driver-1',
        score: 5,
        punctuality: 5,
        communication: 4,
        cargoCondition: 5,
        comment: 'Great service!',
      })
      const res = mockRes()
      const next = mockNext()

      const layer = (ratingsRouter as any).stack.find((l: any) => l.route?.path === '/')
      const handler = layer?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(prisma.rating.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tripId: 'trip-1',
          fromUserId: 'company-1',
          toUserId: 'driver-1',
          score: 5,
          punctuality: 5,
          communication: 4,
          cargoCondition: 5,
          comment: 'Great service!',
        }),
      })
      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('recalculates and updates user ratingAvg after new rating', async () => {
      ;(prisma.rating.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.rating.create as jest.Mock).mockResolvedValue({
        id: 'rating-new',
        tripId: 'trip-1',
        fromUserId: 'company-1',
        toUserId: 'driver-1',
        score: 4,
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'driver-1', ratingAvg: 4.2 })
      ;(prisma.rating.aggregate as jest.Mock).mockResolvedValue({ _avg: { score: 4.2 }, _count: { score: 5 } })

      const req = mockReq({ tripId: 'trip-1', toUserId: 'driver-1', score: 4 })
      const res = mockRes()
      const next = mockNext()

      const layer = (ratingsRouter as any).stack.find((l: any) => l.route?.path === '/')
      const handler = layer?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(prisma.rating.aggregate).toHaveBeenCalledWith({
        where: { toUserId: 'driver-1' },
        _avg: { score: true },
        _count: { score: true },
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'driver-1' },
        data: { ratingAvg: 4.2 },
      })
    })

    it('returns 400 when rating yourself', async () => {
      const req = mockReq(
        { tripId: 'trip-1', toUserId: 'company-1', score: 5 },
        {},
        { sub: 'company-1', role: 'COMPANY', email: 'co@example.com' }
      )
      const res = mockRes()
      const next = mockNext()

      const layer = (ratingsRouter as any).stack.find((l: any) => l.route?.path === '/')
      const handler = layer?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Cannot rate yourself')
    })

    it('returns 409 when already rated this trip', async () => {
      ;(prisma.rating.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-rating', tripId: 'trip-1' })

      const req = mockReq({ tripId: 'trip-1', toUserId: 'driver-1', score: 5 })
      const res = mockRes()
      const next = mockNext()

      const layer = (ratingsRouter as any).stack.find((l: any) => l.route?.path === '/')
      const handler = layer?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(409)
      expect(err.message).toBe('Already rated this trip')
    })

    it('returns 400 for invalid score (below 1 or above 5)', async () => {
      const req = mockReq({ tripId: 'trip-1', toUserId: 'driver-1', score: 6 })
      const res = mockRes()
      const next = mockNext()

      const layer = (ratingsRouter as any).stack.find((l: any) => l.route?.path === '/')
      const handler = layer?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(400)
    })

    it('accepts valid optional sub-scores', async () => {
      ;(prisma.rating.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.rating.create as jest.Mock).mockResolvedValue({
        id: 'rating-new',
        tripId: 'trip-1',
        fromUserId: 'company-1',
        toUserId: 'driver-1',
        score: 4,
        punctuality: 5,
        communication: 3,
        cargoCondition: 4,
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'driver-1' })
      ;(prisma.rating.aggregate as jest.Mock).mockResolvedValue({ _avg: { score: 4.0 }, _count: { score: 1 } })

      const req = mockReq({
        tripId: 'trip-1',
        toUserId: 'driver-1',
        score: 4,
        punctuality: 5,
        communication: 3,
        cargoCondition: 4,
      })
      const res = mockRes()
      const next = mockNext()

      const layer = (ratingsRouter as any).stack.find((l: any) => l.route?.path === '/')
      const handler = layer?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(prisma.rating.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          punctuality: 5,
          communication: 3,
          cargoCondition: 4,
        }),
      })
    })

    it('rejects comment over 500 characters', async () => {
      const longComment = 'a'.repeat(501)
      const req = mockReq({ tripId: 'trip-1', toUserId: 'driver-1', score: 5, comment: longComment })
      const res = mockRes()
      const next = mockNext()

      const layer = (ratingsRouter as any).stack.find((l: any) => l.route?.path === '/')
      const handler = layer?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(400)
    })
  })

  describe('GET /ratings/user/:userId', () => {
    it('returns up to 50 ratings for a user', async () => {
      const mockRatings = [
        {
          id: 'rating-1',
          score: 5,
          punctuality: 5,
          communication: 4,
          cargoCondition: 5,
          comment: 'Excellent',
          fromUser: { id: 'company-1', companyName: 'Acme', role: 'COMPANY' },
          trip: { id: 'trip-1', originAddress: 'Buenos Aires', destAddress: 'Córdoba' },
        },
        {
          id: 'rating-2',
          score: 4,
          punctuality: 4,
          communication: 4,
          cargoCondition: 4,
          comment: 'Good',
          fromUser: { id: 'company-2', companyName: 'Beta', role: 'COMPANY' },
          trip: { id: 'trip-2', originAddress: 'Rosario', destAddress: 'Mendoza' },
        },
      ]
      ;(prisma.rating.findMany as jest.Mock).mockResolvedValue(mockRatings)

      const req = mockReq({}, { userId: 'driver-1' })
      const res = mockRes()
      const next = mockNext()

      const layer = (ratingsRouter as any).stack.find((l: any) => l.route?.path === '/user/:userId')
      const handler = layer?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(prisma.rating.findMany).toHaveBeenCalledWith({
        where: { toUserId: 'driver-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          fromUser: { select: { id: true, companyName: true, role: true } },
          trip: { select: { id: true, originAddress: true, destAddress: true } },
        },
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockRatings })
    })

    it('returns empty array when user has no ratings', async () => {
      ;(prisma.rating.findMany as jest.Mock).mockResolvedValue([])

      const req = mockReq({}, { userId: 'new-driver' })
      const res = mockRes()
      const next = mockNext()

      const layer = (ratingsRouter as any).stack.find((l: any) => l.route?.path === '/user/:userId')
      const handler = layer?.route?.stack[1]?.handle
      await handler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ data: [] })
    })
  })
})
