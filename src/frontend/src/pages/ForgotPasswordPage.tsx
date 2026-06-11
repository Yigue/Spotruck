import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
    } catch {
      // misma respuesta para no revelar si el email existe
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-primary mb-1">¿Olvidaste tu contraseña?</h1>

        {sent ? (
          <div className="space-y-4 mt-4">
            <p className="text-sm">
              📬 Si <span className="font-medium">{email}</span> está registrado, te enviamos un
              link para crear una contraseña nueva. Revisá tu casilla (vence en 1 hora).
            </p>
            <Link to="/login" className="btn-primary inline-block">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <p className="text-text-muted text-sm mb-6">
              Ingresá tu email y te mandamos un link para restablecerla
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fp-email" className="label">Email</label>
                <input
                  id="fp-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Enviando…' : 'Enviarme el link'}
              </button>
            </form>
            <p className="text-center text-sm text-text-muted mt-4">
              <Link to="/login" className="text-primary font-medium">← Volver al inicio de sesión</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
