import { MapContainer, Marker, Polyline, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { BaseLayers } from './BaseLayers'
import L from 'leaflet'

interface TripDetailMapProps {
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

export function TripDetailMap({ originLat, originLng, destLat, destLng, originAddress, destAddress }: TripDetailMapProps) {
  // Encuadra siempre origen y destino, sea cual sea la distancia del viaje
  const bounds: [[number, number], [number, number]] = [
    [originLat, originLng],
    [destLat, destLng],
  ]
  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [50, 50] }}
      className="w-full h-full min-h-[400px] rounded-lg"
      scrollWheelZoom={false}
    >
      <BaseLayers />
      <Marker position={[originLat, originLng]} icon={originIcon}>
        <Popup>
          <strong>Origen</strong>
          <br />
          {originAddress}
        </Popup>
      </Marker>
      <Marker position={[destLat, destLng]} icon={destIcon}>
        <Popup>
          <strong>Destino</strong>
          <br />
          {destAddress}
        </Popup>
      </Marker>
      <Polyline
        positions={[[originLat, originLng], [destLat, destLng]]}
        pathOptions={{ color: '#1B5E20', weight: 3, dashArray: '8 8' }}
      />
    </MapContainer>
  )
}