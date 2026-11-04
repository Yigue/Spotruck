import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import api from '../utils/api'

vi.mock('../utils/api', () => ({ default: { get: vi.fn() } }))
// Leaflet no se renderiza en jsdom: se reemplaza por stubs livianos
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  Marker: ({ children }: { children?: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Circle: () => null,
  useMap: () => ({ setView: vi.fn(), fitBounds: vi.fn() }),
}))
vi.mock('../components/maps/BaseLayers', () => ({ BaseLayers: () => null }))

import ExplorePage from './ExplorePage'

const trip = (id: string, dest: string) => ({
  id,
  originAddress: 'Rosario, Santa Fe',
  originLat: -32.9,
  originLng: -60.6,
  destAddress: dest,
  cargoType: 'BULK',
  scheduledDate: '2026-12-01T10:00:00.000Z',
  basePrice: 100000,
  status: 'AUCTION',
  auction: { id: `a-${id}`, currentPrice: 90000, status: 'OPEN' },
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <ExplorePage />
    </MemoryRouter>,
  )

describe('ExplorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: { data: [trip('1', 'Posadas, Misiones'), trip('2', 'Córdoba')] } })
  })

  it('carga viajes en subasta y los muestra como marcadores', async () => {
    renderPage()
    expect(await screen.findByText('2 viajes en subasta')).toBeInTheDocument()
    expect(screen.getAllByTestId('marker')).toHaveLength(2)
    expect(api.get).toHaveBeenCalledWith('/trips', {
      params: { status: 'AUCTION', limit: 100, sort: 'recent' },
    })
  })

  it('cambia a la vista de lista', async () => {
    renderPage()
    await screen.findByText('2 viajes en subasta')
    fireEvent.click(screen.getByRole('button', { name: /lista/i }))
    expect(await screen.findByText(/Posadas, Misiones/)).toBeInTheDocument()
    expect(screen.queryByTestId('map')).not.toBeInTheDocument()
  })

  it('busca «viaje de vuelta» por destino (con retardo)', async () => {
    renderPage()
    await screen.findByText('2 viajes en subasta')
    fireEvent.change(screen.getByLabelText(/destino/i), { target: { value: 'Misiones' } })
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith('/trips', {
        params: { status: 'AUCTION', limit: 100, sort: 'recent', dest: 'Misiones' },
      }),
    )
  })

  it('ordena por precio', async () => {
    renderPage()
    await screen.findByText('2 viajes en subasta')
    fireEvent.change(screen.getByLabelText(/ordenar por/i), { target: { value: 'price_asc' } })
    await waitFor(() =>
      expect(api.get).toHaveBeenLastCalledWith('/trips', {
        params: { status: 'AUCTION', limit: 100, sort: 'price_asc' },
      }),
    )
  })

  it('muestra un estado vacío con acción para limpiar filtros', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /lista/i }))
    fireEvent.change(screen.getByLabelText(/origen/i), { target: { value: 'Ushuaia' } })
    expect(await screen.findByText('No encontramos viajes')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /limpiar filtros/i })[0])
    await waitFor(() => expect((screen.getByLabelText(/origen/i) as HTMLInputElement).value).toBe(''))
  })
})
