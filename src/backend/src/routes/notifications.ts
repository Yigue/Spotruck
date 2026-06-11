import { Router } from 'express'
import { prisma } from '../models/prisma.js'
import { errors } from '../utils/errors.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// GET /notifications — propias, paginadas, con contador de no leídas
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = '1', limit = '20' } = req.query
    const where = { userId: req.user!.sub }

    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, readAt: null } }),
    ])

    res.json({ data: notifications, meta: { total, unread, page: Number(page), limit: Number(limit) } })
  } catch (err) {
    next(err)
  }
})

// PATCH /notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id as string },
    })
    if (!notification) return next(errors.notFound('Notification'))
    if (notification.userId !== req.user!.sub) return next(errors.forbidden())

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: notification.readAt ?? new Date() },
    })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

// POST /notifications/read-all
router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.sub, readAt: null },
      data: { readAt: new Date() },
    })
    res.json({ data: { updated: result.count } })
  } catch (err) {
    next(err)
  }
})

export { router as notificationsRouter }
