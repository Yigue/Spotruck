import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useAuthStore } from '../hooks/useAuthStore'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Record<string, number>>({})

  useEffect(() => {
    // Placeholder stats — se llenan cuando haya datos reales
    setStats({
      tripsActive: 3,
      tripsCompleted: 12,
      auctionsWon: 2,
      pendingBids: 5,
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-text mb-6">
        Hola, {user?.companyName || user?.email}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Viajes activos" value={stats.tripsActive} icon="🚚" color="primary" />
        <StatCard label="Viajes completados" value={stats.tripsCompleted} icon="✅" color="success" />
        <StatCard label="Subastas ganadas" value={stats.auctionsWon} icon="🏆" color="accent" />
        <StatCard label="Pujas pendientes" value={stats.pendingBids} icon="🔨" color="warning" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTripsCard />
        <QuickActionsCard />
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
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

function RecentTripsCard() {
  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-4">Viajes recientes</h2>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-background rounded">
            <div>
              <p className="font-medium text-sm">Rosario → Buenos Aires</p>
              <p className="text-xs text-text-muted">Carga: Pallets • 15/06/2026</p>
            </div>
            <span className="badge badge-success">Activo</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActionsCard() {
  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-4">Acciones rápidas</h2>
      <div className="space-y-2">
        <a href="/trips/new" className="btn-primary w-full text-center block">+ Publicar nuevo viaje</a>
        <a href="/auctions" className="btn-secondary w-full text-center block">Ver subastas activas</a>
        <a href="/trips" className="btn-ghost w-full text-center block">Mis viajes</a>
      </div>
    </div>
  )
}
