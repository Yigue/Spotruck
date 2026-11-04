import { describe, it, expect } from 'vitest'
import { buildExploreParams } from './explore'

const base = { origin: '', dest: '', cargoType: '', sort: 'recent' as const, near: null }

describe('buildExploreParams', () => {
  it('sólo pide viajes en subasta por defecto', () => {
    expect(buildExploreParams(base)).toEqual({ status: 'AUCTION', limit: 100, sort: 'recent' })
  })

  it('arma la búsqueda de «viaje de vuelta» (destino + carga)', () => {
    expect(buildExploreParams({ ...base, dest: ' Misiones ', cargoType: 'BULK', sort: 'price_asc' })).toEqual({
      status: 'AUCTION',
      limit: 100,
      sort: 'price_asc',
      dest: 'Misiones',
      cargoType: 'BULK',
    })
  })

  it('ignora textos en blanco', () => {
    expect(buildExploreParams({ ...base, origin: '   ', dest: '' })).not.toHaveProperty('origin')
  })

  it('incluye cercanía con coordenadas y radio', () => {
    expect(buildExploreParams({ ...base, near: { lat: -34.6, lng: -58.4, radiusKm: 150 } })).toMatchObject({
      lat: -34.6,
      lng: -58.4,
      radius: 150,
    })
  })
})
