import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'
import { TripCard } from '../components/trips/TripCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import api from '../utils/api'

interface Trip {
  id: string
  originAddress: string
  destAddress: string
  cargoType: string
  scheduledDate: string
  basePrice: number
  status: string
  user?: { companyName?: string; ratingAvg: number }
  auction?: { currentPrice: number; status: string }
}

interface StatsKpis {
  // empresa
  tripsPublished?: number
  tripsSettled?: number
  totalSpend?: number
  // transportista
  tripsCompleted?: number
  totalIncome?: number
  bidsTotal?: number
  bidsAccepted?: number
  acceptanceRate?: number
  // ambos
  ratingAvg?: number
  ratingCount?: number
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [kpis, setKpis] = useState<StatsKpis>({})
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [statsResult, recentResult] = await Promise.allSettled([
        api.get('/stats/me'),
        api.get('/trips', { params: { limit: 5 } }),
      ])

      if (statsResult.status === 'fulfilled') {
        setKpis(statsResult.value.data.data.kpis ?? {})
      }
      if (recentResult.status === 'fulfilled') {
        setRecentTrips(recentResult.value.data.data || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">
        Hola, {user?.companyName || user?.email}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {user?.role === 'DRIVER' ? (
          <>
            <StatCard label="Viajes realizados" value={String(kpis.tripsCompleted ?? 0)} icon="🚚" color="primary" />
            <StatCard label="Ingresos (6 meses)" value={formatPrice(kpis.totalIncome ?? 0)} icon="💰" color="success" />
            <StatCard label="Ofertas aceptadas" value={`${kpis.bidsAccepted ?? 0} de ${kpis.bidsTotal ?? 0}`} icon="🏆" color="accent" />
            <StatCard
              label="Rating"
              value={kpis.ratingCount ? `★ ${(kpis.ratingAvg ?? 0).toFixed(1)}` : '—'}
              icon="⭐"
              color="warning"
            />
          </>
        ) : (
          <>
            <StatCard label="Publicaciones (6 meses)" value={String(kpis.tripsPublished ?? 0)} icon="📦" color="primary" />
            <StatCard label="Viajes finalizados" value={String(kpis.tripsSettled ?? 0)} icon="✅" color="success" />
            <StatCard label="Gasto en fletes" value={formatPrice(kpis.totalSpend ?? 0)} icon="💸" color="accent" />
            <StatCard
              label="Rating"
              value={kpis.ratingCount ? `★ ${(kpis.ratingAvg ?? 0).toFixed(1)}` : '—'}
              icon="⭐"
              color="warning"
            />
          </>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips Card */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Viajes recientes</h2>
          {recentTrips.length > 0 ? (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🚚"
              title="No hay viajes recientes"
              description="Publica tu primer viaje para comenzar"
              action={{
                label: 'Crear viaje',
                onClick: () => navigate('/trips/new'),
              }}
            />
          )}
        </div>

        {/* Quick Actions Card */}
        <QuickActionsCard navigate={navigate} />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string
  icon: string
  color: string
}) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary',
    success: 'bg-success/10 text-success',
    accent: 'bg-accent-50 text-accent',
    warning: 'bg-warning/10 text-warning',
  }
  return (
    <div className={`card flex items-center gap-4 ${colors[color]}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-text-muted">{label}</p>
      </div>
    </div>
  )
}

function QuickActionsCard({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-4">Acciones rápidas</h2>
      <div className="space-y-2">
        <button
          onClick={() => navigate('/trips/new')}
          className="btn-primary w-full text-center block"
        >
          + Publicar nuevo viaje
        </button>
        <button
          onClick={() => navigate('/auctions')}
          className="btn-secondary w-full text-center block"
        >
          Ver subastas activas
        </button>
        <button
          onClick={() => navigate('/trips')}
          className="btn-ghost w-full text-center block"
        >
          Mis viajes
        </button>
      </div>
    </div>
  )
}