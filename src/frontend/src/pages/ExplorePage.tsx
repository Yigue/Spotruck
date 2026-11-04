import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { BaseLayers } from '../components/maps/BaseLayers'
import { TripCard } from '../components/trips/TripCard'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { buildExploreParams, type ExploreSort } from '../utils/explore'
import { cargoLabels } from '../utils/labels'

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
  status: string
  distanceKm?: number
  user?: { companyName?: string; ratingAvg: number }
  auction?: { id: string; currentPrice: number; status: string }
}

// Marcador propio (sin depender de imágenes externas)
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#1B5E20;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26],
})

const meIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb55"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const cargoFilterOptions = [
  { value: '', label: 'Todas las cargas' },
  { value: 'BULK', label: 'Granel' },
  { value: 'PALLETS', label: 'Pallets' },
  { value: 'GENERAL', label: 'General' },
  { value: 'REFRIGERATED', label: 'Refrigerada' },
]

const sortOptions = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'date', label: 'Salida más próxima' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]

const radiusOptions = [
  { value: '50', label: '50 km' },
  { value: '100', label: '100 km' },
  { value: '200', label: '200 km' },
  { value: '500', label: '500 km' },
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

// Ajusta el encuadre a los marcadores visibles
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) map.setView(points[0], 8)
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 9 })
  }, [map, points])
  return null
}

// Pantalla del transportista: publicaciones disponibles en mapa o lista, con
// búsqueda por origen/destino («viaje de vuelta») y cercanía.
export default function ExplorePage() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<TripMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'map' | 'list'>('map')
  const [origin, setOrigin] = useState('')
  const [dest, setDest] = useState('')
  const [cargoType, setCargoType] = useState('')
  const [sort, setSort] = useState<ExploreSort>('recent')
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null)
  const [nearOn, setNearOn] = useState(false)
  const [radius, setRadius] = useState('100')
  const [locating, setLocating] = useState(false)

  // Búsqueda con retardo para no pedir en cada tecla
  const [debounced, setDebounced] = useState({ origin: '', dest: '' })
  useEffect(() => {
    const t = setTimeout(() => setDebounced({ origin, dest }), 350)
    return () => clearTimeout(t)
  }, [origin, dest])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = buildExploreParams({
      origin: debounced.origin,
      dest: debounced.dest,
      cargoType,
      sort,
      near: nearOn && me ? { ...me, radiusKm: Number(radius) } : null,
    })
    api
      .get('/trips', { params })
      .then(({ data }) => !cancelled && setTrips(data.data))
      .catch(() => !cancelled && setTrips([]))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debounced, cargoType, sort, nearOn, me, radius])

  const toggleNear = () => {
    if (nearOn) {
      setNearOn(false)
      return
    }
    if (me) {
      setNearOn(true)
      return
    }
    if (!navigator.geolocation) {
      toast.error('Tu navegador no permite obtener la ubicación')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setNearOn(true)
        setLocating(false)
      },
      () => {
        toast.error('No pudimos obtener tu ubicación. Revisá los permisos del navegador.')
        setLocating(false)
      },
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  const hasFilters = !!(origin || dest || cargoType || nearOn)
  const clearFilters = () => {
    setOrigin('')
    setDest('')
    setCargoType('')
    setNearOn(false)
  }

  const points = useMemo<[number, number][]>(() => {
    const pts = trips.map((t) => [t.originLat, t.originLng] as [number, number])
    if (nearOn && me) pts.push([me.lat, me.lng])
    return pts
  }, [trips, nearOn, me])

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Explorar publicaciones</h1>
          <p className="text-text-muted text-sm" aria-live="polite">
            {loading ? 'Buscando…' : `${trips.length} ${trips.length === 1 ? 'viaje' : 'viajes'} en subasta`}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-secondary-500/30 overflow-hidden" role="group" aria-label="Vista">
          {(['map', 'list'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === v ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-primary-50'
              }`}
            >
              {v === 'map' ? '🗺️ Mapa' : '☰ Lista'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Origen"
            placeholder="Ej: Rosario"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <Input
            label="Destino (viaje de vuelta)"
            placeholder="Ej: Misiones"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
          />
          <Select
            label="Tipo de carga"
            options={cargoFilterOptions}
            value={cargoType}
            onChange={(e) => setCargoType(e.target.value)}
          />
          <Select
            label="Ordenar por"
            options={sortOptions}
            value={sort}
            onChange={(e) => setSort(e.target.value as ExploreSort)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            type="button"
            onClick={toggleNear}
            disabled={locating}
            aria-pressed={nearOn}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              nearOn
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-text-muted border-secondary-500/30 hover:border-primary/50'
            }`}
          >
            {locating ? 'Ubicándote…' : nearOn ? '✓ Cerca de mí' : '📍 Cerca de mí'}
          </button>
          {nearOn && (
            <Select
              aria-label="Radio de búsqueda"
              options={radiusOptions}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-32"
            />
          )}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {view === 'map' ? (
        <Card className="p-0 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 z-[1000] bg-white/60 flex items-center justify-center">
              <Spinner />
            </div>
          )}
          {!loading && trips.length === 0 && (
            <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center pointer-events-none">
              <div className="bg-surface shadow-lg rounded-lg px-4 py-3 text-sm text-text-muted pointer-events-auto">
                No encontramos viajes con esos filtros.{' '}
                {hasFilters && (
                  <button className="text-primary font-medium" onClick={clearFilters}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )}
          <MapContainer center={[-34.6, -60.0]} zoom={6} className="w-full h-[calc(100vh-380px)] min-h-[380px]">
            <BaseLayers />
            <FitBounds points={points} />
            {nearOn && me && (
              <>
                <Marker position={[me.lat, me.lng]} icon={meIcon} />
                <Circle
                  center={[me.lat, me.lng]}
                  radius={Number(radius) * 1000}
                  pathOptions={{ color: '#2563eb', weight: 1, fillOpacity: 0.05 }}
                />
              </>
            )}
            {trips.map((trip) => (
              <Marker key={trip.id} position={[trip.originLat, trip.originLng]} icon={pinIcon}>
                <Popup>
                  <div className="space-y-1 text-sm min-w-[190px]">
                    <p className="font-bold">
                      {trip.originAddress} → {trip.destAddress}
                    </p>
                    <p>
                      {cargoLabels[trip.cargoType] || trip.cargoType}
                      {trip.weightKg && ` · ${trip.weightKg.toLocaleString('es-AR')} kg`}
                      {trip.distanceKm && ` · ${trip.distanceKm.toLocaleString('es-AR')} km`}
                    </p>
                    <p>Salida: {new Date(trip.scheduledDate).toLocaleDateString('es-AR')}</p>
                    <p className="font-semibold">{formatPrice(trip.auction?.currentPrice ?? trip.basePrice)}</p>
                    <Link to={`/trips/${trip.id}`} className="text-primary font-medium">
                      Ver publicación →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Card>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No encontramos viajes"
          description="Probá con otro origen o destino, o ampliá el radio de búsqueda."
          action={hasFilters ? { label: 'Limpiar filtros', onClick: clearFilters } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onClick={() => navigate(`/trips/${trip.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
