import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface AuctionCardProps {
  auction: {
    id: string
    type: 'OPEN' | 'DUTCH' | 'SEALED'
    currentPrice: number
    status: string
    endTime: string
    bids?: { id: string }[]
  }
  trip?: { originAddress: string; destAddress: string }
  onClick?: () => void
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price)
}

const getTimeRemaining = (endTime: string): string => {
  const end = new Date(endTime).getTime()
  const now = Date.now()
  const diff = end - now

  if (diff <= 0) return 'Finalizada'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  return `${hours}h ${minutes}m`
}

const typeLabels = {
  OPEN: 'Abierta',
  DUTCH: 'Holandesa',
  SEALED: 'Cerrada',
}

export function AuctionCard({ auction, trip, onClick }: AuctionCardProps) {
  const bidCount = auction.bids?.length || 0

  return (
    <Card onClick={onClick} className="hover:shadow-card-hover transition-shadow">
      <div className="space-y-3">
        {/* Route if trip provided */}
        {trip && (
          <div className="flex items-center gap-2 text-sm">
            <span className="truncate max-w-[40%]">{trip.originAddress}</span>
            <span className="text-secondary-500">→</span>
            <span className="truncate max-w-[40%]">{trip.destAddress}</span>
          </div>
        )}

        {/* Type and status badges */}
        <div className="flex items-center gap-2">
          <Badge variant="accent">{typeLabels[auction.type]}</Badge>
          <Badge variant={auction.status === 'ACTIVE' ? 'success' : 'default'}>
            {auction.status}
          </Badge>
        </div>

        {/* Current price */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-mono font-bold text-accent">
            {formatPrice(auction.currentPrice)}
          </span>
          <span className="text-xs text-secondary-500">
            {getTimeRemaining(auction.endTime)}
          </span>
        </div>

        {/* Bid count */}
        <div className="text-sm text-secondary-500">
          {bidCount} oferta{bidCount !== 1 ? 's' : ''}
        </div>
      </div>
    </Card>
  )
}