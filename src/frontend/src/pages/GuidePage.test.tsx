import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { state } = vi.hoisted(() => ({ state: { token: null as string | null, role: undefined as string | undefined } }))
vi.mock('../hooks/useAuthStore', () => ({
  useAuthStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ token: state.token, user: state.role ? { role: state.role } : null }),
  ),
}))

import GuidePage from './GuidePage'
import { guideSteps } from '../utils/guideSteps'

const renderGuide = () =>
  render(
    <MemoryRouter>
      <GuidePage />
    </MemoryRouter>,
  )

describe('GuidePage', () => {
  it('cubre el recorrido completo del informe original para cada rol', () => {
    // Camionero: registrarse, camión, postularse, aceptado/viaje, calificar. Empresa: registrarse, publicar, postulantes, aceptar, viaje, calificar
    expect(guideSteps.DRIVER.length).toBeGreaterThanOrEqual(5)
    expect(guideSteps.COMPANY.length).toBeGreaterThanOrEqual(6)
    expect(guideSteps.DRIVER[guideSteps.DRIVER.length - 1].title).toMatch(/califi/i)
    expect(guideSteps.COMPANY[guideSteps.COMPANY.length - 1].title).toMatch(/califi/i)
  })

  it('muestra los pasos del transportista y cambia a empresa', () => {
    state.token = null
    state.role = undefined
    renderGuide()
    expect(screen.getByText('Registrá tu camión')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /soy empresa/i }))
    expect(screen.getByText('Publicá tu viaje')).toBeInTheDocument()
    expect(screen.queryByText('Registrá tu camión')).not.toBeInTheDocument()
  })

  it('sin sesión ofrece crear la cuenta con el rol elegido', () => {
    state.token = null
    renderGuide()
    fireEvent.click(screen.getByRole('tab', { name: /soy empresa/i }))
    expect(screen.getByRole('link', { name: /crear mi cuenta/i })).toHaveAttribute('href', '/register?role=COMPANY')
  })

  it('con sesión de empresa abre directo la guía de empresa y vuelve al panel', () => {
    state.token = 'tok'
    state.role = 'COMPANY'
    renderGuide()
    expect(screen.getByText('Publicá tu viaje')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al panel/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: /crear mi cuenta/i })).not.toBeInTheDocument()
  })
})
