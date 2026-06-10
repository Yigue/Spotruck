import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Spinner } from '../components/ui/Spinner'

interface Truck {
  id: string
  plate: string
  type: string
  capacityKg: number
  preferredCargo?: string | null
  senasaNumber?: string | null
  active: boolean
}

interface Me {
  id: string
  email: string
  emailVerified?: boolean
  role: 'COMPANY' | 'DRIVER' | 'ADMIN'
  companyName?: string
  companyCuit?: string
  phone?: string
  driverLicense?: string
  preferredZone?: string
  address?: string
  website?: string
  sector?: string
  ratingAvg: number
  ratingCount: number
  tripsCompleted: number
  trucks?: Truck[]
}

const truckTypeOptions = [
  { value: 'JAULA', label: 'Jaula' },
  { value: 'SEMI', label: 'Semi' },
  { value: 'TOLVA', label: 'Tolva' },
  { value: 'BATEA', label: 'Batea' },
  { value: 'FURGON', label: 'Furgón' },
  { value: 'REFRIGERADO', label: 'Refrigerado' },
  { value: 'PLAYO', label: 'Playo' },
  { value: 'OTRO', label: 'Otro' },
]

const cargoOptions = [
  { value: '', label: 'Sin preferencia' },
  { value: 'BULK', label: 'Granel' },
  { value: 'PALLETS', label: 'Pallets' },
  { value: 'GENERAL', label: 'General' },
  { value: 'REFRIGERATED', label: 'Refrigerada' },
]

