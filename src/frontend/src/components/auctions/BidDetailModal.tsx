import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { whatsappLink } from '../../utils/geo'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { BidWithDetails } from './BidList'

interface BidDetailModalProps {
  bid: BidWithDetails | null
  canDecide: boolean
  onClose: () => void
  onDecided: () => void
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

const Stars = ({ avg, count }: { avg: number; count: number }) => (
  <span className="text-sm">
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={s <= Math.round(avg) ? 'text-warning' : 'text-secondary-300'}>
        ★
      </span>
    ))}
    <span className="text-text-muted ml-1">({count})</span>
  </span>
)

// Modal de detalle del postulante (app original): perfil del transportista,
// camión, precio propuesto, aclaración y botones ACEPTAR / RECHAZAR
export function BidDetailModal({ bid, canDecide, onClose, onDecided }: BidDetailModalProps) {
  const [confirm, setConfirm] = useState<'accept' | 'reject' | null>(null)
  const [loading, setLoading] = useState(false)

  if (!bid) return null

  const handleDecision = async () => {
    if (!confirm) return
    setLoading(true)
    try {
      await api.patch(`/bids/${bid.id}`, { action: confirm })
      toast.success(confirm === 'accept' ? 'Oferta aceptada, viaje asignado' : 'Oferta rechazada')
      setConfirm(null)
      onDecided()
    } catch {
      toast.error('No se pudo procesar la decisión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Modal open={!!bid} onClose={onClose}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={bid.user.companyName} size="lg" />
            <div className="flex-1">
              <p className="font-bold">
                {bid.user.companyName || 'Transportista'}
                {bid.user.documentsStatus === 'APPROVED' && (
                  <span className="ml-2 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full align-middle">
                    ✓ Verificado
                  </span>
                )}
              </p>
              <Stars avg={bid.user.ratingAvg} count={bid.user.ratingCount ?? 0} />
            </div>
            {bid.user.phone && (
              <a
                href={whatsappLink(bid.user.phone)}
                target="_blank"
                rel="noreferrer"
                className="bg-success text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-success/80 transition-colors"
                title="Contactar por WhatsApp"
              >
                ✆
              </a>
            )}
          </div>

          <div className="divide-y divide-secondary-500/10 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-text-muted">Viajes realizados</span>
              <span className="font-medium">{bid.user.tripsCompleted ?? 0}</span>
            </div>
            {bid.truck && (
              <>
                <div className="flex justify-between py-2">
                  <span className="text-text-muted">Camión</span>
                  <span className="font-medium">
                    {bid.truck.type} ({bid.truck.plate})
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-text-muted">Capacidad</span>
                  <span className="font-medium">
                    {bid.truck.capacityKg.toLocaleString('es-AR')} kg
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between py-2">
              <span className="text-text-muted">Precio propuesto</span>
              <span className="font-mono font-semibold text-accent">{formatPrice(bid.amount)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-muted">Día de postulación</span>
              <span className="font-medium">
                {new Date(bid.createdAt).toLocaleString('es-AR')}
              </span>
            </div>
            {bid.note && (
              <div className="flex justify-between py-2 gap-4">
                <span className="text-text-muted shrink-0">Aclaración</span>
                <span className="font-medium text-right">{bid.note}</span>
              </div>
            )}
          </div>

          {canDecide && bid.status === 'PENDING' && (
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="primary" onClick={() => setConfirm('accept')}>
                Aceptar
              </Button>
              <Button variant="danger" onClick={() => setConfirm('reject')}>
                Rechazar
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm === 'accept'}
        title="¿Estás seguro?"
        description="Se cerrará la subasta y se asignará el viaje a este transportista"
        confirmLabel="¡Sí, aceptar!"
        loading={loading}
        onConfirm={handleDecision}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'reject'}
        title="¿Rechazar esta oferta?"
        description="El transportista será notificado"
        confirmLabel="Sí, rechazar"
        loading={loading}
        onConfirm={handleDecision}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
