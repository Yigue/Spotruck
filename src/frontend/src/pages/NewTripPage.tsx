import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  fetchProvinces,
  fetchLocalities,
  fetchRoute,
  formatDuration,
  type Province,
  type Locality,
  type RouteInfo,
} from '../utils/geo'

const cargoTypeOptions = [
  { value: 'GENERAL', label: 'General' },
  { value: 'BULK', label: 'Granel' },
  { value: 'PALLETS', label: 'Unitarizada (Pallets)' },
  { value: 'REFRIGERATED', label: 'Refrigerada' },
]

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

interface PlaceSelection {
  provinceId: string
  provinceName: string
  locality: Locality | null
}

const emptyPlace: PlaceSelection = { provinceId: '', provinceName: '', locality: null }

// "ahora" en formato datetime-local (hora local), para min= y validación
function nowLocalISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function PlaceSelector({
  label,
  provinces,
  value,
  onChange,
}: {
  label: string
  provinces: Province[]
  value: PlaceSelection
  onChange: (p: PlaceSelection) => void
}) {
  const [localities, setLocalities] = useState<Locality[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!value.provinceId) {
      setLocalities([])
      return
    }
    setLoading(true)
    fetchLocalities(value.provinceId)
      .then(setLocalities)
      .catch(() => setLocalities([]))
      .finally(() => setLoading(false))
  }, [value.provinceId])

  return (
    <div className="grid grid-cols-2 gap-4">
      <Select
        label={`Provincia ${label}`}
        options={[
          { value: '', label: 'Seleccionar…' },
          ...provinces.map((p) => ({ value: p.id, label: p.nombre })),
        ]}
        value={value.provinceId}
        onChange={(e) => {
          const province = provinces.find((p) => p.id === e.target.value)
          onChange({
            provinceId: e.target.value,
            provinceName: province?.nombre ?? '',
            locality: null,
          })
        }}
      />
      <Select
        label={`Localidad ${label}`}
        options={[
          { value: '', label: loading ? 'Cargando…' : 'Seleccionar…' },
          ...localities.map((l) => ({ value: l.id, label: l.nombre })),
        ]}
        value={value.locality?.id ?? ''}
        disabled={!value.provinceId || loading}
        onChange={(e) => {
          const locality = localities.find((l) => l.id === e.target.value) ?? null
          onChange({ ...value, locality })
        }}
      />
    </div>
  )
}

