import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const cargoTypeOptions = [
  { value: 'GENERAL', label: 'General' },
  { value: 'BULK', label: 'Granel' },
  { value: 'PALLETS', label: 'Pallets' },
  { value: 'REFRIGERATED', label: 'Refrigerada' },
]

export default function NewTripPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    originAddress: '',
    originLat: '',
    originLng: '',
    destAddress: '',
    destLat: '',
    destLng: '',
    cargoType: 'GENERAL',
    cargoDesc: '',
    weightKg: '',
    scheduledDate: '',
    basePrice: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((e) => {
        const newErrors = { ...e }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.originAddress.trim()) newErrors.originAddress = 'Requerido'
    if (!form.destAddress.trim()) newErrors.destAddress = 'Requerido'
    if (!form.originLat || isNaN(parseFloat(form.originLat)))
      newErrors.originLat = 'Latitud inválida'
    if (!form.originLng || isNaN(parseFloat(form.originLng)))
      newErrors.originLng = 'Longitud inválida'
    if (!form.destLat || isNaN(parseFloat(form.destLat)))
      newErrors.destLat = 'Latitud inválida'
    if (!form.destLng || isNaN(parseFloat(form.destLng)))
      newErrors.destLng = 'Longitud inválida'
    if (!form.scheduledDate) newErrors.scheduledDate = 'Requerido'
    if (!form.basePrice || parseFloat(form.basePrice) <= 0)
      newErrors.basePrice = 'Precio inválido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        originAddress: form.originAddress,
        originLat: parseFloat(form.originLat),
        originLng: parseFloat(form.originLng),
        destAddress: form.destAddress,
        destLat: parseFloat(form.destLat),
        destLng: parseFloat(form.destLng),
        cargoType: form.cargoType,
        cargoDesc: form.cargoDesc || undefined,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        scheduledDate: form.scheduledDate,
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

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Origin Address */}
          <Input
            label="Dirección de origen"
            name="originAddress"
            value={form.originAddress}
            onChange={handleChange}
            error={errors.originAddress}
            required
            placeholder="Ej: Av. Corrientes 1000, Buenos Aires"
          />

          {/* Origin Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitud origen"
              name="originLat"
              type="number"
              step="any"
              value={form.originLat}
              onChange={handleChange}
              error={errors.originLat}
              required
              placeholder="-34.6037"
            />
            <Input
              label="Longitud origen"
              name="originLng"
              type="number"
              step="any"
              value={form.originLng}
              onChange={handleChange}
              error={errors.originLng}
              required
              placeholder="-58.3816"
            />
          </div>

          {/* Destination Address */}
          <Input
            label="Dirección de destino"
            name="destAddress"
            value={form.destAddress}
            onChange={handleChange}
            error={errors.destAddress}
            required
            placeholder="Ej: San Martín 500, Rosario"
          />

          {/* Destination Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitud destino"
              name="destLat"
              type="number"
              step="any"
              value={form.destLat}
              onChange={handleChange}
              error={errors.destLat}
              required
              placeholder="-34.6037"
            />
            <Input
              label="Longitud destino"
              name="destLng"
              type="number"
              step="any"
              value={form.destLng}
              onChange={handleChange}
              error={errors.destLng}
              required
              placeholder="-58.3816"
            />
          </div>

          {/* Cargo Type and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de carga"
              name="cargoType"
              options={cargoTypeOptions}
              value={form.cargoType}
              onChange={handleChange}
            />
            <Input
              label="Peso (kg)"
              name="weightKg"
              type="number"
              value={form.weightKg}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>

          {/* Cargo Description */}
          <div className="space-y-1">
            <label className="label">Descripción de la carga</label>
            <textarea
              name="cargoDesc"
              className="input"
              rows={2}
              value={form.cargoDesc}
              onChange={handleChange}
              placeholder="Opcional"
            />
          </div>

          {/* Scheduled Date and Base Price */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de viaje"
              name="scheduledDate"
              type="datetime-local"
              value={form.scheduledDate}
              onChange={handleChange}
              error={errors.scheduledDate}
              required
            />
            <Input
              label="Precio base (ARS)"
              name="basePrice"
              type="number"
              value={form.basePrice}
              onChange={handleChange}
              error={errors.basePrice}
              required
              placeholder="Ej: 45000"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="accent" loading={loading}>
              Publicar viaje
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/trips')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}