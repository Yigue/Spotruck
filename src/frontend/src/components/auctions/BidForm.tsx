import { useState, type FormEvent } from 'react'
import api from '../../utils/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import toast from 'react-hot-toast'

interface BidFormProps {
  auctionId: string
  currentPrice: number
  onBidPlaced?: () => void
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price)
}

export function BidForm({ auctionId, currentPrice, onBidPlaced }: BidFormProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      await api.post(`/auctions/${auctionId}/bid`, { amount: bidAmount })
      toast.success('Oferta placed successfully')
      setAmount('')
      onBidPlaced?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place bid'
      toast.error(message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-secondary-500">
        Precio actual: <span className="font-mono text-accent font-semibold">{formatPrice(currentPrice)}</span>
      </div>

      <Input
        type="number"
        label="Tu oferta"
        placeholder="Ingresá el monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={error}
        min={0}
        step={100}
      />

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