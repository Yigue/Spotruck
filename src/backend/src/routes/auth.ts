import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { config } from '../config/index.js'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { authenticate } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['COMPANY', 'DRIVER']),
  companyName: z.string().optional(),
  companyCuit: z.string().optional(),
  driverLicense: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleType: z.string().optional(),
  phone: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

function signTokens(userId: string, role: string, email: string) {
  const accessToken = jwt.sign(
    { sub: userId, role, email },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'] }
  )
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
  )
  return { accessToken, refreshToken }
}

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return next(errors.conflict('Email already registered'))

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        companyName: data.companyName,
        companyCuit: data.companyCuit,
        driverLicense: data.driverLicense,
        vehiclePlate: data.vehiclePlate,
        vehicleType: data.vehicleType,
        phone: data.phone,
      },
    })

    const tokens = signTokens(user.id, user.role, user.email)
    res.status(201).json({ data: { user: { id: user.id, email: user.email, role: user.role }, ...tokens } })
  } catch (err) {
    next(err)
  }
})

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return next(errors.unauthorized('Invalid credentials'))

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return next(errors.unauthorized('Invalid credentials'))

    const tokens = signTokens(user.id, user.role, user.email)
    res.json({ data: { user: { id: user.id, email: user.email, role: user.role }, ...tokens } })
  } catch (err) {
    next(err)
  }
})

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return next(errors.badRequest('refreshToken required'))

    const payload = jwt.verify(refreshToken, config.jwt.secret) as { sub: string; type: string }
    if (payload.type !== 'refresh') return next(errors.unauthorized('Invalid refresh token'))

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) return next(errors.unauthorized('User not found'))

    const tokens = signTokens(user.id, user.role, user.email)
    res.json({ data: tokens })
  } catch {
    next(errors.unauthorized('Invalid or expired refresh token'))
  }
})

// POST /auth/logout
router.post('/logout', authenticate, (_req, res) => {
  res.json({ data: { success: true } })
})

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true, email: true, role: true,
      companyName: true, companyCuit: true, phone: true,
      driverLicense: true, vehiclePlate: true, vehicleType: true,
      vehicleCapacity: true, ratingAvg: true, tripsCompleted: true, createdAt: true,
    },
  })
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } })
    return
  }
  res.json({ data: user })
})

export { router as authRouter }
