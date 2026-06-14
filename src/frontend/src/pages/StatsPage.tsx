import { useEffect, useState } from 'react'
import api from '../utils/api'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { BarChart, HBarChart, KpiCard } from '../components/charts/SimpleCharts'

interface MonthDatum {
  month: string
  trips?: number
  spend?: number
  amount?: number
}

interface Stats {
  role: 'COMPANY' | 'DRIVER'
  kpis: Record<string, number>
  tripsByMonth?: MonthDatum[]
  incomeByMonth?: MonthDatum[]
  byCargoType?: { type: string; count: number }[]
  bidsByStatus?: Record<string, number>
  scoreDistribution: { score: number; count: number }[]
}

const cargoLabels: Record<string, string> = {
  BULK: 'Granel',
  PALLETS: 'Pallets',
  GENERAL: 'General',
  REFRIGERATED: 'Refrigerada',
}

const bidStatusLabels: Record<string, string> = {
  PENDING: 'Pendientes',
  ACCEPTED: 'Aceptadas',
  REJECTED: 'Rechazadas',
  WITHDRAWN: 'Retiradas',
}

const monthLabel = (key: string) => {
  const [y, m] = key.split('-')
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${names[Number(m) - 1]} ${y.slice(2)}`
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

// "Estadísticas y Gráficos" — beneficio prometido en el informe original
export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/stats/me')
      .then(({ data }) => setStats(data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return <p className="text-center text-text-muted py-12">No se pudieron cargar las estadísticas</p>
  }

  const isDriver = stats.role === 'DRIVER'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-text-muted text-sm">Últimos 6 meses</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isDriver ? (
          <>
            <KpiCard icon="🚚" label="Viajes realizados" value={String(stats.kpis.tripsCompleted)} />
            <KpiCard
              icon="💰"
              label="Ingresos (6 meses)"
              value={formatPrice(stats.kpis.totalIncome)}
              hint="Neto, después de la comisión"
            />
            <KpiCard
              icon="🎯"
              label="Tasa de aceptación"
              value={`${Math.round(stats.kpis.acceptanceRate * 100)}%`}
              hint={`${stats.kpis.bidsAccepted} de ${stats.kpis.bidsTotal} ofertas`}
            />
            <KpiCard
              icon="⭐"
              label="Rating"
              value={stats.kpis.ratingAvg.toFixed(1)}
              hint={`${stats.kpis.ratingCount} valoraciones`}
            />
          </>
        ) : (
          <>
            <KpiCard icon="📦" label="Publicaciones" value={String(stats.kpis.tripsPublished)} />
            <KpiCard icon="✅" label="Viajes finalizados" value={String(stats.kpis.tripsSettled)} />
            <KpiCard icon="💸" label="Gasto en fletes" value={formatPrice(stats.kpis.totalSpend)} />
            <KpiCard
              icon="⭐"
              label="Rating"
              value={stats.kpis.ratingAvg.toFixed(1)}
              hint={`${stats.kpis.ratingCount} valoraciones`}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución mensual */}
        <Card>
          <h2 className="font-bold mb-4">{isDriver ? 'Ingresos por mes' : 'Gasto por mes'}</h2>
          <BarChart
            color={isDriver ? 'bg-primary' : 'bg-accent'}
            data={(isDriver ? stats.incomeByMonth! : stats.tripsByMonth!).map((m) => ({
              label: monthLabel(m.month),
              value: isDriver ? (m.amount ?? 0) : (m.spend ?? 0),
            }))}
          />
        </Card>

        <Card>
          <h2 className="font-bold mb-4">{isDriver ? 'Viajes cobrados por mes' : 'Publicaciones por mes'}</h2>
          <BarChart
            color="bg-secondary-500"
            data={(isDriver ? stats.incomeByMonth! : stats.tripsByMonth!).map((m) => ({
              label: monthLabel(m.month),
              value: m.trips ?? 0,
            }))}
            valueFormatter={(n) => String(n)}
          />
        </Card>

        {/* Distribuciones */}
        {isDriver ? (
          <Card>
            <h2 className="font-bold mb-4">Tus ofertas</h2>
            <HBarChart
              data={Object.entries(bidStatusLabels).map(([status, label]) => ({
                label,
                value: stats.bidsByStatus?.[status] ?? 0,
              }))}
            />
          </Card>
        ) : (
          <Card>
            <h2 className="font-bold mb-4">Por tipo de carga</h2>
            <HBarChart
              data={(stats.byCargoType ?? []).map((c) => ({
                label: cargoLabels[c.type] ?? c.type,
                value: c.count,
              }))}
            />
          </Card>
        )}

        <Card>
          <h2 className="font-bold mb-4">Valoraciones recibidas</h2>
          <HBarChart
            color="bg-warning"
            data={[...stats.scoreDistribution]
              .reverse()
              .map((s) => ({ label: '★'.repeat(s.score), value: s.count }))}
          />
        </Card>
      </div>
    </div>
  )
}
