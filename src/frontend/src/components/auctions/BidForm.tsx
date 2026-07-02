import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import toast from 'react-hot-toast'

interface Truck {
  id: string
  plate: string
  type: string
  capacityKg: number
  active: boolean
}

interface BidFormProps {
  auctionId: string
  currentPrice: number
  // Wave 1: la UI se ramifica según el tipo de subasta (OPEN | DUTCH | SEALED)
  auctionType?: 'OPEN' | 'DUTCH' | 'SEALED'
  cargoWeightKg?: number
  onBidPlaced?: () => void
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price)
}

// La oferta debe ser al menos 10% menor al precio actual (regla del backend)
const MIN_BID_DECREMENT = 0.1

export function BidForm({ auctionId, currentPrice, auctionType = 'OPEN', cargoWeightKg, onBidPlaced }: BidFormProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [truckId, setTruckId] = useState('')
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dutchConfirm, setDutchConfirm] = useState(false)

  const maxAllowedBid = Math.floor(currentPrice * (1 - MIN_BID_DECREMENT))

  useEffect(() => {
    api
      .get('/trucks')
      .then(({ data }) => {
        const active = (data.data as Truck[]).filter((t) => t.active)
        setTrucks(active)
        if (active.length > 0) setTruckId(active[0].id)
      })
      .catch(() => {})
  }, [])

  const placeBid = async (bidAmount: number, bidNote?: string) => {
    setLoading(true)
    try {
      await api.post(`/auctions/${auctionId}/bid`, {
        amount: bidAmount,
        note: bidNote?.trim() || undefined,
        truckId: truckId || undefined,
      })
      toast.success(auctionType === 'DUTCH' ? '¡Tomaste el viaje al precio actual!' : '¡Te postulaste al viaje!')
      setAmount('')
      setNote('')
      onBidPlaced?.()
      return true
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'No se pudo realizar la oferta'
      toast.error(message)
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const bidAmount = parseFloat(amount)
    if (isNaN(bidAmount) || bidAmount <= 0) {
      setError('Ingresá un monto válido')
      return
    }

    // En SEALED no se muestra el precio actual, así que la regla del 10%
    // la valida solo el servidor; en OPEN se anticipa el error al usuario
    if (auctionType === 'OPEN' && bidAmount > maxAllowedBid) {
      setError(`La oferta debe ser de ${formatPrice(maxAllowedBid)} o menos (10% bajo el precio actual)`)
      return
    }

    await placeBid(bidAmount, note)
  }

  const truckOptions = trucks.map((t) => ({
    value: t.id,
    label: `${t.plate} — ${t.type} (${t.capacityKg.toLocaleString('es-AR')} kg)${
      cargoWeightKg && t.capacityKg < cargoWeightKg ? ' ⚠ capacidad insuficiente' : ''
    }`,
  }))

  const noTrucksHint = (
    <p className="text-xs text-text-muted">
      No tenés camiones cargados.{' '}
      <Link to="/profile" className="text-primary font-medium">
        Agregá tu flota en el perfil
      </Link>{' '}
      para postularte con un camión.
    </p>
  )

  // DUTCH: sin campos — un único botón "¡Tomar!" que acepta el precio actual.
  // El precio es autoritativo del servidor y se refresca por WebSocket
  // (la página re-fetchea el viaje en cada auction_update).
  if (auctionType === 'DUTCH') {
    return (
      <div className="space-y-4">
        <div className="text-sm text-secondary-500">
          Precio actual:{' '}
          <span className="font-mono text-accent font-semibold">{formatPrice(currentPrice)}</span>
          <span className="block text-xs mt-0.5 text-accent">
            ↓ Subasta holandesa: el primero que toma el precio se lleva el viaje
          </span>
        </div>

        {trucks.length > 0 ? (
          <Select
            label="Camión a elegir"
            options={truckOptions}
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
          />
        ) : (
          noTrucksHint
        )}

        {error && <p className="text-xs text-error">{error}</p>}

        <Button
          type="button"
          variant="accent"
          loading={loading}
          className="w-full"
          onClick={() => setDutchConfirm(true)}
        >
          ¡Tomar!
        </Button>

        <ConfirmDialog
          open={dutchConfirm}
          title="¿Tomar el viaje?"
          description={`Vas a aceptar el precio actual de ${formatPrice(currentPrice)}. ¿Confirmás?`}
          confirmLabel="Sí, tomar"
          loading={loading}
          onConfirm={async () => {
            const ok = await placeBid(currentPrice)
            if (ok) setDutchConfirm(false)
          }}
          onCancel={() => setDutchConfirm(false)}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {auctionType === 'SEALED' ? (
        // SEALED: no se muestra el mejor precio actual — la propuesta es privada
        <p className="text-xs text-text-muted">
          🔒 Oferta sellada — tu propuesta es privada
        </p>
      ) : (
        <div className="text-sm text-secondary-500">
          Precio actual: <span className="font-mono text-accent font-semibold">{formatPrice(currentPrice)}</span>
          <span className="block text-xs mt-0.5">
            Tu oferta debe ser de <span className="font-mono font-semibold">{formatPrice(maxAllowedBid)}</span> o menos
          </span>
        </div>
      )}

      {trucks.length > 0 ? (
        <Select
          label="Camión a elegir"
          options={truckOptions}
          value={truckId}
          onChange={(e) => setTruckId(e.target.value)}
        />
      ) : (
        noTrucksHint
      )}

      <Input
        type="number"
        label="Precio"
        placeholder="Ingresá el monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={error}
        min={0}
        step={100}
      />

      <div className="space-y-1">
        <label className="label">Aclaración</label>
        <textarea
          className="input"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: Tengo factura A, vuelvo vacío de Buenos Aires (opcional)"
        />
      </div>

      <Button
        type="submit"
        variant="accent"
        loading={loading}
        className="w-full"
      >
        Realizar oferta
      </Button>
    </form>
  )
}
