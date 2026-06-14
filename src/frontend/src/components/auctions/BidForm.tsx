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
  const [confirmDutch, setConfirmDutch] = useState(false)

  const isDutch = auctionType === 'DUTCH'
  const isSealed = auctionType === 'SEALED'
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

  // DUTCH: "¡Tomar!" acepta el precio actual al instante
  const takeDutch = async () => {
    setConfirmDutch(false)
    setLoading(true)
    try {
      await api.post(`/auctions/${auctionId}/bid`, {
        amount: currentPrice,
        truckId: truckId || undefined,
      })
      toast.success('¡Tomaste el viaje!')
      onBidPlaced?.()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'No se pudo tomar el viaje'
      toast.error(message)
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

    // SEALED no compite contra el precio actual (puja privada); OPEN sí
    if (!isSealed && bidAmount > maxAllowedBid) {
      setError(`La oferta debe ser de ${formatPrice(maxAllowedBid)} o menos (10% bajo el precio actual)`)
      return
    }

    setLoading(true)
    try {
      await api.post(`/auctions/${auctionId}/bid`, {
        amount: bidAmount,
        note: note.trim() || undefined,
        truckId: truckId || undefined,
      })
      toast.success('¡Te postulaste al viaje!')
      setAmount('')
      setNote('')
      onBidPlaced?.()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'No se pudo realizar la oferta'
      toast.error(message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const truckOptions = trucks.map((t) => ({
    value: t.id,
    label: `${t.plate} — ${t.type} (${t.capacityKg.toLocaleString('es-AR')} kg)${
      cargoWeightKg && t.capacityKg < cargoWeightKg ? ' ⚠ capacidad insuficiente' : ''
    }`,
  }))

  const truckSelector =
    trucks.length > 0 ? (
      <Select
        label="Camión a elegir"
        options={truckOptions}
        value={truckId}
        onChange={(e) => setTruckId(e.target.value)}
      />
    ) : (
      <p className="text-xs text-text-muted">
        No tenés camiones cargados.{' '}
        <Link to="/profile" className="text-primary font-medium">
          Agregá tu flota en el perfil
        </Link>{' '}
        para postularte con un camión.
      </p>
    )

  // ─── DUTCH: solo botón "¡Tomar!" ───────────────────────────────────────────
  if (isDutch) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-secondary-500">
          Precio actual:{' '}
          <span className="font-mono text-accent font-bold text-lg">{formatPrice(currentPrice)}</span>
          <span className="block text-xs mt-0.5 text-warning">⏬ El precio baja con el tiempo — tomalo cuando te convenga</span>
        </div>
        {truckSelector}
        <Button variant="accent" loading={loading} className="w-full" onClick={() => setConfirmDutch(true)}>
          ¡Tomar a {formatPrice(currentPrice)}!
        </Button>

        <ConfirmDialog
          open={confirmDutch}
          title="Tomar el viaje"
          description={`Vas a aceptar el precio actual de ${formatPrice(currentPrice)}. ¿Confirmás? Gana el primero que toma.`}
          confirmLabel="Sí, tomar"
          onConfirm={takeDutch}
          onCancel={() => setConfirmDutch(false)}
        />
      </div>
    )
  }

  // ─── OPEN / SEALED ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSealed ? (
        <div className="text-sm bg-background rounded p-3">
          🔒 <span className="font-medium">Oferta sellada</span> — tu propuesta es privada. No
          ves las ofertas de los demás ni ellos la tuya.
        </div>
      ) : (
        <div className="text-sm text-secondary-500">
          Precio actual: <span className="font-mono text-accent font-semibold">{formatPrice(currentPrice)}</span>
          <span className="block text-xs mt-0.5">
            Tu oferta debe ser de <span className="font-mono font-semibold">{formatPrice(maxAllowedBid)}</span> o menos
          </span>
        </div>
      )}

      {truckSelector}

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

      <Button type="submit" variant="accent" loading={loading} className="w-full">
        Realizar oferta
      </Button>
    </form>
  )
}
