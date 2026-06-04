import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function NewTripPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    originAddress: '',
    originLat: '-34.6037',
    originLng: '-58.3816',
    destAddress: '',
    destLat: '-34.6037',
    destLng: '-58.3816',
    cargoType: 'GENERAL',
    cargoDesc: '',
    weightKg: '',
    scheduledDate: '',
    basePrice: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        originLat: parseFloat(form.originLat),
        originLng: parseFloat(form.originLng),
        destLat: parseFloat(form.destLat),
        destLng: parseFloat(form.destLng),
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        basePrice: parseFloat(form.basePrice),
      }
      const { data } = await api.post('/trips', payload)
      toast.success('Viaje creado')
      navigate(`/trips/${data.data.id}`)
    } catch {
      toast.error('Error al crear viaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Publicar nuevo viaje</h1>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Dirección de origen</label>
            <input name="originAddress" className="input" value={form.originAddress} onChange={handleChange} required placeholder="Ej: Av. Corrientes 1000, Buenos Aires" />
          </div>
          <div>
            <label className="label">Latitud origen</label>
            <input name="originLat" type="number" step="any" className="input" value={form.originLat} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Longitud origen</label>
            <input name="originLng" type="number" step="any" className="input" value={form.originLng} onChange={handleChange} required />
          </div>
          <div className="md:col-span-2">
            <label className="label">Dirección de destino</label>
            <input name="destAddress" className="input" value={form.destAddress} onChange={handleChange} required placeholder="Ej: San Martín 500, Rosario" />
          </div>
          <div>
            <label className="label">Latitud destino</label>
            <input name="destLat" type="number" step="any" className="input" value={form.destLat} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Longitud destino</label>
            <input name="destLng" type="number" step="any" className="input" value={form.destLng} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Tipo de carga</label>
            <select name="cargoType" className="input" value={form.cargoType} onChange={handleChange}>
              <option value="GENERAL">General</option>
              <option value="BULK">Granel</option>
              <option value="PALLETS">Pallets</option>
              <option value="REFRIGERATED">Refrigerada</option>
            </select>
          </div>
          <div>
            <label className="label">Peso (kg)</label>
            <input name="weightKg" type="number" className="input" value={form.weightKg} onChange={handleChange} placeholder="Opcional" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Descripción de la carga</label>
            <textarea name="cargoDesc" className="input" rows={2} value={form.cargoDesc} onChange={handleChange} placeholder="Opcional" />
          </div>
          <div>
            <label className="label">Fecha de viaje</label>
            <input name="scheduledDate" type="datetime-local" className="input" value={form.scheduledDate} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Precio base (ARS)</label>
            <input name="basePrice" type="number" className="input" value={form.basePrice} onChange={handleChange} required placeholder="Ej: 45000" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Guardando...' : 'Publicar viaje'}
          </button>
          <button type="button" onClick={() => navigate('/trips')} className="btn-ghost">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
