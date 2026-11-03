import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import api from '../utils/api'

const { authState } = vi.hoisted(() => ({
  authState: {
    token: 't',
    refreshToken: 'r',
    user: { id: 'admin-1', email: 'admin@x.com', role: 'ADMIN' as string },
    setAuth: vi.fn(),
    logout: vi.fn(),
  },
}))

vi.mock('../utils/api', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../hooks/useAuthStore', () => ({
  useAuthStore: vi.fn((selector?: (s: typeof authState) => unknown) =>
    selector ? selector(authState) : authState
  ),
}))

import AdminPage from './AdminPage'

const driver = {
  id: 'drv-1',
  email: 'carlos@x.com',
  companyName: 'Carlos Camionero',
  phone: '+54 9 11 5555 0001',
  driverLicense: 'LIC-123',
  documentsStatus: 'PENDING',
  documentsUrl: ['/uploads/documents/drv-1/licencia.pdf'],
  avatarUrl: null,
  emailVerified: true,
  ratingAvg: 4.5,
  ratingCount: 2,
  tripsCompleted: 3,
  createdAt: '2026-06-01T10:00:00Z',
  trucks: [
    {
      id: 'tr-1',
      plate: 'AB123CD',
      type: 'SEMI',
      capacityKg: 25000,
      senasaNumber: null,
      documentsUrl: ['/uploads/documents/trucks/tr-1/cedula.png'],
    },
  ],
}

const mockApi = (drivers = [driver], summary = { NONE: 0, PENDING: drivers.length, APPROVED: 1, REJECTED: 0 }) => {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/users/verification/summary') return Promise.resolve({ data: { data: summary } })
    return Promise.resolve({ data: { data: drivers } })
  })
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminPage />
    </MemoryRouter>
  )

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = { id: 'admin-1', email: 'admin@x.com', role: 'ADMIN' }
    mockApi()
  })

  it('muestra la cola de pendientes con documentos, camiones y contadores', async () => {
    renderPage()
    expect(await screen.findByText('Carlos Camionero')).toBeInTheDocument()
    expect(screen.getByText('LIC-123')).toBeInTheDocument()
    expect(screen.getByText(/AB123CD/)).toBeInTheDocument()
    expect(screen.getByText('licencia.pdf')).toBeInTheDocument()
    expect(screen.getByText('cedula.png')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^aprobar$/i })).toBeInTheDocument()
    // pedido con el filtro correcto
    expect(api.get).toHaveBeenCalledWith('/users', {
      params: { role: 'DRIVER', documentsStatus: 'PENDING', limit: 50 },
    })
  })

  it('aprueba con confirmación', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { documentsStatus: 'APPROVED' } } })
    renderPage()
    await screen.findByText('Carlos Camionero')
    fireEvent.click(screen.getByRole('button', { name: /^aprobar$/i }))
    fireEvent.click(await screen.findByRole('button', { name: /sí, verificar/i }))
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/users/drv-1/verify', { action: 'approve', note: undefined })
    )
  })

  it('rechazar exige un motivo de al menos 5 caracteres', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { documentsStatus: 'REJECTED' } } })
    renderPage()
    await screen.findByText('Carlos Camionero')
    fireEvent.click(screen.getByRole('button', { name: /^rechazar$/i }))

    const confirmBtn = await screen.findAllByRole('button', { name: /^rechazar$/i })
    const modalReject = confirmBtn[confirmBtn.length - 1]
    expect(modalReject).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText(/licencia está vencida/i), {
      target: { value: 'Licencia vencida' },
    })
    expect(modalReject).not.toBeDisabled()
    fireEvent.click(modalReject)

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/users/drv-1/verify', {
        action: 'reject',
        note: 'Licencia vencida',
      })
    )
  })

  it('sin pendientes muestra el estado vacío', async () => {
    mockApi([], { NONE: 0, PENDING: 0, APPROVED: 2, REJECTED: 0 })
    renderPage()
    expect(await screen.findByText(/no hay verificaciones pendientes/i)).toBeInTheDocument()
  })

  it('un usuario que no es admin no consulta la API (redirige)', async () => {
    authState.user = { id: 'drv', email: 'd@x.com', role: 'DRIVER' }
    renderPage()
    await waitFor(() => expect(screen.queryByText(/verificación de transportistas/i)).not.toBeInTheDocument())
    expect(api.get).not.toHaveBeenCalled()
  })
})
