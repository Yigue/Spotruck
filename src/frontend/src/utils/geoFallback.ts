import type { Locality, Province } from './geo'

// Respaldo sin conexión a Georef: las 24 jurisdicciones con el código oficial y
// la coordenada de su capital. Si Georef no responde, el formulario de nuevo viaje
// sigue funcionando (la localidad se reemplaza por «Capital»).
const PROVINCES: { id: string; nombre: string; lat: number; lon: number; capital: string }[] = [
  { id: '02', nombre: 'Ciudad Autónoma de Buenos Aires', lat: -34.6037, lon: -58.3816, capital: 'CABA' },
  { id: '06', nombre: 'Buenos Aires', lat: -34.9205, lon: -57.9536, capital: 'La Plata' },
  { id: '10', nombre: 'Catamarca', lat: -28.4696, lon: -65.7795, capital: 'San Fernando del Valle de Catamarca' },
  { id: '14', nombre: 'Córdoba', lat: -31.4201, lon: -64.1888, capital: 'Córdoba' },
  { id: '18', nombre: 'Corrientes', lat: -27.4692, lon: -58.8306, capital: 'Corrientes' },
  { id: '22', nombre: 'Chaco', lat: -27.4606, lon: -58.9839, capital: 'Resistencia' },
  { id: '26', nombre: 'Chubut', lat: -43.3002, lon: -65.1023, capital: 'Rawson' },
  { id: '30', nombre: 'Entre Ríos', lat: -31.7333, lon: -60.5297, capital: 'Paraná' },
  { id: '34', nombre: 'Formosa', lat: -26.1775, lon: -58.1781, capital: 'Formosa' },
  { id: '38', nombre: 'Jujuy', lat: -24.1858, lon: -65.2995, capital: 'San Salvador de Jujuy' },
  { id: '42', nombre: 'La Pampa', lat: -36.6203, lon: -64.2906, capital: 'Santa Rosa' },
  { id: '46', nombre: 'La Rioja', lat: -29.4131, lon: -66.8558, capital: 'La Rioja' },
  { id: '50', nombre: 'Mendoza', lat: -32.8895, lon: -68.8458, capital: 'Mendoza' },
  { id: '54', nombre: 'Misiones', lat: -27.3671, lon: -55.8961, capital: 'Posadas' },
  { id: '58', nombre: 'Neuquén', lat: -38.9516, lon: -68.0591, capital: 'Neuquén' },
  { id: '62', nombre: 'Río Negro', lat: -40.8135, lon: -62.9967, capital: 'Viedma' },
  { id: '66', nombre: 'Salta', lat: -24.7821, lon: -65.4232, capital: 'Salta' },
  { id: '70', nombre: 'San Juan', lat: -31.5375, lon: -68.5364, capital: 'San Juan' },
  { id: '74', nombre: 'San Luis', lat: -33.295, lon: -66.3356, capital: 'San Luis' },
  { id: '78', nombre: 'Santa Cruz', lat: -51.623, lon: -69.2168, capital: 'Río Gallegos' },
  { id: '82', nombre: 'Santa Fe', lat: -31.6333, lon: -60.7, capital: 'Santa Fe' },
  { id: '86', nombre: 'Santiago del Estero', lat: -27.7951, lon: -64.2615, capital: 'Santiago del Estero' },
  { id: '90', nombre: 'Tucumán', lat: -26.8083, lon: -65.2176, capital: 'San Miguel de Tucumán' },
  { id: '94', nombre: 'Tierra del Fuego', lat: -54.8019, lon: -68.303, capital: 'Ushuaia' },
]

export const fallbackProvinces = (): Province[] => PROVINCES.map(({ id, nombre }) => ({ id, nombre }))

export const fallbackLocalities = (provinceId: string): Locality[] => {
  const p = PROVINCES.find((x) => x.id === provinceId)
  return p ? [{ id: `cap-${p.id}`, nombre: p.capital, centroide: { lat: p.lat, lon: p.lon } }] : []
}

const toRad = (d: number) => (d * Math.PI) / 180

// Distancia en línea recta (haversine) en km
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}
