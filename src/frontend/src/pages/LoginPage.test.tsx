import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import api from '../utils/api'

// Hoisted mock variables - safe inside vi.mock factories (no TDZ)
const { mockSetAuth, mockNavigate } = vi.hoisted(() => ({
  mockSetAuth: vi.fn(),
  mockNavigate: vi.fn(),
}))

// Mock api
vi.mock('../utils/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Mock useAuthStore
vi.mock('../hooks/useAuthStore', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      token: null,
      refreshToken: null,
      user: null,
      setAuth: mockSetAuth,
      logout: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import LoginPage from '../pages/LoginPage'

const renderLogin = () =>
  render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  )

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password inputs', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('shows submit button with default text', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('calls api.post on submit with email and password', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1', email: 'test@test.com', role: 'COMPANY' },
        },
      },
    })

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
      })
    })
  })

  it('sets auth and navigates to dashboard on success', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1', email: 'test@test.com', role: 'COMPANY' },
        },
      },
    })

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows alert on failure', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.mocked(api.post).mockRejectedValue(new Error('Invalid'))

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Credenciales inválidas')
    })
    alertMock.mockRestore()
  })

  it('disables button while loading', async () => {
    let resolve: (val: unknown) => void
    vi.mocked(api.post).mockImplementation(
      () => new Promise((r) => { resolve = r as unknown as (val: unknown) => void })
    )

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(screen.getByRole('button', { name: /ingresando/i })).toBeDisabled()

    resolve!({ data: { data: { accessToken: '', refreshToken: '', user: {} } } })
  })

  it('has a link to register page', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /registrate/i })).toHaveAttribute('href', '/register')
  })
})