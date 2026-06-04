import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuthStore } from '../hooks/useAuthStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.data, data.data.user)
      navigate('/dashboard')
    } catch {
      alert('Credenciales inválidas')
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
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
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

import { Link } from 'react-router-dom'
