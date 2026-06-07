import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

interface TripMapProps {
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  originAddress: string
  destAddress: string
}

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const originIcon = L.icon({
  ...defaultIcon,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
})

const destIcon = L.icon({
  ...defaultIcon,
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
})

export function TripMap({ originLat, originLng, destLat, destLng, originAddress, destAddress }: TripMapProps) {
  const centerLat = (originLat + destLat) / 2
  const centerLng = (originLng + destLng) / 2
  const bounds = L.latLngBounds([
    [originLat, originLng],
    [destLat, destLng],
  ])

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={6}
      className="w-full h-64 rounded"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[originLat, originLng]} icon={originIcon}>
        <div>{originAddress}</div>
      </Marker>
      <Marker position={[destLat, destLng]} icon={destIcon}>
        <div>{destAddress}</div>
      </Marker>
      <Polyline positions={[[originLat, originLng], [destLat, destLng]]} color="primary" />
    </MapContainer>
  )
}