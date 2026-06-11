import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { tripStatusLabels, tripStatusVariant, cargoLabels } from '../../utils/labels'

interface TripCardProps {
  trip: {
    id: string
    originAddress: string
    destAddress: string
    cargoType: string
    scheduledDate: string
    basePrice: number
    status: string
    user?: { companyName?: string; ratingAvg: number }
    auction?: { currentPrice: number; status: string }
  }
  onClick?: () => void
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function TripCard({ trip, onClick }: TripCardProps) {
  const displayPrice = trip.auction?.currentPrice || trip.basePrice

  return (
    <Card onClick={onClick} className="hover:shadow-card-hover transition-shadow">
      <div className="space-y-3">
        {/* Route */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium truncate max-w-[40%]">{trip.originAddress}</span>
          <span className="text-secondary-500">→</span>
          <span className="font-medium truncate max-w-[40%]">{trip.destAddress}</span>
        </div>

        {/* Cargo type and status */}
        <div className="flex items-center gap-2">
          <Badge variant="info">{cargoLabels[trip.cargoType] ?? trip.cargoType}</Badge>
          <Badge variant={tripStatusVariant[trip.status] ?? 'default'}>
            {tripStatusLabels[trip.status] ?? trip.status}
          </Badge>
        </div>

        {/* Price and date */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-mono font-semibold text-accent">
            {formatPrice(displayPrice)}
          </span>
          <span className="text-xs text-secondary-500">
            {formatDate(trip.scheduledDate)}
          </span>
        </div>

        {/* Company and rating */}
        {trip.user && (
          <div className="flex items-center gap-2 pt-2 border-t border-secondary-500/20">
            <span className="text-sm text-secondary-500">{trip.user.companyName || 'Sin empresa'}</span>
            {trip.user.ratingAvg > 0 && (
              <span className="text-xs text-warning">★ {trip.user.ratingAvg.toFixed(1)}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}