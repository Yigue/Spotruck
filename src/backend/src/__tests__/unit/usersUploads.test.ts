import { describe, it, expect, beforeEach, jest } from '@jest/globals'

jest.mock('@prisma/client', () => require('./prismaClientMock'))
jest.mock('jsonwebtoken')
jest.mock('../../config/index.js', () => require('./configMock'))

import { usersRouter } from '../../routes/users.js'
import { prisma } from '../../models/prisma.js'

function mockReq(
  body = {},
  params = {},
  query = {},
  user: Record<string, unknown> | undefined = { sub: 'driver-1', role: 'DRIVER', email: 'd@x.com' },
) {
  return { body, params, query, user, headers: { authorization: 'Bearer test-token' } } as any
}

function mockRes() {
  const res: Record<string, jest.Mock> = {}
  res.status = jest.fn().mockReturnThis()
  res.json = jest.fn().mockReturnThis()
  return res as any
}

function getRouteStack(router: any, method: string, path: string) {
  return router.stack.find((l: any) => l.route?.path === path && l.route?.methods?.[method])?.route?.stack
}

describe('Users uploads (Wave 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /users/me/avatar', () => {
    // Cadena: [authenticate, multer.single, handler] → el handler está al final
    const handler = () => getRouteStack(usersRouter, 'post', '/me/avatar').at(-1).handle

    it('guarda avatarUrl y responde { data: { id, avatarUrl } }', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'driver-1',
        avatarUrl: '/uploads/avatars/driver-1.jpg',
      })

      const req = mockReq()
      req.file = { filename: 'driver-1.jpg', mimetype: 'image/jpeg' }
      const res = mockRes()
      const next = jest.fn()

      await handler()(req, res, next)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'driver-1' },
        data: { avatarUrl: '/uploads/avatars/driver-1.jpg' },
        select: { id: true, avatarUrl: true },
      })
      expect(res.json).toHaveBeenCalledWith({
        data: { id: 'driver-1', avatarUrl: '/uploads/avatars/driver-1.jpg' },
      })
    })

    it('devuelve 400 si no llega archivo', async () => {
      const req = mockReq()
      req.file = undefined
      const res = mockRes()
      const next = jest.fn()

      await handler()(req, res, next)

      expect(next).toHaveBeenCalled()
      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(400)
      expect(prisma.user.update).not.toHaveBeenCalled()
    })
  })

  describe('POST /users/me/documents', () => {
    // Cadena: [authenticate, requireRole, multer.array, handler]
    const stack = () => getRouteStack(usersRouter, 'post', '/me/documents')
    const handler = () => stack().at(-1).handle
    const requireRoleMw = () => stack()[1].handle

    it('agrega las URLs nuevas sin duplicar y responde documentsUrl', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        documentsUrl: ['/uploads/documents/driver-1/licencia.pdf'],
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'driver-1',
        documentsUrl: [
          '/uploads/documents/driver-1/licencia.pdf',
          '/uploads/documents/driver-1/cedula.pdf',
        ],
      })

      const req = mockReq()
      req.files = [
        { filename: 'cedula.pdf', mimetype: 'application/pdf' },
        // Re-subida del mismo archivo: no debe duplicarse en la lista
        { filename: 'licencia.pdf', mimetype: 'application/pdf' },
      ]
      const res = mockRes()
      const next = jest.fn()

      await handler()(req, res, next)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'driver-1' },
        data: {
          documentsUrl: [
            '/uploads/documents/driver-1/licencia.pdf',
            '/uploads/documents/driver-1/cedula.pdf',
          ],
        },
        select: { id: true, documentsUrl: true },
      })
      expect(res.json).toHaveBeenCalled()
    })

    it('devuelve 400 sin archivos', async () => {
      const req = mockReq()
      req.files = []
      const res = mockRes()
      const next = jest.fn()

      await handler()(req, res, next)

      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(400)
    })

    it('rechaza con 403 a una COMPANY (middleware requireRole)', async () => {
      const req = mockReq({}, {}, {}, { sub: 'company-1', role: 'COMPANY', email: 'c@x.com' })
      const res = mockRes()
      const next = jest.fn()

      await requireRoleMw()(req, res, next)

      const err = (next as jest.Mock).mock.calls[0][0] as any
      expect(err.statusCode).toBe(403)
    })
  })
})
