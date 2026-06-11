import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { Button } from '../ui/Button'

interface TrackingPoint {
  lat: number
  lng: number
  speed?: number | null
  recordedAt: string
}

interface LiveTrackingMapProps {
  tripId: string
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  isAssignedDriver: boolean
  // Última posición recibida por WebSocket (la inyecta la página)
  livePosition?: TrackingPoint | null
}

const truckIcon = L.divIcon({
  html: '<div style="font-size:26px;line-height:26px">🚛</div>',
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

const originIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
})

const destIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
})

// Mapa de seguimiento en vivo: posición actual del camión, recorrido
// realizado y, para el transportista asignado, compartir su ubicación GPS
export function LiveTrackingMap({
  tripId,
  originLat,
  originLng,
  destLat,
  destLng,
  isAssignedDriver,
  livePosition,
}: LiveTrackingMapProps) {
  const [history, setHistory] = useState<TrackingPoint[]>([])
  const [sharing, setSharing] = useState(false)
  const watchId = useRef<number | null>(null)
  const lastSent = useRef(0)

  useEffect(() => {
    api
      .get(`/tracking/${tripId}/history`, { params: { limit: 200 } })
      .then(({ data }) => setHistory([...data.data].reverse()))
      .catch(() => setHistory([]))
  }, [tripId])

  // Suma la posición en vivo al recorrido
  useEffect(() => {
    if (livePosition) {
      setHistory((prev) => [...prev, livePosition])
    }
  }, [livePosition])

  // Compartir ubicación (GPS del navegador → backend, cada 15s como máximo)
  const toggleSharing = () => {
    if (sharing) {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
      setSharing(false)
      toast('Dejaste de compartir tu ubicación')
      return
    }
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now()
        if (now - lastSent.current < 15000) return
        lastSent.current = now
        api
          .post(`/tracking/${tripId}`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined,
            heading: pos.coords.heading ?? undefined,
          })
          .catch(() => {})
      },
      () => {
        toast.error('No se pudo acceder a tu ubicación')
        setSharing(false)
      },
      { enableHighAccuracy: true }
    )
    setSharing(true)
    toast.success('Compartiendo tu ubicación con la empresa')
  }

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  const current = history[history.length - 1]
  const path: [number, number][] = history.map((p) => [p.lat, p.lng])
  const center: [number, number] = current
    ? [current.lat, current.lng]
    : [(originLat + destLat) / 2, (originLng + destLng) / 2]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {current ? (
            <span className="text-text-muted">
              Última posición: {new Date(current.recordedAt).toLocaleTimeString('es-AR')}
              {current.speed != null && ` · ${Math.round(current.speed)} km/h`}
            </span>
          ) : (
            <span className="text-text-muted">Sin datos de ubicación todavía</span>
          )}
        </div>
        {isAssignedDriver && (
          <Button size="sm" variant={sharing ? 'danger' : 'accent'} onClick={toggleSharing}>
            {sharing ? '■ Dejar de compartir' : '📍 Compartir mi ubicación'}
          </Button>
        )}
      </div>

      <div className="rounded-lg overflow-hidden">
        <MapContainer
          key={`${tripId}-${history.length > 0}`}
          center={center}
          zoom={current ? 9 : 6}
          className="w-full h-[400px]"
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[originLat, originLng]} icon={originIcon}>
            <Popup>Origen</Popup>
          </Marker>
          <Marker position={[destLat, destLng]} icon={destIcon}>
            <Popup>Destino</Popup>
          </Marker>
          {path.length > 1 && <Polyline positions={path} color="#FF6D00" weight={3} />}
          {current && (
            <Marker position={[current.lat, current.lng]} icon={truckIcon}>
              <Popup>
                El camión está acá
                {current.speed != null && <> · {Math.round(current.speed)} km/h</>}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  )
}
