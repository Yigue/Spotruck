import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import api from '../../utils/api'
import { UserProfileModal } from './UserProfileModal'

vi.mock('../../utils/api', () => ({ default: { get: vi.fn() } }))

const profile = {
  id: 'u1',
  role: 'DRIVER',
  companyName: 'Fletes del Norte',
  ratingAvg: 4.5,
  ratingCount: 2,
  tripsCompleted: 7,
}

const mockApi = (reviews: unknown[] | Error) =>
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url.startsWith('/ratings/user/')) {
      return reviews instanceof Error ? Promise.reject(reviews) : Promise.resolve({ data: { data: reviews } })
    }
    return Promise.resolve({ data: { data: profile } })
  })

describe('UserProfileModal — opiniones', () => {
  beforeEach(() => vi.clearAllMocks())

  it('muestra las opiniones con comentario y autor', async () => {
    mockApi([
      { id: 'r1', score: 5, comment: 'Muy puntual', createdAt: '2026-10-01T10:00:00Z', fromUser: { id: 'c1', companyName: 'Agro SA', role: 'COMPANY' } },
      { id: 'r2', score: 4, comment: null, createdAt: '2026-10-02T10:00:00Z', fromUser: { id: 'c2', companyName: null, role: 'COMPANY' } },
    ])
    render(<UserProfileModal userId="u1" onClose={() => {}} />)
    expect(await screen.findByText('Muy puntual')).toBeInTheDocument()
    expect(screen.getByText(/— Agro SA/)).toBeInTheDocument()
    expect(screen.getByText(/— Empresa/)).toBeInTheDocument()
  })

  it('indica cuando todavía no tiene opiniones', async () => {
    mockApi([])
    render(<UserProfileModal userId="u1" onClose={() => {}} />)
    expect(await screen.findByText('Todavía no tiene opiniones.')).toBeInTheDocument()
  })

  it('no rompe el perfil si falla la carga de opiniones', async () => {
    mockApi(new Error('boom'))
    render(<UserProfileModal userId="u1" onClose={() => {}} />)
    expect(await screen.findByText('Fletes del Norte')).toBeInTheDocument()
    expect(await screen.findByText('Todavía no tiene opiniones.')).toBeInTheDocument()
  })
})
