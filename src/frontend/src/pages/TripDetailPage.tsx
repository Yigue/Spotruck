import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function TripDetailPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get(`/trips/${id}`).then(({ data }) => setTrip(data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-text-muted">Cargando...</div>
  if (!trip || Object.keys(trip).length === 0) return <div className="text-error">Viaje no encontrado</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Detalle del viaje</h1>
      <div className="card">
        <pre className="text-xs overflow-auto">{JSON.stringify(trip, null, 2)}</pre>
      </div>
    </div>
  )
}
