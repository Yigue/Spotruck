import { LayersControl, TileLayer } from 'react-leaflet'

// Selector «Mapa / Satélite» (la app original usaba Google Maps con ambas vistas).
// Va dentro de un <MapContainer>.
export function BaseLayers() {
  return (
    <LayersControl position="topright" collapsed={false}>
      <LayersControl.BaseLayer checked name="Mapa">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Satélite">
        <TileLayer
          attribution="Imágenes &copy; Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />
      </LayersControl.BaseLayer>
    </LayersControl>
  )
}
