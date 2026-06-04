import { Avatar } from '../ui/Avatar'

interface BidHistoryProps {
  bids: {
    id: string
    amount: number
    createdAt: string
    user: { companyName?: string; ratingAvg: number }
  }[]
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price)
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BidHistory({ bids }: BidHistoryProps) {
  const sortedBids = [...bids].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-secondary-500">
        No hay ofertas aún
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedBids.map((bid, index) => (
        <div
          key={bid.id}
          className="flex items-center gap-3 p-3 bg-surface rounded"
        >
          <Avatar name={bid.user?.companyName} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {bid.user?.companyName || 'Usuario'}
            </p>
            <p className="text-xs text-secondary-500">
              {formatTime(bid.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono font-semibold text-accent">
              {formatPrice(bid.amount)}
            </p>
            {bid.user?.ratingAvg > 0 && (
              <p className="text-xs text-warning">★ {bid.user.ratingAvg.toFixed(1)}</p>
            )}
          </div>
          {index === 0 && (
            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">
              Mayor
            </span>
          )}
        </div>
      ))}
    </div>
  )
}