export default function NewTripPage() {
  const navigate = useNavigate()
  const [provinces, setProvinces] = useState<Province[]>([])
  const [origin, setOrigin] = useState<PlaceSelection>(emptyPlace)
  const [dest, setDest] = useState<PlaceSelection>(emptyPlace)
  const [route, setRoute] = useState<RouteInfo | null>(null)
  const [form, setForm] = useState({
    cargoType: 'GENERAL',
    cargoDesc: '',
    weightKg: '',
    volumeDesc: '',
    scheduledDate: '',
    endDate: '',
    basePrice: '',
    auctionType: 'OPEN',
    reservePrice: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchProvinces()
      .then(setProvinces)
      .catch(() => toast.error('No se pudo cargar el listado de provincias'))
  }, [])

  // Calcula la ruta (distancia y duración) cuando origen y destino están elegidos
  useEffect(() => {
    setRoute(null)
    if (!origin.locality || !dest.locality) return
    const o = origin.locality.centroide
    const d = dest.locality.centroide
    fetchRoute({ lat: o.lat, lng: o.lon }, { lat: d.lat, lng: d.lon }).then(setRoute)
  }, [origin.locality, dest.locality])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) {
      setErrors((e) => {
        const newErrors = { ...e }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const mapCenter = useMemo<[number, number]>(() => {
    if (origin.locality && dest.locality) {
      return [
        (origin.locality.centroide.lat + dest.locality.centroide.lat) / 2,
        (origin.locality.centroide.lon + dest.locality.centroide.lon) / 2,
      ]
    }
    return [-34.6, -60.0]
  }, [origin.locality, dest.locality])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!origin.locality) newErrors.origin = 'Seleccioná provincia y localidad de origen'
    if (!dest.locality) newErrors.dest = 'Seleccioná provincia y localidad de destino'
    if (!form.scheduledDate) newErrors.scheduledDate = 'Requerido'
    else if (form.scheduledDate < nowLocalISO())
      newErrors.scheduledDate = 'La fecha no puede estar en el pasado'
    if (form.endDate && form.scheduledDate && form.endDate < form.scheduledDate)
      newErrors.endDate = 'Debe ser posterior a la fecha de inicio'
    if (!form.basePrice || parseFloat(form.basePrice) <= 0) newErrors.basePrice = 'Precio inválido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !origin.locality || !dest.locality) return

    setLoading(true)
    try {
      const payload = {
        originAddress: `${origin.locality.nombre}, ${origin.provinceName}`,
        originLat: origin.locality.centroide.lat,
        originLng: origin.locality.centroide.lon,
        originProvince: origin.provinceName,
        originCity: origin.locality.nombre,
        destAddress: `${dest.locality.nombre}, ${dest.provinceName}`,
        destLat: dest.locality.centroide.lat,
        destLng: dest.locality.centroide.lon,
        destProvince: dest.provinceName,
        destCity: dest.locality.nombre,
        distanceKm: route?.distanceKm,
        durationMin: route?.durationMin,
        cargoType: form.cargoType,
        cargoDesc: form.cargoDesc || undefined,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        volumeDesc: form.volumeDesc || undefined,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        basePrice: parseFloat(form.basePrice),
        auctionType: form.auctionType,
        reservePrice: form.reservePrice ? parseFloat(form.reservePrice) : undefined,
      }

      const { data } = await api.post('/trips', payload)
      toast.success('Publicación creada')
      navigate(`/trips/${data.data.id}`)
    } catch {
      toast.error('Error al crear la publicación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Publicar nuevo viaje</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlaceSelector label="origen" provinces={provinces} value={origin} onChange={setOrigin} />
          {errors.origin && <p className="text-xs text-error">{errors.origin}</p>}

          <PlaceSelector label="destino" provinces={provinces} value={dest} onChange={setDest} />
          {errors.dest && <p className="text-xs text-error">{errors.dest}</p>}

          {/* Mapa con la ruta */}
          {(origin.locality || dest.locality) && (
            <div className="rounded-lg overflow-hidden border border-secondary-500/20">
              <MapContainer
                key={`${origin.locality?.id}-${dest.locality?.id}`}
                center={mapCenter}
                zoom={origin.locality && dest.locality ? 6 : 7}
                className="w-full h-64"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {origin.locality && (
                  <Marker
                    position={[origin.locality.centroide.lat, origin.locality.centroide.lon]}
                    icon={originIcon}
                  >
                    <Popup>{origin.locality.nombre}</Popup>
                  </Marker>
                )}
                {dest.locality && (
                  <Marker
                    position={[dest.locality.centroide.lat, dest.locality.centroide.lon]}
                    icon={destIcon}
                  >
                    <Popup>{dest.locality.nombre}</Popup>
                  </Marker>
                )}
                {route && <Polyline positions={route.geometry} color="#1B5E20" />}
              </MapContainer>
            </div>
          )}

          {route && (
            <div className="flex gap-6 text-sm bg-background rounded p-3">
              <div>
                <span className="text-text-muted">Distancia: </span>
                <span className="font-semibold">{route.distanceKm} km</span>
              </div>
              <div>
                <span className="text-text-muted">Duración del viaje: </span>
                <span className="font-semibold">{formatDuration(route.durationMin)}</span>
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de inicio"
              name="scheduledDate"
              type="datetime-local"
              min={nowLocalISO()}
              value={form.scheduledDate}
              onChange={handleChange}
              error={errors.scheduledDate}
              required
            />
            <Input
              label="Fecha fin (cierre de la subasta)"
              name="endDate"
              type="datetime-local"
              min={form.scheduledDate || nowLocalISO()}
              value={form.endDate}
              onChange={handleChange}
              error={errors.endDate}
              helper="Sin fecha fin, la subasta cierra a las 72 h"
            />
          </div>

          {/* Carga */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de carga"
              name="cargoType"
              options={cargoTypeOptions}
              value={form.cargoType}
              onChange={handleChange}
            />
            <Input
              label="Peso del cargamento (kg)"
              name="weightKg"
              type="number"
              value={form.weightKg}
              onChange={handleChange}
              placeholder="Ej: 25000"
            />
          </div>

          <Input
            label="Volumen del cargamento"
            name="volumeDesc"
            value={form.volumeDesc}
            onChange={handleChange}
            placeholder="Ej: Maíz a granel"
          />

          <div className="space-y-1">
            <label className="label">Descripción de la carga</label>
            <textarea
              name="cargoDesc"
              className="input"
              rows={2}
              value={form.cargoDesc}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>

          <Input
            label="Precio base (ARS)"
            name="basePrice"
            type="number"
            value={form.basePrice}
            onChange={handleChange}
            error={errors.basePrice}
            required
            placeholder="Ej: 45000"
          />

          {/* Tipo de subasta */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de subasta"
              name="auctionType"
              options={[
                { value: 'OPEN', label: 'Abierta (ofertas a la baja)' },
                { value: 'DUTCH', label: 'Holandesa (precio que baja solo)' },
                { value: 'SEALED', label: 'Sellada (ofertas privadas)' },
              ]}
              value={form.auctionType}
              onChange={handleChange}
            />
            <Input
              label={form.auctionType === 'DUTCH' ? 'Precio mínimo (piso)' : 'Precio de reserva (opcional)'}
              name="reservePrice"
              type="number"
              value={form.reservePrice}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>
          <p className="text-xs text-text-muted -mt-2">
            {form.auctionType === 'OPEN' && 'Los transportistas ofertan compitiendo a la baja.'}
            {form.auctionType === 'DUTCH' && 'El precio arranca en el base y baja con el tiempo hasta el piso; gana el primero que lo toma.'}
            {form.auctionType === 'SEALED' && 'Cada transportista envía una oferta privada; vos elegís la mejor.'}
          </p>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="accent" loading={loading}>
              Publicar viaje
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/trips')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
