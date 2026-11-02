import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../hooks/useAuthStore'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

// "Mis Postulaciones" de la app original (Vista/Camionero/misPostulaciones.html),
// modernizada: filtros por estado + retiro de ofertas pendientes.

interface MyBid {
  id: string
  amount: number
  note: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  createdAt: string
  auction: {
    id: string
    type: 'OPEN' | 'DUTCH' | 'SEALED'
    status: string
    currentPrice: number
    trip: {
      id: string
      originAddress: string
      destAddress: string
      scheduledDate: string
      status: string
      cargoType: string
      basePrice: number
    }
  }
  truck: { id: string; plate: string; type: string } | null
}

const statusFilters: { value: string; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'ACCEPTED', label: 'Aceptadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
  { value: 'WITHDRAWN', label: 'Retiradas' },
]

const statusBadge: Record<MyBid['status'], { label: string; variant: 'success' | 'error' | 'info' | 'warning' }> = {
  PENDING: { label: 'Pendiente', variant: 'info' },
  ACCEPTED: { label: 'Aceptada', variant: 'success' },
  REJECTED: { label: 'Rechazada', variant: 'error' },
  WITHDRAWN: { label: 'Retirada', variant: 'warning' },
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

export default function MyBidsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [bids, setBids] = useState<MyBid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [withdrawTarget, setWithdrawTarget] = useState<MyBid | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)

  const fetchBids = useCallback(async () => {
    // El endpoint es solo para transportistas: sin rol DRIVER no se consulta
    if (user?.role !== 'DRIVER') return
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number> = { page: 1, limit: 50 }
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/bids/me', { params })
      setBids(data.data ?? [])
    } catch {
      setError('Error al cargar tus postulaciones')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, user?.role])

  useEffect(() => {
    fetchBids()
  }, [fetchBids])

  const handleWithdraw = async () => {
    if (!withdrawTarget) return
    setWithdrawing(true)
    try {
      await api.patch(`/bids/${withdrawTarget.id}/withdraw`)
      // Actualización optimista de la fila; el refetch trae el estado canónico
      setBids((prev) =>
        prev.map((b) => (b.id === withdrawTarget.id ? { ...b, status: 'WITHDRAWN' } : b))
      )
      toast.success('Oferta retirada')
      setWithdrawTarget(null)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'No se pudo retirar la oferta'
      toast.error(message)
      setWithdrawTarget(null)
      // El estado local puede haber quedado viejo: se refetchea el canónico
      fetchBids()
    } finally {
      setWithdrawing(false)
    }
  }

  if (user?.role !== 'DRIVER') {
    return (
      <EmptyState
        icon="🚫"
        title="Acceso denegado"
        description="Esta sección es solo para transportistas"
        action={{ label: 'Ir al dashboard', onClick: () => navigate('/dashboard') }}
      />
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mis ofertas</h1>

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-surface text-text-muted hover:bg-primary/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {error && !loading && (
        <EmptyState
          icon="❌"
          title="Error al cargar"
          description={error}
          action={{ label: 'Reintentar', onClick: fetchBids }}
        />
      )}

      {!loading && !error && bids.length === 0 && (
        <EmptyState
          icon="📋"
          title="Aún no te postulaste a ningún viaje"
          description={
            statusFilter
              ? 'No hay postulaciones con este estado'
              : 'Explorá los viajes disponibles y hacé tu primera oferta'
          }
          action={{ label: 'Explorar viajes', onClick: () => navigate('/trips') }}
        />
      )}

      {!loading && !error && bids.length > 0 && (
        <div className="space-y-3">
          {bids.map((bid) => {
            const badge = statusBadge[bid.status]
            const canWithdraw = bid.status === 'PENDING' && bid.auction.status === 'OPEN'
            return (
              <Card key={bid.id}>
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => navigate(`/trips/${bid.auction.trip.id}`)}
                  >
                    <p className="font-medium truncate">
                      {bid.auction.trip.originAddress}{' '}
                      <span className="text-text-muted">→</span>{' '}
                      {bid.auction.trip.destAddress}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Salida:{' '}
                      {new Date(bid.auction.trip.scheduledDate).toLocaleDateString('es-AR')}
                      {bid.truck && ` · Camión ${bid.truck.plate}`}
                      {' · Postulado el '}
                      {new Date(bid.createdAt).toLocaleDateString('es-AR')}
                    </p>
                    {bid.note && (
                      <p className="text-xs text-text-muted mt-0.5 italic truncate">
                        “{bid.note}”
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-semibold text-accent">
                      {formatPrice(bid.amount)}
                    </span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {canWithdraw && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setWithdrawTarget(bid)}
                      >
                        Retirar oferta
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!withdrawTarget}
        title="¿Retirar esta oferta?"
        description={`Vas a retirar tu oferta de ${
          withdrawTarget ? formatPrice(withdrawTarget.amount) : ''
        }. La empresa dejará de verla entre los postulantes.`}
        confirmLabel="Sí, retirar"
        loading={withdrawing}
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawTarget(null)}
      />
    </div>
  )
}
