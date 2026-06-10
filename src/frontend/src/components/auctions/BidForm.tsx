import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
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
  cargoWeightKg?: number
  onBidPlaced?: () => void
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price)
}

export function BidForm({ auctionId, currentPrice, cargoWeightKg, onBidPlaced }: BidFormProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [truckId, setTruckId] = useState('')
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const bidAmount = parseFloat(amount)
    if (isNaN(bidAmount) || bidAmount <= 0) {
      setError('Ingresá un monto válido')
      return
    }

    if (bidAmount >= currentPrice) {
      setError(`La oferta debe ser menor a ${formatPrice(currentPrice)}`)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-secondary-500">
        Precio actual: <span className="font-mono text-accent font-semibold">{formatPrice(currentPrice)}</span>
      </div>

      {trucks.length > 0 ? (
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
