import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

const truckSchema = z.object({
  plate: z.string().min(6).max(10),
  type: z.enum(['JAULA', 'SEMI', 'TOLVA', 'BATEA', 'FURGON', 'REFRIGERADO', 'PLAYO', 'OTRO']),
  capacityKg: z.number().positive(),
  preferredCargo: z.enum(['BULK', 'PALLETS', 'GENERAL', 'REFRIGERATED']).optional(),
  senasaNumber: z.string().optional(),
  insurance: z
    .object({
      aseguradora: z.string(),
      tipo: z.string(),
      monto: z.number().positive().optional(),
      vencimiento: z.string().optional(),
    })
    .optional(),
})

const updateTruckSchema = truckSchema.partial().extend({
  active: z.boolean().optional(),
})

// GET /trucks — flota propia del transportista
router.get('/', authenticate, requireRole('DRIVER', 'ADMIN'), async (req, res, next) => {
  try {
    const trucks = await prisma.truck.findMany({
      where: { ownerId: req.user!.sub },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ data: trucks })
  } catch (err) {
    next(err)
  }
})

// POST /trucks
router.post('/', authenticate, requireRole('DRIVER'), async (req, res, next) => {
  try {
    const data = truckSchema.parse(req.body)
    const existing = await prisma.truck.findUnique({ where: { plate: data.plate } })
    if (existing) return next(errors.conflict('A truck with this plate already exists'))

    const truck = await prisma.truck.create({
      data: { ...data, ownerId: req.user!.sub },
    })
    res.status(201).json({ data: truck })
  } catch (err) {
    next(err)
  }
})

// POST /trucks/:id/documents — Subida de documentación del camión (Placeholder Fase 3)
router.post('/:id/documents', authenticate, requireRole('DRIVER', 'ADMIN'), async (req, res, next) => {
  try {
    const truck = await prisma.truck.findUnique({ where: { id: req.params.id as string } })
    if (!truck) return next(errors.notFound('Truck'))
    if (truck.ownerId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return next(errors.forbidden())
    }

    // Acá iría la integración con multer + S3
    const fileUrl = 'https://fake-s3-bucket.com/uploads/truck_doc_placeholder.jpg'

    const updated = await prisma.truck.update({
      where: { id: truck.id },
      data: { documentsUrl: { push: fileUrl } }
    })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// PUT /trucks/:id
router.put('/:id', authenticate, requireRole('DRIVER', 'ADMIN'), async (req, res, next) => {
  try {
    const truck = await prisma.truck.findUnique({ where: { id: req.params.id as string } })
    if (!truck) return next(errors.notFound('Truck'))
    if (truck.ownerId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return next(errors.forbidden())
    }

    const data = updateTruckSchema.parse(req.body)
    const updated = await prisma.truck.update({
      where: { id: truck.id },
      data,
    })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /trucks/:id — baja lógica si el camión tiene ofertas asociadas
router.delete('/:id', authenticate, requireRole('DRIVER', 'ADMIN'), async (req, res, next) => {
  try {
    const truck = await prisma.truck.findUnique({
      where: { id: req.params.id as string },
      include: { _count: { select: { bids: true } } },
    })
    if (!truck) return next(errors.notFound('Truck'))
    if (truck.ownerId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return next(errors.forbidden())
    }

    if (truck._count.bids > 0) {
      await prisma.truck.update({ where: { id: truck.id }, data: { active: false } })
      res.json({ data: { success: true, deactivated: true } })
      return
    }

    await prisma.truck.delete({ where: { id: truck.id } })
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

export { router as trucksRouter }