const emptyTruckForm = { plate: '', type: 'SEMI', capacityKg: '', preferredCargo: '', senasaNumber: '' }

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  // Flota
  const [truckModal, setTruckModal] = useState<'new' | Truck | null>(null)
  const [truckForm, setTruckForm] = useState(emptyTruckForm)
  const [truckSaving, setTruckSaving] = useState(false)
  const [deleteTruck, setDeleteTruck] = useState<Truck | null>(null)

  const loadMe = () => {
    api.get('/users/me').then(({ data }) => {
      setMe(data.data)
      const u = data.data
      setForm({
        companyName: u.companyName ?? '',
        companyCuit: u.companyCuit ?? '',
        phone: u.phone ?? '',
        driverLicense: u.driverLicense ?? '',
        preferredZone: u.preferredZone ?? '',
        address: u.address ?? '',
        website: u.website ?? '',
        sector: u.sector ?? '',
      })
    })
  }

  useEffect(loadMe, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '')
      )
      await api.put('/users/me', payload)
      toast.success('Perfil actualizado')
      loadMe()
    } catch {
      toast.error('Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const openTruckModal = (truck: 'new' | Truck) => {
    setTruckModal(truck)
    setTruckForm(
      truck === 'new'
        ? emptyTruckForm
        : {
            plate: truck.plate,
            type: truck.type,
            capacityKg: String(truck.capacityKg),
            preferredCargo: truck.preferredCargo ?? '',
            senasaNumber: truck.senasaNumber ?? '',
          }
    )
  }

  const handleTruckSave = async (e: FormEvent) => {
    e.preventDefault()
    const capacity = parseFloat(truckForm.capacityKg)
    if (!truckForm.plate.trim() || isNaN(capacity) || capacity <= 0) {
      toast.error('Completá patente y capacidad')
      return
    }
    setTruckSaving(true)
    try {
      const payload = {
        plate: truckForm.plate.trim().toUpperCase(),
        type: truckForm.type,
        capacityKg: capacity,
        preferredCargo: truckForm.preferredCargo || undefined,
        senasaNumber: truckForm.senasaNumber.trim() || undefined,
      }
      if (truckModal === 'new') {
        await api.post('/trucks', payload)
        toast.success('Camión agregado')
      } else if (truckModal) {
        await api.put(`/trucks/${truckModal.id}`, payload)
        toast.success('Camión actualizado')
      }
      setTruckModal(null)
      loadMe()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Error al guardar el camión'
      toast.error(message)
    } finally {
      setTruckSaving(false)
    }
  }

  const handleTruckDelete = async () => {
    if (!deleteTruck) return
    try {
      await api.delete(`/trucks/${deleteTruck.id}`)
      toast.success('Camión eliminado')
      setDeleteTruck(null)
      loadMe()
    } catch {
      toast.error('No se pudo eliminar el camión')
    }
  }

  if (!me) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  const isDriver = me.role === 'DRIVER'

  return (
    <div className="space-y-6 max-w-3xl">
      {me.emailVerified === false && (
        <div className="bg-warning/10 border border-warning/40 rounded-lg p-3 flex items-center justify-between gap-4">
          <p className="text-sm">
            ⚠️ Tu email todavía no está verificado. Revisá tu casilla o pedí un nuevo link.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              api
                .post('/auth/resend-verification')
                .then(({ data }) =>
                  toast.success(
                    data.data.devMode
                      ? 'Link generado (modo dev: revisá la consola del servidor)'
                      : 'Te reenviamos el email de verificación'
                  )
                )
                .catch(() => toast.error('No se pudo reenviar el email'))
            }
          >
            Reenviar email
          </Button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-text-muted text-sm">
          {me.email} · {isDriver ? 'Transportista' : 'Empresa'}
          {me.emailVerified && <span className="text-success ml-1">✓ verificado</span>}
          {me.ratingCount > 0 && (
            <span className="text-warning ml-2">
              ★ {me.ratingAvg.toFixed(1)} ({me.ratingCount})
            </span>
          )}
          <span className="ml-2">· {me.tripsCompleted} viajes realizados</span>
        </p>
      </div>

      <Card>
        <h2 className="text-lg font-bold mb-4">Datos</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={isDriver ? 'Nombre' : 'Razón social'}
              name="companyName"
              value={form.companyName ?? ''}
              onChange={handleChange}
            />
            <Input label="Teléfono (WhatsApp)" name="phone" value={form.phone ?? ''} onChange={handleChange} placeholder="+54 9 ..." />
            {!isDriver && (
              <>
                <Input label="CUIT" name="companyCuit" value={form.companyCuit ?? ''} onChange={handleChange} />
                <Input label="Ubicación" name="address" value={form.address ?? ''} onChange={handleChange} />
                <Input label="Página web" name="website" value={form.website ?? ''} onChange={handleChange} />
                <Input label="Sector" name="sector" value={form.sector ?? ''} onChange={handleChange} />
              </>
            )}
            {isDriver && (
              <>
                <Input label="Licencia" name="driverLicense" value={form.driverLicense ?? ''} onChange={handleChange} />
                <Input label="Zona preferida" name="preferredZone" value={form.preferredZone ?? ''} onChange={handleChange} placeholder="Ej: NOA, Buenos Aires..." />
              </>
            )}
          </div>
          <Button type="submit" variant="primary" loading={saving}>
            Guardar cambios
          </Button>
        </form>
      </Card>

      {isDriver && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Mis camiones</h2>
            <Button variant="accent" size="sm" onClick={() => openTruckModal('new')}>
              + Agregar camión
            </Button>
          </div>

          {(me.trucks ?? []).length === 0 ? (
            <p className="text-center text-secondary-500 py-6">
              No tenés camiones cargados. Agregá uno para postularte a viajes.
            </p>
          ) : (
            <div className="space-y-3">
              {(me.trucks ?? []).map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-background rounded">
                  <span className="text-2xl">🚛</span>
                  <div className="flex-1">
                    <p className="font-medium">
                      {t.plate} <span className="text-text-muted">— {t.type}</span>
                    </p>
                    <p className="text-xs text-text-muted">
                      {t.capacityKg.toLocaleString('es-AR')} kg
                      {t.senasaNumber && ` · Senasa ${t.senasaNumber}`}
                    </p>
                  </div>
                  {!t.active && <Badge variant="warning">Inactivo</Badge>}
                  <Button size="sm" variant="ghost" onClick={() => openTruckModal(t)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteTruck(t)}>
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modal alta/edición de camión */}
      <Modal
        open={!!truckModal}
        onClose={() => setTruckModal(null)}
        title={truckModal === 'new' ? 'Agregar camión' : 'Editar camión'}
      >
        <form onSubmit={handleTruckSave} className="space-y-4">
          <Input
            label="Patente"
            value={truckForm.plate}
            onChange={(e) => setTruckForm((f) => ({ ...f, plate: e.target.value }))}
            placeholder="AB 123 CD"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de camión"
              options={truckTypeOptions}
              value={truckForm.type}
              onChange={(e) => setTruckForm((f) => ({ ...f, type: e.target.value }))}
            />
            <Input
              label="Capacidad (kg)"
              type="number"
              value={truckForm.capacityKg}
              onChange={(e) => setTruckForm((f) => ({ ...f, capacityKg: e.target.value }))}
              required
            />
          </div>
          <Select
            label="Carga preferida"
            options={cargoOptions}
            value={truckForm.preferredCargo}
            onChange={(e) => setTruckForm((f) => ({ ...f, preferredCargo: e.target.value }))}
          />
          <Input
            label="Nro. Senasa (transporte de alimentos)"
            value={truckForm.senasaNumber}
            onChange={(e) => setTruckForm((f) => ({ ...f, senasaNumber: e.target.value }))}
            placeholder="Opcional"
          />
          <div className="flex gap-3">
            <Button type="submit" variant="accent" loading={truckSaving}>
              Guardar
            </Button>
            <Button type="button" variant="ghost" onClick={() => setTruckModal(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTruck}
        title="¿Eliminar camión?"
        description={`Se eliminará ${deleteTruck?.plate}. Si tiene ofertas asociadas, quedará inactivo.`}
        confirmLabel="Sí, eliminar"
        onConfirm={handleTruckDelete}
        onCancel={() => setDeleteTruck(null)}
      />
    </div>
  )
}
