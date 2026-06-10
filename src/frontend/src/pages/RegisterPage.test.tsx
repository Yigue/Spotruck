import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

// Hoisted mock variables - safe inside vi.mock factories (no TDZ)
const { mockSetAuth, mockNavigate } = vi.hoisted(() => ({
  mockSetAuth: vi.fn(),
  mockNavigate: vi.fn(),
}))

// Mock api
vi.mock('../utils/api', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
  },
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useAuthStore
vi.mock('../hooks/useAuthStore', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = { token: null, refreshToken: null, user: null, setAuth: mockSetAuth, logout: vi.fn() }
    return selector ? selector(state) : state
  }),
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import RegisterPage from '../pages/RegisterPage'

const renderRegister = () =>
  render(
    <BrowserRouter>
      <RegisterPage />
    </BrowserRouter>
  )

// Completa el paso 1 (credenciales + términos) y avanza al paso 2
const completeStep1 = (role: 'COMPANY' | 'DRIVER' = 'COMPANY') => {
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
    target: { value: 'user@test.com' },
  })
  fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
    target: { value: 'Password1' },
  })
  fireEvent.change(screen.getByLabelText(/repetir contraseña/i), {
    target: { value: 'Password1' },
  })
  fireEvent.click(
    screen.getByLabelText(role === 'COMPANY' ? /empresa/i : /transportista/i)
  )
  fireEvent.click(screen.getByLabelText(/acepto las condiciones/i))
  fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders step 1 with credentials, role radios and terms checkbox', () => {
    renderRegister()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/repetir contraseña/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/transportista/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/acepto las condiciones/i)).toBeInTheDocument()
  })

  it('shows password rules feedback', () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
      target: { value: 'Password1' },
    })
    expect(screen.getByText(/✓ número/i)).toBeInTheDocument()
    expect(screen.getByText(/✓ letra mayúscula/i)).toBeInTheDocument()
  })

  it('does not advance without accepting terms', () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), {
      target: { value: 'Password1' },
    })
    fireEvent.change(screen.getByLabelText(/repetir contraseña/i), {
      target: { value: 'Password1' },
    })
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(toast.error).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /registrarse/i })).not.toBeInTheDocument()
  })

  it('shows company fields on step 2 when role is COMPANY', () => {
    renderRegister()
    completeStep1('COMPANY')
    expect(screen.getByLabelText(/razón social/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cuit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ubicación/i)).toBeInTheDocument()
  })

  it('shows driver fields on step 2 when role is DRIVER', () => {
    renderRegister()
    completeStep1('DRIVER')
    expect(screen.getByLabelText(/licencia de conducir/i)).toBeInTheDocument()
    expect(screen.getByText(/cargar tus camiones desde el perfil/i)).toBeInTheDocument()
  })

  it('calls api.post on submit with form fields', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1', email: 'user@test.com', role: 'COMPANY' },
        },
      },
    })

    renderRegister()
    completeStep1('COMPANY')
    fireEvent.change(screen.getByLabelText(/razón social/i), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText(/cuit/i), { target: { value: '20-12345678-1' } })
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
        email: 'user@test.com',
        password: 'Password1',
        role: 'COMPANY',
        companyName: 'Acme',
      }))
    })
  })

  it('sets auth and navigates to dashboard on success', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1', email: 'user@test.com', role: 'COMPANY' },
        },
      },
    })

    renderRegister()
    completeStep1('COMPANY')
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }))

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('allows skipping details ("completar la información luego")', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1', email: 'user@test.com', role: 'COMPANY' },
        },
      },
    })

    renderRegister()
    completeStep1('COMPANY')
    fireEvent.click(screen.getByRole('button', { name: /^sí$/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        email: 'user@test.com',
        password: 'Password1',
        role: 'COMPANY',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows toast error on failure', async () => {
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
    completeStep1('COMPANY')
    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email ya registrado')
    })
  })

  it('has a link to login page', () => {
    renderRegister()
    expect(screen.getByRole('link', { name: /iniciá sesión/i })).toHaveAttribute('href', '/login')
  })
})
