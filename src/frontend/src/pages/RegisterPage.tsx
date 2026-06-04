import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuthStore } from '../hooks/useAuthStore'

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'COMPANY' as 'COMPANY' | 'DRIVER',
    companyName: '',
    companyCuit: '',
    phone: '',
    driverLicense: '',
    vehiclePlate: '',
    vehicleType: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      setAuth(data.data, data.data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al registrar'
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-6">
        <h1 className="text-2xl font-bold text-primary mb-1">Crear cuenta</h1>
        <p className="text-text-muted text-sm mb-6">Sumate a Spottruck</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tipo de cuenta</label>
            <select name="role" value={form.role} onChange={handleChange} className="input">
              <option value="COMPANY">Empresa (publico viajes)</option>
              <option value="DRIVER">Transportista (pajo en subastas)</option>
            </select>
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Contraseña (mín. 8 caracteres)</label>
            <input name="password" type="password" className="input" value={form.password} onChange={handleChange} required minLength={8} />
          </div>
          {form.role === 'COMPANY' && (
            <>
              <div>
                <label className="label">Nombre de la empresa</label>
                <input name="companyName" className="input" value={form.companyName} onChange={handleChange} />
              </div>
              <div>
                <label className="label">CUIT</label>
                <input name="companyCuit" className="input" value={form.companyCuit} onChange={handleChange} />
              </div>
            </>
          )}
          {form.role === 'DRIVER' && (
            <>
              <div>
                <label className="label">Licencia de conducir</label>
                <input name="driverLicense" className="input" value={form.driverLicense} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Patente</label>
                  <input name="vehiclePlate" className="input" value={form.vehiclePlate} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Tipo de vehículo</label>
                  <input name="vehicleType" className="input" value={form.vehicleType} onChange={handleChange} />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="label">Teléfono</label>
            <input name="phone" type="tel" className="input" value={form.phone} onChange={handleChange} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          ¿Ya tenés cuenta? <Link to="/login" className="text-primary font-medium">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
