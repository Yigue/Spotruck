import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuthStore'
import { TripCard } from '../components/trips/TripCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
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
  const [listTitle, setListTitle] = useState('Viajes recientes')
  const [loading, setLoading] = useState(true)

  const role = user?.role

  useEffect(() => {
    const fetchData = async () => {
      // Cada rol ve lo que le sirve: la empresa sus publicaciones; el transportista
      // sus viajes asignados o, si no tiene, los disponibles en el mercado.
      const loadTrips = async (): Promise<{ title: string; trips: Trip[] }> => {
        if (role === 'DRIVER') {
          const mine = await api.get('/trips', { params: { mine: true, limit: 5 } })
          if ((mine.data.data ?? []).length > 0) return { title: 'Tus viajes', trips: mine.data.data }
          const market = await api.get('/trips', { params: { status: 'AUCTION', limit: 5 } })
          return { title: 'Viajes disponibles ahora', trips: market.data.data ?? [] }
        }
        const res = await api.get('/trips', { params: { limit: 5 } })
        return { title: role === 'ADMIN' ? 'Viajes recientes' : 'Tus publicaciones recientes', trips: res.data.data ?? [] }
      }

      const [statsResult, tripsResult] = await Promise.allSettled([api.get('/stats/me'), loadTrips()])

      if (statsResult.status === 'fulfilled') {
        setKpis(statsResult.value.data.data.kpis ?? {})
      }
      if (tripsResult.status === 'fulfilled') {
        setRecentTrips(tripsResult.value.trips)
        setListTitle(tripsResult.value.title)
      }

      setLoading(false)
    }

    fetchData()
  }, [role])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
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
        {/* Acciones rápidas primero en mobile: es lo primero que se busca con el pulgar */}
        <div className="order-first lg:order-last">
          <QuickActionsCard role={role} navigate={navigate} />
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-4">{listTitle}</h2>
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
          ) : role === 'DRIVER' ? (
            <EmptyState
              icon="🗺️"
              title="Todavía no hay viajes disponibles"
              description="Cuando una empresa publique un viaje, lo vas a ver acá y en el mapa"
              action={{ label: 'Explorar el mapa', onClick: () => navigate('/explore') }}
            />
          ) : (
            <EmptyState
              icon="🚚"
              title="No hay viajes todavía"
              description="Publicá tu primer viaje para empezar a recibir ofertas"
              action={{ label: 'Publicar viaje', onClick: () => navigate('/trips/new') }}
            />
          )}
        </div>
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

function QuickActionsCard({ role, navigate }: { role?: string; navigate: (path: string) => void }) {
  const actions: { label: string; to: string; className: string }[] =
    role === 'DRIVER'
      ? [
          { label: '🗺️ Explorar viajes en el mapa', to: '/explore', className: 'btn-primary' },
          { label: 'Mis ofertas', to: '/my-bids', className: 'btn-secondary' },
          { label: 'Mi flota y documentación', to: '/profile', className: 'btn-ghost' },
        ]
      : role === 'ADMIN'
        ? [
            { label: '🛡️ Revisar verificaciones', to: '/admin', className: 'btn-primary' },
            { label: 'Ver viajes', to: '/trips', className: 'btn-secondary' },
          ]
        : [
            { label: '+ Publicar nuevo viaje', to: '/trips/new', className: 'btn-primary' },
            { label: 'Mis publicaciones', to: '/trips', className: 'btn-secondary' },
            { label: 'Ver estadísticas', to: '/stats', className: 'btn-ghost' },
          ]

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-4">Acciones rápidas</h2>
      <div className="space-y-2">
        {actions.map((a) => (
          <button key={a.to} onClick={() => navigate(a.to)} className={`${a.className} w-full text-center block`}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
