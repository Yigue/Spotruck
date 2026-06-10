import { useState } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { BidDetailModal } from './BidDetailModal'

export interface BidWithDetails {
  id: string
  amount: number
  note?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  createdAt: string
  user: {
    id: string
    companyName?: string
    ratingAvg: number
    ratingCount?: number
    phone?: string
    tripsCompleted?: number
  }
  truck?: { id: string; plate: string; type: string; capacityKg: number } | null
}

interface BidListProps {
  bids: BidWithDetails[]
  canDecide: boolean
  onDecided: () => void
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

const statusBadge: Record<BidWithDetails['status'], { label: string; variant: 'success' | 'error' | 'info' | 'warning' }> = {
  PENDING: { label: 'Pendiente', variant: 'info' },
  ACCEPTED: { label: 'Aceptada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'error' },
  WITHDRAWN: { label: 'Retirada', variant: 'warning' },
}

// Tabla comparativa de postulantes (vista empresa de la app original)
export function BidList({ bids, canDecide, onDecided }: BidListProps) {
  const [selected, setSelected] = useState<BidWithDetails | null>(null)

  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-secondary-500">
        ¡Nadie se ha postulado a tu viaje todavía!
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted border-b border-secondary-500/20">
              <th className="py-2 pr-4 font-medium">Postulante</th>
              <th className="py-2 pr-4 font-medium">Precio</th>
              <th className="py-2 pr-4 font-medium">Camión</th>
              <th className="py-2 pr-4 font-medium">Fecha</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
              <th className="py-2 font-medium">Ver detalles</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => {
              const badge = statusBadge[bid.status]
              return (
                <tr key={bid.id} className="border-b border-secondary-500/10">
                  <td className="py-3 pr-4 font-medium">
                    {bid.user.companyName || 'Transportista'}
                    {bid.user.ratingAvg > 0 && (
                      <span className="text-warning text-xs ml-2">
                        ★ {bid.user.ratingAvg.toFixed(1)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-mono font-semibold text-accent">
                    {formatPrice(bid.amount)}
                  </td>
                  <td className="py-3 pr-4">{bid.truck ? bid.truck.plate : '—'}</td>
                  <td className="py-3 pr-4 text-text-muted">
                    {new Date(bid.createdAt).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="py-3">
                    <Button size="sm" variant="secondary" onClick={() => setSelected(bid)}>
                      Ver
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <BidDetailModal
        bid={selected}
        canDecide={canDecide}
        onClose={() => setSelected(null)}
        onDecided={() => {
          setSelected(null)
          onDecided()
        }}
      />
    </>
  )
}
