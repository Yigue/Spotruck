import axios from 'axios'
import { fallbackLocalities, fallbackProvinces, haversineKm } from './geoFallback'

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
  // true cuando el servicio de rutas no respondió y se estimó en línea recta (+25 % por curvas, 60 km/h)
  estimated?: boolean
}

export async function fetchProvinces(): Promise<Province[]> {
  try {
    const { data } = await axios.get(`${GEOREF}/provincias`, {
      params: { campos: 'id,nombre', max: 24, orden: 'nombre' },
      timeout: 8000,
    })
    if (Array.isArray(data.provincias) && data.provincias.length > 0) return data.provincias
  } catch {
    /* Georef caído o sin conexión: se usa el listado local */
  }
  return fallbackProvinces()
}

export async function fetchLocalities(provinceId: string): Promise<Locality[]> {
  try {
    const { data } = await axios.get(`${GEOREF}/localidades`, {
      params: { provincia: provinceId, campos: 'id,nombre,centroide', max: 1000, orden: 'nombre' },
      timeout: 8000,
    })
    if (Array.isArray(data.localidades) && data.localidades.length > 0) return data.localidades
  } catch {
    /* ver fetchProvinces */
  }
  return fallbackLocalities(provinceId)
}

// Estimación cuando OSRM no responde, para no dejar el viaje sin distancia ni duración
export function estimateRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): RouteInfo {
  const km = Math.round(haversineKm(origin, dest) * 1.25 * 10) / 10
  return {
    distanceKm: km,
    durationMin: Math.round((km / 60) * 60),
    geometry: [
      [origin.lat, origin.lng],
      [dest.lat, dest.lng],
    ],
    estimated: true,
  }
}

export async function fetchRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<RouteInfo | null> {
  try {
    const { data } = await axios.get(
      `${OSRM}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}`,
      { params: { overview: 'simplified', geometries: 'geojson' }, timeout: 8000 }
    )
    const route = data.routes?.[0]
    if (!route) return estimateRoute(origin, dest)
    return {
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
    }
  } catch {
    return estimateRoute(origin, dest)
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
