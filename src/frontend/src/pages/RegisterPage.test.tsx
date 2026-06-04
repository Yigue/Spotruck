import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import api from '../utils/api'

// Mock api
vi.mock('../utils/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Mock useAuthStore
let mockSetAuth = vi.fn()
vi.mock('../hooks/useAuthStore', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = { token: null, refreshToken: null, user: null, setAuth: mockSetAuth, logout: vi.fn() }
    return selector ? selector(state) : state
  }),
}))

import RegisterPage from '../pages/RegisterPage'

const renderRegister = () =>
  render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  )

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetAuth = vi.fn()
  })

  it('renders role select and email/password fields', () => {
    renderRegister()
    expect(screen.getByLabelText(/tipo de cuenta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('shows company fields when role is COMPANY', () => {
    renderRegister()
    const select = screen.getByLabelText(/tipo de cuenta/i)
    fireEvent.change(select, { target: { value: 'COMPANY' } })
    expect(screen.getByLabelText(/nombre de la empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cuit/i)).toBeInTheDocument()
  })

  it('shows driver fields when role is DRIVER', () => {
    renderRegister()
    const select = screen.getByLabelText(/tipo de cuenta/i)
    fireEvent.change(select, { target: { value: 'DRIVER' } })
    expect(screen.getByLabelText(/licencia de conducir/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/patente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de vehículo/i)).toBeInTheDocument()
  })

  it('calls api.post on submit with all form fields', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1', email: 'company@test.com', role: 'COMPANY' },
        },
      },
    })

    renderRegister()
    fireEvent.change(screen.getByLabelText(/tipo de cuenta/i), { target: { value: 'COMPANY' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'company@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/nombre de la empresa/i), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText(/cuit/i), { target: { value: '20-12345678-1' } })
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '1234567890' } })
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
        email: 'company@test.com',
        password: 'password123',
        role: 'COMPANY',
        companyName: 'Acme',
      }))
    })
  })

  it('sets auth and navigates to dashboard on success', async () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', async () => {
      const actual = await import('react-router-dom')
      return { ...actual, useNavigate: () => mockNavigate }
    })

    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1', email: 'driver@test.com', role: 'DRIVER' },
        },
      },
    })

    renderRegister()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'driver@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows alert on failure', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Email ya registrado',
          },
        },
      },
    })

    renderRegister()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'taken@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Email ya registrado')
    })
    alertMock.mockRestore()
  })

  it('disables button while loading', async () => {
    let resolve: (val: unknown) => void
    vi.mocked(api.post).mockImplementation(
      () => new Promise((r) => { resolve = r as unknown as (val: unknown) => void })
    )

    renderRegister()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(screen.getByRole('button', { name: /creando cuenta/i })).toBeDisabled()
    resolve!({ data: { data: { accessToken: '', refreshToken: '', user: {} } } })
  })

  it('has a link to login page', () => {
    renderRegister()
    expect(screen.getByRole('link', { name: /iniciá sesión/i })).toHaveAttribute('href', '/login')
  })
})