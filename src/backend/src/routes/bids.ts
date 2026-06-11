import { Router } from 'express'
import { z } from 'zod'
import { bidService } from '../services/bidService.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

const decisionSchema = z.object({
  action: z.enum(['accept', 'reject']),
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
