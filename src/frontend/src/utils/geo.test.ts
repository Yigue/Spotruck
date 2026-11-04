import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { fetchProvinces, fetchLocalities, fetchRoute, estimateRoute, formatDuration } from './geo'
import { haversineKm } from './geoFallback'

vi.mock('axios')

describe('geo con servicios externos caídos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('usa las 24 jurisdicciones locales si Georef falla', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('network'))
    const provinces = await fetchProvinces()
    expect(provinces).toHaveLength(24)
    expect(provinces.find((p) => p.nombre === 'Misiones')?.id).toBe('54')
  })

  it('devuelve el listado de Georef cuando responde', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { provincias: [{ id: '99', nombre: 'Test' }] } })
    expect(await fetchProvinces()).toEqual([{ id: '99', nombre: 'Test' }])
  })

  it('si Georef falla ofrece la capital de la provincia como localidad', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('network'))
    const locs = await fetchLocalities('54')
    expect(locs).toHaveLength(1)
    expect(locs[0].nombre).toBe('Posadas')
    expect(locs[0].centroide.lat).toBeCloseTo(-27.37, 1)
  })

  it('una provincia desconocida no ofrece localidades', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('network'))
    expect(await fetchLocalities('00')).toEqual([])
  })

  it('estima la ruta en línea recta cuando OSRM no responde', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('network'))
    const r = await fetchRoute({ lat: -34.6, lng: -58.38 }, { lat: -31.42, lng: -64.19 }) // BA → Córdoba
    expect(r?.estimated).toBe(true)
    // ~650 km en línea recta, +25 % ≈ 800 km
    expect(r!.distanceKm).toBeGreaterThan(700)
    expect(r!.distanceKm).toBeLessThan(900)
    expect(r!.geometry).toHaveLength(2)
  })

  it('no marca como estimada una ruta real de OSRM', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: { routes: [{ distance: 123400, duration: 5400, geometry: { coordinates: [[-58, -34], [-64, -31]] } }] },
    })
    const r = await fetchRoute({ lat: -34, lng: -58 }, { lat: -31, lng: -64 })
    expect(r).toMatchObject({ distanceKm: 123.4, durationMin: 90 })
    expect(r?.estimated).toBeUndefined()
  })
})

describe('utilidades', () => {
  it('haversine: Buenos Aires–Córdoba ≈ 650 km', () => {
    expect(haversineKm({ lat: -34.6, lng: -58.38 }, { lat: -31.42, lng: -64.19 })).toBeGreaterThan(600)
  })
  it('estimateRoute usa 60 km/h', () => {
    const r = estimateRoute({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })
    expect(r.durationMin).toBe(Math.round(r.distanceKm))
  })
  it('formatDuration', () => {
    expect(formatDuration(75)).toBe('1 h 15 min')
    expect(formatDuration(45)).toBe('45 min')
  })
})
