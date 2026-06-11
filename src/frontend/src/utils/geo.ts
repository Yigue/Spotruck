import axios from 'axios'

// API Georef (datos.gob.ar) — catálogo oficial de provincias y localidades de Argentina
const GEOREF = 'https://apis.datos.gob.ar/georef/api'
// OSRM público — cálculo de ruta, distancia y duración
const OSRM = 'https://router.project-osrm.org/route/v1/driving'

export interface Province {
  id: string
  nombre: string
}

export interface Locality {
  id: string
  nombre: string
  centroide: { lat: number; lon: number }
}

export interface RouteInfo {
  distanceKm: number
  durationMin: number
  geometry: [number, number][] // [lat, lng] para Polyline de Leaflet
}

export async function fetchProvinces(): Promise<Province[]> {
  const { data } = await axios.get(`${GEOREF}/provincias`, {
    params: { campos: 'id,nombre', max: 24, orden: 'nombre' },
  })
  return data.provincias
}

export async function fetchLocalities(provinceId: string): Promise<Locality[]> {
  const { data } = await axios.get(`${GEOREF}/localidades`, {
    params: { provincia: provinceId, campos: 'id,nombre,centroide', max: 1000, orden: 'nombre' },
  })
  return data.localidades
}

export async function fetchRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<RouteInfo | null> {
  try {
    const { data } = await axios.get(
      `${OSRM}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}`,
      { params: { overview: 'simplified', geometries: 'geojson' } }
    )
    const route = data.routes?.[0]
    if (!route) return null
    return {
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
    }
  } catch {
    return null
  }
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

export function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}`
}
