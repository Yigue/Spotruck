export type ExploreSort = 'recent' | 'date' | 'price_asc' | 'price_desc'

export interface ExploreFilters {
  origin: string
  dest: string
  cargoType: string
  sort: ExploreSort
  // «Cerca de mí»: sólo se aplica si hay coordenadas
  near: { lat: number; lng: number; radiusKm: number } | null
}

// Convierte los filtros de la pantalla Explorar en query params de GET /trips.
// Los textos vacíos o sólo con espacios no se envían.
export function buildExploreParams(f: ExploreFilters): Record<string, string | number> {
  const params: Record<string, string | number> = { status: 'AUCTION', limit: 100, sort: f.sort }
  if (f.origin.trim()) params.origin = f.origin.trim()
  if (f.dest.trim()) params.dest = f.dest.trim()
  if (f.cargoType) params.cargoType = f.cargoType
  if (f.near) {
    params.lat = f.near.lat
    params.lng = f.near.lng
    params.radius = f.near.radiusKm
  }
  return params
}
