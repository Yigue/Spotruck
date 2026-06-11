import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'

const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Número', test: (p: string) => /\d/.test(p) },
  { label: 'Letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Letra minúscula', test: (p: string) => /[a-z]/.test(p) },
]

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [loading, setLoading] = useState(false)

  const rulesOk = passwordRules.every((r) => r.test(password))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rulesOk) {
      toast.error('La contraseña no cumple los requisitos')
      return
    }
    if (password !== repeat) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      toast.success('¡Contraseña actualizada! Iniciá sesión')
      navigate('/login')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'No se pudo restablecer la contraseña'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card w-full max-w-md p-8 text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-lg font-bold">Link inválido</h1>
          <p className="text-sm text-text-muted">Pedí un link nuevo desde "¿Olvidaste tu contraseña?"</p>
          <Link to="/forgot-password" className="btn-primary inline-block">Pedir link nuevo</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-primary mb-1">Nueva contraseña</h1>
        <p className="text-text-muted text-sm mb-6">Elegí tu nueva contraseña de Spottruck</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rp-password" className="label">Nueva contraseña</label>
            <input
              id="rp-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="rp-repeat" className="label">Repetir contraseña</label>
            <input
              id="rp-repeat"
              type="password"
              className="input"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              required
            />
            {repeat && password !== repeat && (
              <p className="text-xs text-error mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <div className="border-l-4 border-primary/40 pl-3 text-xs space-y-1">
            <p className="font-medium text-text-muted">La contraseña debería tener al menos:</p>
            {passwordRules.map((rule) => (
              <p key={rule.label} className={rule.test(password) ? 'text-success' : 'text-text-muted'}>
                {rule.test(password) ? '✓' : '·'} {rule.label}
              </p>
            ))}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
