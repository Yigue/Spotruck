import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuthStore } from '../hooks/useAuthStore'
import { Alert } from '../components/ui/Alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.data, data.data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(
        status === 401 || status === 400
          ? 'Email o contraseña incorrectos'
          : 'No pudimos conectar con el servidor. Probá de nuevo en unos segundos.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-primary mb-1">Spottruck</h1>
        <p className="text-text-muted text-sm mb-6">Iniciá sesión para continuar</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert">
              <Alert type="error">{error}</Alert>
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="label">Email</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="label">Contraseña</label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-primary font-medium">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-primary font-medium">Registrate</Link>
        </p>
      </div>
    </div>
  )
}
