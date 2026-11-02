import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import api from '../utils/api'

const { mockNavigate, authState } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  authState: {
    token: 't',
    refreshToken: 'r',
    user: { id: 'driver-1', email: 'd@x.com', role: 'DRIVER' as string },
    setAuth: vi.fn(),
    logout: vi.fn(),
  },
}))

vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

vi.mock('../hooks/useAuthStore', () => ({
  useAuthStore: vi.fn((selector?: (s: typeof authState) => unknown) =>
    selector ? selector(authState) : authState
  ),
}))

vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import MyBidsPage from './MyBidsPage'

const bidFixture = {
  id: 'bid-1',
  amount: 40000,
  note: null,
  status: 'PENDING',
  createdAt: '2026-06-01T10:00:00Z',
  auction: {
    id: 'auction-1',
    type: 'OPEN',
    status: 'OPEN',
    currentPrice: 40000,
    trip: {
      id: 'trip-1',
      originAddress: 'Buenos Aires',
      destAddress: 'Córdoba',
      scheduledDate: '2026-07-10T10:00:00Z',
      status: 'AUCTION',
      cargoType: 'GENERAL',
      basePrice: 50000,
    },
  },
  truck: { id: 'truck-1', plate: 'AB123CD', type: 'SEMI' },
}

const renderPage = () =>
  render(
    <BrowserRouter>
      <MyBidsPage />
    </BrowserRouter>
  )

describe('MyBidsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user.role = 'DRIVER'
  })

  it('lista las postulaciones del transportista', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [bidFixture] } })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/Buenos Aires/)).toBeInTheDocument()
    })
    expect(api.get).toHaveBeenCalledWith('/bids/me', {
      params: { page: 1, limit: 50 },
    })
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Retirar oferta')).toBeInTheDocument()
  })

  it('muestra el empty state sin postulaciones', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Aún no te postulaste a ningún viaje')).toBeInTheDocument()
    })
  })

  it('filtra por estado al hacer click en un pill', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } })

    renderPage()
    await waitFor(() => expect(api.get).toHaveBeenCalled())

    fireEvent.click(screen.getByText('Aceptadas'))

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith('/bids/me', {
        params: { page: 1, limit: 50, status: 'ACCEPTED' },
      })
    })
  })

  it('retira una oferta PENDING con confirmación', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [bidFixture] } })
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { ...bidFixture, status: 'WITHDRAWN' } } })

    renderPage()
    await waitFor(() => expect(screen.getByText('Retirar oferta')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Retirar oferta'))
    fireEvent.click(await screen.findByText('Sí, retirar'))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/bids/bid-1/withdraw')
    })
    // Actualización optimista: la fila pasa a "Retirada"
    await waitFor(() => {
      expect(screen.getByText('Retirada')).toBeInTheDocument()
    })
  })

  it('no muestra el botón de retirar para ofertas no pendientes', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: [{ ...bidFixture, status: 'REJECTED' }] },
    })

    renderPage()
    await waitFor(() => expect(screen.getByText('Rechazada')).toBeInTheDocument())
    expect(screen.queryByText('Retirar oferta')).not.toBeInTheDocument()
  })

  it('bloquea el acceso a usuarios que no son transportistas', () => {
    authState.user.role = 'COMPANY'
    renderPage()
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })
})
