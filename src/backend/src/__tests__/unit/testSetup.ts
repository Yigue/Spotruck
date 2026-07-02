/**
 * Shared test setup — must be imported BEFORE any router modules.
 * Mocks Prisma, config, bcrypt, and jsonwebtoken.
 * Provides mockReq with proper Express req shape including headers/auth.
 */

import { jest } from '@jest/globals'

// ─── Prisma mock ──────────────────────────────────────────────────────────────
jest.mock('@prisma/client', () => require('./prismaClientMock'))

// ─── bcrypt / jsonwebtoken mocks ──────────────────────────────────────────────
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

// ─── Config mock ───────────────────────────────────────────────────────────────
jest.mock('../../config/index', () => require('./configMock'))

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
