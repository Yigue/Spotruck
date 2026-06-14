import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { notificationService } from '../services/notificationService.js'
import { validateCuit, CUIT_ERROR } from '../utils/cuit.js'
import { makeUploader, IMG_MIMES, DOC_MIMES } from '../utils/uploads.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

const avatarUpload = makeUploader('avatars', 2, IMG_MIMES)
const docUpload = makeUploader('documents', 5, DOC_MIMES)

// POST /users/me/avatar — foto de perfil (jpg/png/webp, máx 2 MB)
router.post('/me/avatar', authenticate, avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return next(errors.badRequest('Subí una imagen jpg, png o webp de hasta 2 MB'))
    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    await prisma.user.update({ where: { id: req.user!.sub }, data: { avatarUrl } })
    res.json({ data: { avatarUrl } })
  } catch (err) {
    next(err)
  }
})

// POST /users/me/documents — documentación del transportista para la
// verificación (licencia, cédula, seguro; jpg/png/pdf, máx 5 MB)
router.post('/me/documents', authenticate, requireRole('DRIVER'), docUpload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) return next(errors.badRequest('Subí un jpg, png o pdf de hasta 5 MB'))
    const url = `/uploads/documents/${req.file.filename}`
    const updated = await prisma.user.update({
      where: { id: req.user!.sub },
      data: { documentsUrl: { push: url } },
      select: { documentsUrl: true },
    })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// POST /users/me/request-verification — el transportista pide la revisión
// de su documentación (licencia + camiones cargados)
router.post('/me/request-verification', authenticate, requireRole('DRIVER'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { _count: { select: { trucks: true } } },
    })
    if (!user) return next(errors.notFound('User'))
    if (user.documentsStatus === 'APPROVED') {
      return next(errors.badRequest('Tu documentación ya está aprobada'))
    }
    if (user.documentsStatus === 'PENDING') {
      return next(errors.badRequest('Ya hay una revisión en curso'))
    }
    if (!user.driverLicense) {
      return next(errors.badRequest('Cargá tu licencia de conducir en el perfil antes de solicitar la verificación'))
    }
    if (user._count.trucks === 0) {
      return next(errors.badRequest('Cargá al menos un camión antes de solicitar la verificación'))
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { documentsStatus: 'PENDING' },
      select: { id: true, documentsStatus: true },
    })

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// PATCH /users/:id/verify — el admin aprueba o rechaza la documentación
router.patch('/:id/verify', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { action, note } = z
      .object({ action: z.enum(['approve', 'reject']), note: z.string().max(500).optional() })
      .parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } })
    if (!user) return next(errors.notFound('User'))
    if (user.documentsStatus !== 'PENDING') {
      return next(errors.badRequest('User has no pending verification'))
    }

    const documentsStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { documentsStatus },
      select: { id: true, documentsStatus: true },
    })

    await notificationService.createInApp(
      user.id,
      'DOCUMENTS_REVIEWED',
      action === 'approve'
        ? '✓ Tu cuenta fue verificada'
        : 'Tu documentación fue rechazada',
      action === 'approve'
        ? 'Tu perfil ahora muestra la insignia de transportista verificado'
        : note || 'Revisá tus datos y volvé a solicitar la verificación',
      { documentsStatus }
    )

    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: {
      id: true, email: true, role: true, companyName: true,
      companyCuit: true, phone: true, driverLicense: true,
      vehiclePlate: true, vehicleType: true, vehicleCapacity: true,
      preferredZone: true, emailVerified: true, documentsStatus: true,
      avatarUrl: true, documentsUrl: true,
      address: true, website: true, sector: true,
      ratingAvg: true, ratingCount: true, tripsCompleted: true,
      trustScore: true, createdAt: true,
      trucks: { where: { active: true } },
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
  companyCuit: z.string().refine((v) => validateCuit(v), CUIT_ERROR).optional(),
  phone: z.string().optional(),
  driverLicense: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleType: z.string().optional(),
  vehicleCapacity: z.number().optional(),
  preferredZone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  sector: z.string().optional(),
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
        id: true, role: true, companyName: true, companyCuit: true,
        phone: true, address: true, website: true, sector: true,
        documentsStatus: true, avatarUrl: true,
        ratingAvg: true, ratingCount: true,
        tripsCompleted: true, trustScore: true, createdAt: true,
        trucks: {
          where: { active: true },
          select: { id: true, plate: true, type: true, capacityKg: true, preferredCargo: true },
        },
      },
    })
    if (!user) return next(errors.notFound('User'))

    // El teléfono de una empresa es contacto comercial (visible, como en la
    // app original). El de un transportista solo lo ven empresas y admins.
    const showPhone =
      user.role === 'COMPANY' || ['COMPANY', 'ADMIN'].includes(req.user!.role)
    res.json({ data: showPhone ? user : { ...user, phone: null } })
  } catch (err) {
    next(err)
  }
})

router.get('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', role, documentsStatus } = z
      .object({
        page: z.string().optional(),
        limit: z.string().optional(),
        role: z.enum(['COMPANY', 'DRIVER', 'ADMIN']).optional(),
        documentsStatus: z.enum(['NONE', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
      })
      .parse(req.query)
    const where: Record<string, unknown> = {}
    if (role) where.role = role as 'COMPANY' | 'DRIVER' | 'ADMIN'
    if (documentsStatus) where.documentsStatus = documentsStatus
    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, select: { id: true, email: true, role: true, companyName: true, driverLicense: true, documentsStatus: true, ratingAvg: true, tripsCompleted: true, createdAt: true } }),
      prisma.user.count({ where }),
    ])
    res.json({ data: users, meta: { total, page: Number(page), limit } })
  } catch (err) {
    next(err)
  }
})

export { router as usersRouter }
