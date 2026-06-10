import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface Payment {
  id: string
  amount: number
  platformFee: number
  netAmount: number
  status: 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED'
  paymentUrl?: string | null
  mercadopagoStatus?: string | null
  holdExpiresAt?: string | null
}

interface PaymentCardProps {
  tripId: string
  isOwnerCompany: boolean
  isAssignedDriver: boolean
  // Cambia cuando el viaje cambia de estado, para refrescar el pago
  tripStatus: string
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price)

const statusInfo: Record<
  Payment['status'],
  { label: string; variant: 'success' | 'warning' | 'error' | 'info'; description: string }
> = {
  PENDING: {
    label: 'Pago pendiente',
    variant: 'warning',
    description: 'La empresa todavía no realizó el pago',
  },
  HELD: {
    label: 'En custodia',
    variant: 'info',
    description: 'El dinero queda retenido hasta que la empresa confirme la entrega',
  },
  RELEASED: {
    label: 'Liberado',
    variant: 'success',
    description: 'El pago fue liberado al transportista',
  },
  REFUNDED: {
    label: 'Reembolsado',
    variant: 'error',
    description: 'El pago fue devuelto a la empresa',
  },
  DISPUTED: {
    label: 'En disputa',
    variant: 'error',
    description: 'El pago está en revisión',
  },
}

// Estado del pago/escrow del viaje (visible para la empresa dueña y el
// transportista asignado). Si hay link de MercadoPago pendiente, la empresa
// puede pagar desde acá.
export function PaymentCard({ tripId, isOwnerCompany, isAssignedDriver, tripStatus }: PaymentCardProps) {
  const [payment, setPayment] = useState<Payment | null>(null)

  useEffect(() => {
    api
      .get(`/payments/${tripId}`)
      .then(({ data }) => setPayment(data.data))
      .catch(() => setPayment(null))
  }, [tripId, tripStatus])

  if (!payment || (!isOwnerCompany && !isAssignedDriver)) return null

  const info = statusInfo[payment.status]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Pago</h2>
        <Badge variant={info.variant}>{info.label}</Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Monto del flete</span>
          <span className="font-mono font-semibold">{formatPrice(payment.amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Comisión plataforma (8%)</span>
          <span className="font-mono">-{formatPrice(payment.platformFee)}</span>
        </div>
        <div className="flex justify-between border-t border-secondary-500/20 pt-2">
          <span className="text-text-muted">
            {isAssignedDriver ? 'Recibís' : 'El transportista recibe'}
          </span>
          <span className="font-mono font-bold text-primary">{formatPrice(payment.netAmount)}</span>
        </div>
      </div>

      <p className="text-xs text-text-muted mt-3">{info.description}</p>

      {isOwnerCompany && payment.status === 'PENDING' && payment.paymentUrl && (
        <a
          href={payment.paymentUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-accent w-full mt-4 inline-block text-center"
        >
          Pagar con MercadoPago
        </a>
      )}
    </Card>
  )
}
