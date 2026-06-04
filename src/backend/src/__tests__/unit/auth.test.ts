import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { authRouter } from '../../routes/auth'
import { tripsRouter } from '../../routes/trips'
import { auctionsRouter } from '../../routes/auctions'
import { paymentsRouter } from '../../routes/payments'
import { ratingsRouter } from '../../routes/ratings'

// Mock external modules
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    trip: { findUnique: jest.fn(), count: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    auction: { findUnique: jest.fn(), count: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    bid: { create: jest.fn(), findMany: jest.fn() },
    payment: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    rating: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), aggregate: jest.fn() },
  })),
}))

jest.mock('bcryptjs')
jest.mock('jsonwebtoken')
jest.mock('../../config/index.js', () => ({
  config: {
    jwt: { secret: 'test-secret', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
    db: { url: 'postgresql://test' },
    redis: { url: 'redis://test' },
    auction: { antiSnipingWindowMinutes: 5, antiSnipingExtensionMinutes: 2, minBidDecrementPercent: 0.10, maxExtensions: 3 },
    payment: { platformFeePercent: 0.08, holdDurationHours: 72 },
  },
}))

function mockReq(body = {}, params = {}, query = {}, user = { sub: 'company-1', role: 'COMPANY', email: 'test@example.com' }) {
  return { body, params, query, user, headers: {}, get: jest.fn() }
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

describe('AuthService', () => {
  let mockPrisma: any

  beforeEach(() => {
    jest.clearAllMocks()
    const { PrismaClient } = require('@prisma/client')
    mockPrisma = new PrismaClient() as any
  })

  describe('POST /auth/register', () => {
    it('creates user with hashed password and returns tokens', async () => {
      const mockUser = { id: 'user-new-1', email: 'new@example.com', role: 'COMPANY', passwordHash: 'hashed' }
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(mockUser)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed')
      ;(jwt.sign as jest.Mock).mockReturnValueOnce('access-token-fake').mockReturnValueOnce('refresh-token-fake')

      const req = mockReq({ email: 'new@example.com', password: 'password123', role: 'COMPANY', companyName: 'Acme' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/register')
      await handler(req, res, next)

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com', passwordHash: 'hashed', role: 'COMPANY', companyName: 'Acme',
          companyCuit: undefined, driverLicense: undefined, vehiclePlate: undefined, vehicleType: undefined, phone: undefined,
        },
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        data: { user: { id: 'user-new-1', email: 'new@example.com', role: 'COMPANY' }, accessToken: 'access-token-fake', refreshToken: 'refresh-token-fake' },
      })
    })

    it('returns 409 when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'taken@example.com' })

      const req = mockReq({ email: 'taken@example.com', password: 'password123', role: 'COMPANY' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/register')
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(409)
      expect(err.message).toBe('Email already registered')
    })

    it('returns 400 for invalid email format', async () => {
      const req = mockReq({ email: 'not-an-email', password: 'password123', role: 'COMPANY' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/register')
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(400)
    })
  })

  describe('POST /auth/login', () => {
    it('returns tokens for valid credentials', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', role: 'COMPANY', passwordHash: 'hashed-pw' }
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token')

      const req = mockReq({ email: 'test@example.com', password: 'correct-password' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/login')
      await handler(req, res, next)

      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', 'hashed-pw')
      expect(res.json).toHaveBeenCalledWith({
        data: { user: { id: 'user-1', email: 'test@example.com', role: 'COMPANY' }, accessToken: 'access-token', refreshToken: 'refresh-token' },
      })
    })

    it('returns 401 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const req = mockReq({ email: 'ghost@example.com', password: 'password' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/login')
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(401)
      expect(err.message).toBe('Invalid credentials')
    })

    it('returns 401 for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com', passwordHash: 'hashed-pw' })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const req = mockReq({ email: 'test@example.com', password: 'wrong-password' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/login')
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(401)
    })
  })

  describe('POST /auth/refresh', () => {
    it('returns new tokens for valid refresh token', async () => {
      ;(jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-123', type: 'refresh' })
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'test@example.com', role: 'COMPANY' })
      ;(jwt.sign as jest.Mock).mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token')

      const req = mockReq({ refreshToken: 'valid-refresh-token' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/refresh')
      await handler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ data: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' } })
    })

    it('returns 400 when refreshToken missing', async () => {
      const req = mockReq({})
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/refresh')
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('refreshToken required')
    })

    it('returns 401 for non-refresh token type', async () => {
      ;(jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-123', type: 'access' })

      const req = mockReq({ refreshToken: 'access-type-token' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/refresh')
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(401)
    })

    it('returns 401 when user not found', async () => {
      ;(jwt.verify as jest.Mock).mockReturnValue({ sub: 'deleted-user', type: 'refresh' })
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const req = mockReq({ refreshToken: 'valid-token' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/refresh')
      await handler(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0]
      expect(err.statusCode).toBe(401)
      expect(err.message).toBe('User not found')
    })
  })

  describe('GET /auth/me', () => {
    it('returns user profile for authenticated user', async () => {
      const mockUser = {
        id: 'user-123', email: 'test@example.com', role: 'COMPANY', companyName: 'Acme Co', companyCuit: '30-12345678-9',
        phone: '+549****5678', driverLicense: null, vehiclePlate: null, vehicleType: null, vehicleCapacity: null,
        ratingAvg: 4.8, tripsCompleted: 15, createdAt: new Date('2024-01-01'),
      }
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const req = mockReq({}, {}, {}, { sub: 'user-123', role: 'COMPANY', email: 'test@example.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/me')
      await handler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ data: mockUser })
    })

    it('returns 404 when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const req = mockReq({}, {}, {}, { sub: 'deleted-user', role: 'COMPANY', email: 'x@x.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/me')
      await handler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('POST /auth/logout', () => {
    it('returns success for authenticated user', async () => {
      const req = mockReq({}, {}, {}, { sub: 'user-123', role: 'COMPANY', email: 'test@example.com' })
      const res = mockRes()
      const next = mockNext()

      const handler = getHandler(authRouter, '/logout')
      await handler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ data: { success: true } })
    })
  })
})