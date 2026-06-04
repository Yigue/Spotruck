import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

interface Trip {
  id: string
  originAddress: string
  destAddress: string
  cargoType: string
  scheduledDate: string
  basePrice: number
  status: string
  user: { companyName?: string; ratingAvg: number }
  auction?: { id: string; currentPrice: number; status: string }
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/trips').then(({ data }) => {
      setTrips(data.data)
    }).catch(() => {
      setTrips([])
    }).finally(() => setLoading(false))
  }, [])

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'badge-info',
      OPEN: 'badge-info',
      AUCTION: 'badge-warning',
      ASSIGNED: 'badge-success',
      IN_PROGRESS: 'badge-success',
      DELIVERED: 'badge-success',
      SETTLED: 'badge-success',
      CANCELLED: 'badge-error',
    }
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>
  }

  if (loading) return <div className="text-text-muted">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Viajes</h1>
        <Link to="/trips/new" className="btn-primary">+ Publicar viaje</Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background text-left">
            <tr>
              <th className="p-3 font-medium">Origen</th>
              <th className="p-3 font-medium">Destino</th>
              <th className="p-3 font-medium">Carga</th>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Precio base</th>
              <th className="p-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-background">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-background/50 transition-colors">
                <td className="p-3">{trip.originAddress}</td>
                <td className="p-3">{trip.destAddress}</td>
                <td className="p-3">{trip.cargoType}</td>
                <td className="p-3">{new Date(trip.scheduledDate).toLocaleDateString('es-AR')}</td>
                <td className="p-3 font-mono">${trip.basePrice.toLocaleString('es-AR')}</td>
                <td className="p-3">{statusBadge(trip.status)}</td>
              </tr>
            ))}
            {trips.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-text-muted">No hay viajes publicados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
