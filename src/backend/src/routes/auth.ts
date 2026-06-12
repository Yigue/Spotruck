import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { config } from '../config/index.js'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { emailService } from '../services/emailService.js'
import { validateCuit, CUIT_ERROR } from '../utils/cuit.js'
import { authenticate } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()

// Mismas reglas que muestra el frontend: el backend es la autoridad.
// Compartido entre registro y reset de contraseña.
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe incluir una mayúscula')
  .regex(/[a-z]/, 'La contraseña debe incluir una minúscula')
  .regex(/\d/, 'La contraseña debe incluir un número')

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum(['COMPANY', 'DRIVER']),
  companyName: z.string().optional(),
  companyCuit: z.string().refine((v) => validateCuit(v), CUIT_ERROR).optional(),
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
    const emailVerifyToken = randomUUID()

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
        emailVerifyToken,
      },
    })

    const verifyUrl = `${config.frontendUrl}/verify-email?token=${emailVerifyToken}`
    await emailService.send(
      user.email,
      'Verificá tu cuenta de Spottruck',
      emailService.verificationEmailHtml(verifyUrl)
    )

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

// POST /auth/forgot-password — pide el link de reset. SIEMPRE responde 200
// para no revelar si el email existe (anti enumeración de usuarios)
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const token = randomUUID()
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
        },
      })
      const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`
      await emailService.send(
        user.email,
        'Restablecé tu contraseña de Spottruck',
        emailService.passwordResetEmailHtml(resetUrl)
      )
    }

    res.json({ data: { sent: true } })
  } catch (err) {
    next(err)
  }
})

// POST /auth/reset-password — cambia la contraseña con el token del email
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = z
      .object({ token: z.string().min(1), password: passwordSchema })
      .parse(req.body)

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } },
    })
    if (!user) return next(errors.badRequest('Token inválido o vencido'))

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    })

    res.json({ data: { reset: true } })
  } catch (err) {
    next(err)
  }
})

// POST /auth/verify-email — confirma el email con el token del link
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } })
    if (!user) return next(errors.badRequest('Token inválido o ya utilizado'))

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    })

    res.json({ data: { verified: true } })
  } catch (err) {
    next(err)
  }
})

// POST /auth/resend-verification — reenvía el email de verificación
router.post('/resend-verification', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } })
    if (!user) return next(errors.notFound('User'))
    if (user.emailVerified) return next(errors.badRequest('El email ya está verificado'))

    const emailVerifyToken = user.emailVerifyToken ?? randomUUID()
    if (!user.emailVerifyToken) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken } })
    }

    const verifyUrl = `${config.frontendUrl}/verify-email?token=${emailVerifyToken}`
    const result = await emailService.send(
      user.email,
      'Verificá tu cuenta de Spottruck',
      emailService.verificationEmailHtml(verifyUrl)
    )

    res.json({ data: { sent: result.sent, devMode: !emailService.isConfigured() } })
  } catch (err) {
    next(err)
  }
})

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true, email: true, role: true, emailVerified: true,
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
