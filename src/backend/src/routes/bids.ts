import { Router } from 'express'
import { z } from 'zod'
import { bidService } from '../services/bidService.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

const decisionSchema = z.object({
  action: z.enum(['accept', 'reject']),
})

const modifyBidSchema = z.object({
  amount: z.number().positive().optional(),
  note: z.string().max(500).optional(),
}).refine(data => data.amount !== undefined || data.note !== undefined, {
  message: 'Must provide amount or note to update'
})

// GET /bids/me — el transportista lista sus postulaciones
router.get('/me', authenticate, requireRole('DRIVER'), async (req, res, next) => {
  try {
    const { page = '1', limit = '20', status } = req.query
    const result = await bidService.getMyBids(
      req.user!.sub,
      Number(page),
      Number(limit),
      status as string | undefined
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// PATCH /bids/:id/withdraw — el transportista retira su oferta
router.patch('/:id/withdraw', authenticate, requireRole('DRIVER'), async (req, res, next) => {
  try {
    const bid = await bidService.withdrawBid(req.params.id as string, req.user!.sub)
    res.json({ data: bid })
  } catch (err) {
    next(err)
  }
})

// PUT /bids/:id — el transportista modifica su oferta (monto o aclaración)
router.put('/:id', authenticate, requireRole('DRIVER'), async (req, res, next) => {
  try {
    const { amount, note } = modifyBidSchema.parse(req.body)
    const bid = await bidService.modifyBid(req.params.id as string, req.user!.sub, amount, note)
    res.json({ data: bid })
  } catch (err) {
    next(err)
  }
})

// PATCH /bids/:id — la empresa acepta o rechaza la oferta de un transportista.
// Aceptar cierra la subasta, rechaza el resto de las ofertas y asigna el viaje.
router.patch('/:id', authenticate, requireRole('COMPANY', 'ADMIN'), async (req, res, next) => {
  try {
    const { action } = decisionSchema.parse(req.body)
    const bidId = req.params.id as string

    if (action === 'accept') {
      const result = await bidService.acceptBid(bidId, req.user!.sub, req.user!.role)
      res.json({ data: result })
      return
    }

    const bid = await bidService.rejectBid(bidId, req.user!.sub, req.user!.role)
    res.json({ data: bid })
  } catch (err) {
    next(err)
  }
})

export { router as bidsRouter }
