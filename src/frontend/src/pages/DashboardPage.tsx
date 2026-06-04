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

interface UserStats {
  tripsActive: number
  tripsCompleted: number
  auctionsWon: number
  pendingBids: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<UserStats>({
    tripsActive: 0,
    tripsCompleted: 0,
    auctionsWon: 0,
    pendingBids: 0,
  })
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user stats from /users/me
        const userResponse = await api.get('/users/me')
        const userData = userResponse.data.data
        setStats({
          tripsActive: userData.tripsActive || 0,
          tripsCompleted: userData.tripsCompleted || 0,
          auctionsWon: userData.auctionsWon || 0,
          pendingBids: userData.pendingBids || 0,
        })
      } catch {
        // Stats not available, keep defaults
      }

      try {
        // Fetch recent trips
        const tripsResponse = await api.get('/trips', { params: { limit: 5 } })
        setRecentTrips(tripsResponse.data.data || [])
      } catch {
        setError('Error al cargar datos')
      } finally {
        setLoading(false)
      }
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
        <StatCard
          label="Viajes activos"
          value={stats.tripsActive}
          icon="🚚"
          color="primary"
        />
        <StatCard
          label="Viajes completados"
          value={stats.tripsCompleted}
          icon="✅"
          color="success"
        />
        <StatCard
          label="Subastas ganadas"
          value={stats.auctionsWon}
          icon="🏆"
          color="accent"
        />
        <StatCard
          label="Pujas pendientes"
          value={stats.pendingBids}
          icon="🔨"
          color="warning"
        />
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
  value: number
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