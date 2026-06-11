import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../hooks/useAuthStore'

const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Número', test: (p: string) => /\d/.test(p) },
  { label: 'Letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Letra minúscula', test: (p: string) => /[a-z]/.test(p) },
]

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordRepeat: '',
    role: 'COMPANY' as 'COMPANY' | 'DRIVER',
    companyName: '',
    companyCuit: '',
    address: '',
    phone: '',
    driverLicense: '',
  })
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const rulesOk = passwordRules.every((r) => r.test(form.password))

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rulesOk) {
      toast.error('La contraseña no cumple los requisitos')
      return
    }
    if (form.password !== form.passwordRepeat) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (!terms) {
      toast.error('Tenés que aceptar las condiciones y la política de privacidad')
      return
    }
    setStep(2)
  }

  const register = async (skipDetails: boolean) => {
    setLoading(true)
    try {
      const payload: Record<string, string> = {
        email: form.email,
        password: form.password,
        role: form.role,
      }
      if (!skipDetails) {
        if (form.companyName) payload.companyName = form.companyName
        if (form.companyCuit) payload.companyCuit = form.companyCuit
        if (form.phone) payload.phone = form.phone
        if (form.driverLicense) payload.driverLicense = form.driverLicense
      }
      const { data } = await api.post('/auth/register', payload)
      setAuth(data.data, data.data.user)
      if (!skipDetails && form.role === 'COMPANY' && form.address) {
        await api.put('/users/me', { address: form.address }).catch(() => {})
      }
      toast.success('¡Bienvenido a Spottruck!')
      navigate(form.role === 'DRIVER' && !skipDetails ? '/profile' : '/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Error al registrar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-6">
        <h1 className="text-2xl font-bold text-primary mb-1">Crear cuenta</h1>
        <p className="text-text-muted text-sm mb-6">
          Sumate a Spottruck · Paso {step} de 2
        </p>

        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label htmlFor="reg-email" className="label">Correo electrónico</label>
              <input id="reg-email" name="email" type="email" className="input" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="reg-password" className="label">Contraseña</label>
              <input id="reg-password" name="password" type="password" className="input" value={form.password} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="reg-password-repeat" className="label">Repetir contraseña</label>
              <input id="reg-password-repeat" name="passwordRepeat" type="password" className="input" value={form.passwordRepeat} onChange={handleChange} required />
              {form.passwordRepeat && form.password !== form.passwordRepeat && (
                <p className="text-xs text-error mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            <div className="border-l-4 border-primary/40 pl-3 text-xs space-y-1">
              <p className="font-medium text-text-muted">La contraseña debería tener al menos:</p>
              {passwordRules.map((rule) => (
                <p
                  key={rule.label}
                  className={rule.test(form.password) ? 'text-success' : 'text-text-muted'}
                >
                  {rule.test(form.password) ? '✓' : '·'} {rule.label}
                </p>
              ))}
            </div>

            <div>
              <label className="label">Tipo de usuario</label>
              <div className="space-y-2">
                {(['COMPANY', 'DRIVER'] as const).map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={handleChange}
                    />
                    {role === 'COMPANY' ? 'Empresa (publico viajes)' : 'Transportista (me postulo a viajes)'}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Acepto las Condiciones, la{' '}
                <span className="text-primary font-medium">Política de privacidad</span> y la
                Política de cookies
              </span>
            </label>

            <button type="submit" className="btn-primary w-full">
              Siguiente
            </button>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              register(false)
            }}
            className="space-y-4"
          >
            {form.role === 'COMPANY' ? (
              <>
                <div>
                  <label htmlFor="reg-company-name" className="label">Razón social</label>
                  <input id="reg-company-name" name="companyName" className="input" value={form.companyName} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="reg-cuit" className="label">CUIT</label>
                  <input id="reg-cuit" name="companyCuit" className="input" value={form.companyCuit} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="reg-address" className="label">Ubicación</label>
                  <input id="reg-address" name="address" className="input" value={form.address} onChange={handleChange} placeholder="Ej: Colectora Panamericana km 33" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="reg-driver-name" className="label">Nombre</label>
                  <input id="reg-driver-name" name="companyName" className="input" value={form.companyName} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="reg-license" className="label">Licencia de conducir</label>
                  <input id="reg-license" name="driverLicense" className="input" value={form.driverLicense} onChange={handleChange} />
                </div>
                <p className="text-xs text-text-muted">
                  Después de registrarte vas a poder cargar tus camiones desde el perfil.
                </p>
              </>
            )}
            <div>
              <label htmlFor="reg-phone" className="label">Teléfono (WhatsApp)</label>
              <input id="reg-phone" name="phone" type="tel" className="input" value={form.phone} onChange={handleChange} placeholder="+54 9 ..." />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </button>
            <p className="text-center text-sm text-text-muted">
              ¿Querés completar la información luego?{' '}
              <button
                type="button"
                className="text-primary font-medium"
                disabled={loading}
                onClick={() => register(true)}
              >
                Sí
              </button>
            </p>
            <button
              type="button"
              className="text-xs text-text-muted w-full"
              onClick={() => setStep(1)}
            >
              ← Volver al paso anterior
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-muted mt-4">
          ¿Ya tenés cuenta? <Link to="/login" className="text-primary font-medium">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
