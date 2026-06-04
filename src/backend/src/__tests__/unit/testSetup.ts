/**
 * Shared test setup — must be imported BEFORE any router modules.
 * Mocks Prisma, config, bcrypt, and jsonwebtoken.
 * Provides mockReq with proper Express req shape including headers/auth.
 */

import { jest } from '@jest/globals'

// ─── Prisma mock ──────────────────────────────────────────────────────────────
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
    auction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bid: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    rating: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  })),
}))

// ─── bcrypt / jsonwebtoken mocks ──────────────────────────────────────────────
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

// ─── Config mock ───────────────────────────────────────────────────────────────
jest.mock('../../config/index', () => ({
  config: {
    jwt: { secret: 'test-secret', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
    db: { url: 'postgresql://test' },
    redis: { url: 'redis://localhost:6379' },
    mercadopago: { accessToken: '', webhookSecret: '' },
    auction: {
      antiSnipingWindowMinutes: 5,
      antiSnipingExtensionMinutes: 5,
      maxExtensions: 3,
    },
    payment: { platformFeePercent: 0.08, holdDurationHours: 72 },
  },
}))

export function mockReq(
  body = {},
  params = {},
  query = {},
  user = { sub: 'company-1', role: 'COMPANY', email: 'co@example.com' },
) {
  return { body, params, query, user, headers: { authorization: 'Bearer test-token' } }
}

export function mockRes() {
  const res: Record<string, jest.Mock> = {}
  res.status = jest.fn().mockReturnThis()
  res.json = jest.fn().mockReturnThis()
  return res as any
}

export function mockNext() {
  return jest.fn()
}
