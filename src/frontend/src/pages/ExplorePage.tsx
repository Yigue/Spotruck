import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import api from '../utils/api'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'

interface TripMarker {
  id: string
  originAddress: string
  originLat: number
  originLng: number
  destAddress: string
  cargoType: string
  weightKg?: number
  scheduledDate: string
  basePrice: number
  distanceKm?: number
  auction?: { id: string; currentPrice: number; status: string } | null
}

const publicationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const cargoLabels: Record<string, string> = {
  BULK: 'Granel',
  PALLETS: 'Pallets',
  GENERAL: 'General',
  REFRIGERATED: 'Refrigerada',
}

const cargoFilterOptions = [
  { value: '', label: 'Todas las cargas' },
  { value: 'BULK', label: 'Granel' },
  { value: 'PALLETS', label: 'Pallets' },
  { value: 'GENERAL', label: 'General' },
  { value: 'REFRIGERATED', label: 'Refrigerada' },
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

// Mapa de publicaciones disponibles (pantalla del transportista en la app
// original: markers sobre el mapa para explorar viajes por zona)
export default function ExplorePage() {
  const [trips, setTrips] = useState<TripMarker[]>([])
  const [cargoType, setCargoType] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = { status: 'AUCTION', limit: '100' }
    if (cargoType) params.cargoType = cargoType
    api
      .get('/trips', { params })
      .then(({ data }) => setTrips(data.data))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false))
  }, [cargoType])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Explorar publicaciones</h1>
          <p className="text-text-muted text-sm">
            {loading ? 'Cargando…' : `${trips.length} viajes en subasta`}
          </p>
        </div>
        <Select
          options={cargoFilterOptions}
          value={cargoType}
          onChange={(e) => setCargoType(e.target.value)}
          className="w-48"
        />
      </div>

      <Card className="p-0 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/60 flex items-center justify-center">
            <Spinner />
          </div>
        )}
        {!loading && trips.length === 0 && (
          <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center pointer-events-none">
            <div className="bg-surface shadow-lg rounded-lg px-4 py-3 text-sm text-text-muted pointer-events-auto">
              No hay viajes en subasta{cargoType ? ' para este tipo de carga' : ''} ahora mismo.{' '}
              {cargoType && (
                <button className="text-primary font-medium" onClick={() => setCargoType('')}>
                  Ver todos
                </button>
              )}
            </div>
          </div>
        )}
        <MapContainer
          center={[-34.6, -60.0]}
          zoom={6}
          className="w-full h-[calc(100vh-220px)] min-h-[400px]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {trips.map((trip) => (
            <Marker key={trip.id} position={[trip.originLat, trip.originLng]} icon={publicationIcon}>
              <Popup>
                <div className="space-y-1 text-sm min-w-[180px]">
                  <p className="font-bold">
                    {trip.originAddress} → {trip.destAddress}
                  </p>
                  <p>
                    {cargoLabels[trip.cargoType] || trip.cargoType}
                    {trip.weightKg && ` · ${trip.weightKg.toLocaleString('es-AR')} kg`}
                  </p>
                  <p>Salida: {new Date(trip.scheduledDate).toLocaleDateString('es-AR')}</p>
                  <p className="font-semibold">
                    {formatPrice(trip.auction?.currentPrice ?? trip.basePrice)}
                  </p>
                  <Link to={`/trips/${trip.id}`} className="text-primary font-medium">
                    Ver publicación →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Card>
    </div>
  )
}
