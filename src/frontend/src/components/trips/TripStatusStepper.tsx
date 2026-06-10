import { useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'

interface TripStatusStepperProps {
  tripId: string
  status: string
  isAssignedDriver: boolean
  isOwnerCompany: boolean
  onStatusChanged: () => void
}

// Estados del viaje según la app original:
// ASSIGNED (Preparando) → IN_PROGRESS (En viaje) → DELIVERED (Esperando
// confirmación) → SETTLED (Finalizada)
const steps = (forCompany: boolean) => [
  'Preparando',
  forCompany ? 'Camionero viajando' : 'En viaje',
  'Esperando confirmación',
  'Finalizada',
]

const statusIndex: Record<string, number> = {
  ASSIGNED: 0,
  IN_PROGRESS: 1,
  DELIVERED: 2,
  SETTLED: 3,
}

const stateMessages: Record<string, { driver: string; company: string }> = {
  ASSIGNED: {
    driver: 'Cuando estés preparado, empezá el viaje',
    company: 'El camionero se está preparando para empezar su viaje, recuerde asegurarse de todo',
  },
  IN_PROGRESS: {
    driver: 'Estás transportando la carga. Cuando llegues, marcá el viaje como terminado',
    company: 'El camionero está transportando su carga',
  },
  DELIVERED: {
    driver: 'Esperando confirmación de la empresa para seguir',
    company: 'El transportista marcó el viaje como terminado. Confirmá la entrega',
  },
  SETTLED: {
    driver: 'Se ha terminado el viaje. ¡No te olvides de valorar, muchas gracias!',
    company: 'Felicitaciones, se ha terminado el viaje',
  },
}

export function TripStatusStepper({
  tripId,
  status,
  isAssignedDriver,
  isOwnerCompany,
  onStatusChanged,
}: TripStatusStepperProps) {
  const [confirm, setConfirm] = useState<'start' | 'finish' | 'confirm-delivery' | null>(null)
  const [loading, setLoading] = useState(false)

  const current = statusIndex[status]
  if (current === undefined) return null

  const labels = steps(isOwnerCompany)
  const message = stateMessages[status]?.[isAssignedDriver ? 'driver' : 'company']

  const handleAction = async () => {
    if (!confirm) return
    setLoading(true)
    try {
      await api.post(`/trips/${tripId}/${confirm}`)
      toast.success(
        confirm === 'start'
          ? '¡Buen viaje!'
          : confirm === 'finish'
            ? 'Viaje marcado como terminado'
            : 'Entrega confirmada, pago liberado'
      )
      setConfirm(null)
      onStatusChanged()
    } catch {
      toast.error('No se pudo actualizar el estado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center">
        {labels.map((label, i) => (
          <div key={label} className={`flex items-center ${i > 0 ? 'flex-1' : ''}`}>
            {i > 0 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${i <= current ? 'bg-primary' : 'bg-secondary-300'}`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                  i < current
                    ? 'bg-primary border-primary text-white'
                    : i === current
                      ? 'border-primary text-primary'
                      : 'border-secondary-300 text-secondary-500'
                }`}
              >
                {i < current ? '✓' : i + 1}
              </div>
              <span
                className={`text-[10px] text-center max-w-[80px] leading-tight ${
                  i === current ? 'text-primary font-semibold' : 'text-text-muted'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className="border border-primary/40 rounded-lg p-4 text-center">
          <p className="text-primary font-semibold text-sm mb-1">{labels[current]}</p>
          <p className="text-sm text-text-muted">{message}</p>
        </div>
      )}

      {/* Acciones por rol */}
      <div className="flex justify-center gap-3">
        {isAssignedDriver && status === 'ASSIGNED' && (
          <Button variant="accent" onClick={() => setConfirm('start')}>
            Empezar viaje
          </Button>
        )}
        {isAssignedDriver && status === 'IN_PROGRESS' && (
          <Button variant="accent" onClick={() => setConfirm('finish')}>
            Terminé el viaje
          </Button>
        )}
        {isOwnerCompany && status === 'DELIVERED' && (
          <Button variant="accent" onClick={() => setConfirm('confirm-delivery')}>
            Confirmar entrega
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirm === 'start'}
        title="¿Estás seguro?"
        description="No podrás volver atrás"
        confirmLabel="Sí, ¡empezar viaje!"
        loading={loading}
        onConfirm={handleAction}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'finish'}
        title="¿Has terminado el viaje?"
        description="¡No podrás volver atrás!"
        confirmLabel="¡Sí, he terminado!"
        loading={loading}
        onConfirm={handleAction}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'confirm-delivery'}
        title="¿El transportista ha terminado el viaje?"
        description="¡No podrás volver atrás! Se libera el pago al transportista"
        confirmLabel="¡Sí, lo terminó!"
        loading={loading}
        onConfirm={handleAction}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
