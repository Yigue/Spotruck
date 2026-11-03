import { Router } from 'express'
import path from 'path'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { authenticate } from '../middleware/auth.js'
import { UPLOAD_ROOT } from '../middleware/upload.js'

// Documentación sensible (licencia, cédula, seguro): NO se sirve como estático
// público. Solo el dueño o un admin pueden descargarla, con su token.
const router = Router()
const uuid = z.string().uuid()

// Solo un nombre de archivo plano: sin separadores ni '..' (anti path traversal)
const isPlainFilename = (name: string) =>
  name.length > 0 && name === path.basename(name) && !name.includes('..') && !name.includes('\0')

function sendPrivateFile(
  res: import('express').Response,
  next: import('express').NextFunction,
  dir: string,
  filename: string
) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.sendFile(filename, { root: dir, dotfiles: 'deny' }, (err) => {
    if (err) next(errors.notFound('File'))
  })
}

// GET /files/documents/trucks/:truckId/:filename — documentos de un camión
router.get('/documents/trucks/:truckId/:filename', authenticate, async (req, res, next) => {
  try {
    const truckId = req.params.truckId as string
    const filename = req.params.filename as string
    if (!uuid.safeParse(truckId).success || !isPlainFilename(filename)) {
      return next(errors.badRequest('Invalid file reference'))
    }
    const truck = await prisma.truck.findUnique({ where: { id: truckId }, select: { ownerId: true } })
    if (!truck) return next(errors.notFound('Truck'))
    if (truck.ownerId !== req.user!.sub && req.user!.role !== 'ADMIN') return next(errors.forbidden())

    sendPrivateFile(res, next, path.join(UPLOAD_ROOT, 'documents', 'trucks', truckId), filename)
  } catch (err) {
    next(err)
  }
})

// GET /files/documents/:ownerId/:filename — documentación personal del transportista
router.get('/documents/:ownerId/:filename', authenticate, (req, res, next) => {
  const ownerId = req.params.ownerId as string
  const filename = req.params.filename as string
  if (!uuid.safeParse(ownerId).success || !isPlainFilename(filename)) {
    return next(errors.badRequest('Invalid file reference'))
  }
  if (ownerId !== req.user!.sub && req.user!.role !== 'ADMIN') return next(errors.forbidden())

  sendPrivateFile(res, next, path.join(UPLOAD_ROOT, 'documents', ownerId), filename)
})

export { router as filesRouter }
