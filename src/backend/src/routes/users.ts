import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true, email: true, role: true, companyName: true,
      companyCuit: true, phone: true, driverLicense: true,
      vehiclePlate: true, vehicleType: true, vehicleCapacity: true,
      ratingAvg: true, ratingCount: true, tripsCompleted: true,
      trustScore: true, createdAt: true,
    },
  })
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } })
    return
  }
  res.json({ data: user })
})

const updateUserSchema = z.object({
  companyName: z.string().optional(),
  companyCuit: z.string().optional(),
  phone: z.string().optional(),
  driverLicense: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleCapacity: z.number().optional(),
})

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body)
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data,
      select: { id: true, email: true, role: true, updatedAt: true },
    })
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/profile', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, role: true, companyName: true,
        ratingAvg: true, ratingCount: true,
        tripsCompleted: true, trustScore: true, createdAt: true,
      },
    })
    if (!user) return next(errors.notFound('User'))
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', role } = req.query
    const where = role ? { role: role as 'COMPANY' | 'DRIVER' | 'ADMIN' } : {}
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, select: { id: true, email: true, role: true, ratingAvg: true, tripsCompleted: true, createdAt: true } }),
      prisma.user.count({ where }),
    ])
    res.json({ data: users, meta: { total, page: Number(page), limit } })
  } catch (err) {
    next(err)
  }
})

export { router as usersRouter }
