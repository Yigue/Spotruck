import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { AuctionCountdown } from './AuctionCountdown'

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

const typeLabels = {
  OPEN: 'Abierta',
  DUTCH: 'Holandesa',
  SEALED: 'Cerrada',
}

const statusInfo: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  OPEN: { label: 'En subasta', variant: 'success' },
  CLOSED: { label: 'Cerrada', variant: 'default' },
  SETTLED: { label: 'Adjudicada', variant: 'info' },
  CANCELLED: { label: 'Cancelada', variant: 'error' },
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
          <Badge variant={statusInfo[auction.status]?.variant ?? 'default'}>
            {statusInfo[auction.status]?.label ?? auction.status}
          </Badge>
        </div>

        {/* Current price + countdown en vivo */}
        <div className="flex items-center justify-between">
          <div>
            <span className={`font-mono font-bold text-accent ${auction.type === 'DUTCH' ? 'text-3xl' : 'text-2xl'}`}>
              {formatPrice(auction.currentPrice)}
            </span>
            {auction.type === 'DUTCH' && auction.status === 'OPEN' && (
              <span className="block text-xs text-warning font-medium">⏬ Precio baja en vivo</span>
            )}
          </div>
          <AuctionCountdown endTime={auction.endTime} status={auction.status} />
        </div>

        {/* Bid count — en SEALED no se revela cuántos compiten */}
        {auction.type !== 'SEALED' && (
          <div className="text-sm text-secondary-500">
            {bidCount} oferta{bidCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Card>
  )
}