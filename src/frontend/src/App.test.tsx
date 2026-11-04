import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { state } = vi.hoisted(() => ({ state: { token: null as string | null } }))

vi.mock('./hooks/useAuthStore', () => ({
  useAuthStore: vi.fn((selector?: (s: unknown) => unknown) => {
    const s = { token: state.token, user: null, setAuth: vi.fn(), logout: vi.fn() }
    return selector ? selector(s) : s
  }),
}))
// Páginas pesadas fuera del alcance de este test de enrutado
vi.mock('./components/Layout', () => ({ default: () => <div>layout</div> }))

import App from './App'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('App routing', () => {
  beforeEach(() => {
    state.token = null
  })

  it('muestra la landing pública en "/" sin sesión', () => {
    renderAt('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/flete al mejor precio/i)
    expect(screen.getByRole('link', { name: /soy transportista/i })).toHaveAttribute(
      'href',
      '/register?role=DRIVER',
    )
  })

  it('redirige "/" al panel con sesión iniciada', async () => {
    state.token = 'tok'
    renderAt('/')
    expect(await screen.findByText('layout')).toBeInTheDocument()
    expect(screen.queryByText(/flete al mejor precio/i)).not.toBeInTheDocument()
  })

  it('manda a /login las rutas protegidas sin sesión', async () => {
    renderAt('/trips')
    expect(await screen.findByText(/Iniciá sesión para continuar/i)).toBeInTheDocument()
  })

  it('muestra 404 para rutas inexistentes', () => {
    renderAt('/ruta-que-no-existe')
    expect(screen.getByRole('heading', { name: /página no encontrada/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
  })
})
