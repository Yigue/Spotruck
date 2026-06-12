import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { tripStatusLabels, cargoLabels } from '../utils/labels'

interface MyBid {
  id: string
  amount: number
  note?: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  createdAt: string
  truck?: { plate: string; type: string } | null
  auction: {
    status: string
    trip: {
      id: string
      originAddress: string
      destAddress: string
      scheduledDate: string
      status: string
      cargoType: string
    }
  }
}

const bidBadge: Record<MyBid['status'], { label: string; variant: 'success' | 'error' | 'info' | 'warning' }> = {
  PENDING: { label: 'Pendiente', variant: 'info' },
  ACCEPTED: { label: 'Aceptada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'error' },
  WITHDRAWN: { label: 'Retirada', variant: 'warning' },
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

// "Mis Postulaciones" del legacy (JS/Camionero/misPostulaciones.js),
// modernizada: lista de ofertas propias con estado y retiro de pendientes
export default function MyBidsPage() {
  const navigate = useNavigate()
  const [bids, setBids] = useState<MyBid[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawId, setWithdrawId] = useState<string | null>(null)

  const load = useCallback(() => {
    api
      .get('/bids/me', { params: { limit: 50 } })
      .then(({ data }) => setBids(data.data))
      .catch(() => toast.error('No se pudieron cargar tus postulaciones'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  const handleWithdraw = async () => {
    if (!withdrawId) return
    try {
      await api.patch(`/bids/${withdrawId}/withdraw`)
      toast.success('Oferta retirada')
      setWithdrawId(null)
      load()
    } catch (err: unknown) {
      toast.error(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'No se pudo retirar la oferta'
      )
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mis postulaciones</h1>
        <p className="text-text-muted text-sm">{bids.length} ofertas realizadas</p>
      </div>

      {bids.length === 0 ? (
        <EmptyState
          icon="🔨"
          title="Todavía no te postulaste a ningún viaje"
          description="Explorá las publicaciones disponibles y hacé tu primera oferta"
          action={{ label: 'Explorar viajes', onClick: () => navigate('/explore') }}
        />
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => {
            const badge = bidBadge[bid.status]
            const trip = bid.auction.trip
            const canWithdraw = bid.status === 'PENDING' && bid.auction.status === 'OPEN'
            return (
              <Card key={bid.id} className="flex flex-col md:flex-row md:items-center gap-3">
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  <p className="font-medium truncate">
                    {trip.originAddress} → {trip.destAddress}
                  </p>
                  <p className="text-xs text-text-muted">
                    {cargoLabels[trip.cargoType] ?? trip.cargoType} · Salida{' '}
                    {new Date(trip.scheduledDate).toLocaleDateString('es-AR')} · Viaje:{' '}
                    {tripStatusLabels[trip.status] ?? trip.status}
                    {bid.truck && ` · 🚛 ${bid.truck.plate}`}
                  </p>
                  {bid.note && <p className="text-xs text-text-muted italic mt-1">"{bid.note}"</p>}
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-semibold text-accent">{formatPrice(bid.amount)}</span>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  {canWithdraw && (
                    <Button size="sm" variant="danger" onClick={() => setWithdrawId(bid.id)}>
                      Retirar
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!withdrawId}
        title="¿Retirar tu oferta?"
        description="La empresa ya no podrá aceptarla"
        confirmLabel="Sí, retirar"
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawId(null)}
      />
    </div>
  )
}
