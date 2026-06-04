import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { TripDetailMap } from '../components/maps/TripDetailMap'
import { AuctionCard } from '../components/auctions/AuctionCard'
import { BidForm } from '../components/auctions/BidForm'
import { BidHistory } from '../components/auctions/BidHistory'
import { RatingForm } from '../components/ratings/RatingForm'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../hooks/useAuthStore'
import api from '../utils/api'

interface Trip {
  id: string
  originAddress: string
  originLat: number
  originLng: number
  destAddress: string
  destLat: number
  destLng: number
  cargoType: string
  cargoDesc?: string
  weightKg?: number
  scheduledDate: string
  basePrice: number
  status: string
  user: {
    id: string
    companyName?: string
    ratingAvg: number
  }
  auction?: {
    id: string
    type: 'OPEN' | 'DUTCH' | 'SEALED'
    currentPrice: number
    status: string
    endTime: string
    bids: {
      id: string
      amount: number
      createdAt: string
      user: { companyName?: string; ratingAvg: number }
    }[]
  }
  hasRated?: boolean
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  OPEN: 'Abierto',
  AUCTION: 'En subasta',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En progreso',
  DELIVERED: 'Entregado',
  SETTLED: 'Liquidado',
  CANCELLED: 'Cancelado',
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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRating, setShowRating] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchTrip = async () => {
      try {
        const { data } = await api.get(`/trips/${id}`)
        setTrip(data.data)
      } catch {
        setError('Error al cargar el viaje')
      } finally {
        setLoading(false)
      }
    }

    fetchTrip()
  }, [id])

  const handleBidPlaced = async () => {
    if (!id) return
    try {
      const { data } = await api.get(`/trips/${id}`)
      setTrip(data.data)
    } catch {
      // silently fail
    }
  }

  const handleRated = () => {
    setShowRating(false)
    if (trip) {
      setTrip({ ...trip, hasRated: true })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <EmptyState
        icon="❌"
        title="Viaje no encontrado"
        description={error || 'El viaje que buscas no existe'}
        action={{
          label: 'Volver a viajes',
          onClick: () => navigate('/trips'),
        }}
      />
    )
  }

  const canShowBidForm =
    user?.role === 'DRIVER' &&
    trip.auction &&
    (trip.auction.status === 'OPEN' || trip.auction.status === 'PENDING')

  const canShowRating =
    (trip.status === 'DELIVERED' || trip.status === 'SETTLED') &&
    !trip.hasRated &&
    user?.id !== trip.user?.id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/trips')} className="mb-2">
            ← Volver
          </Button>
          <h1 className="text-2xl font-bold">Detalle del viaje</h1>
        </div>
        <Badge variant={trip.status === 'OPEN' ? 'success' : 'info'}>
          {statusLabels[trip.status] || trip.status}
        </Badge>
      </div>

      {/* Map */}
      <Card className="p-0 overflow-hidden">
        <TripDetailMap
          originLat={trip.originLat}
          originLng={trip.originLng}
          destLat={trip.destLat}
          destLng={trip.destLng}
          originAddress={trip.originAddress}
          destAddress={trip.destAddress}
        />
      </Card>

      {/* Trip Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Route and cargo info */}
        <Card>
          <h2 className="text-lg font-bold mb-4">Información del viaje</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted">Origen</p>
              <p className="font-medium">{trip.originAddress}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Destino</p>
              <p className="font-medium">{trip.destAddress}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Tipo de carga</p>
                <p className="font-medium">{trip.cargoType}</p>
              </div>
              {trip.weightKg && (
                <div>
                  <p className="text-sm text-text-muted">Peso</p>
                  <p className="font-medium">{trip.weightKg} kg</p>
                </div>
              )}
            </div>
            {trip.cargoDesc && (
              <div>
                <p className="text-sm text-text-muted">Descripción</p>
                <p className="font-medium">{trip.cargoDesc}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-text-muted">Fecha programada</p>
              <p className="font-medium">{formatDate(trip.scheduledDate)}</p>
            </div>
          </div>
        </Card>

        {/* Pricing and owner info */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold mb-4">Precio</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Precio base</span>
                <span className="font-mono font-semibold">
                  {formatPrice(trip.basePrice)}
                </span>
              </div>
              {trip.auction && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Precio actual</span>
                  <span className="font-mono font-semibold text-accent">
                    {formatPrice(trip.auction.currentPrice)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {trip.user && (
            <Card>
              <h2 className="text-lg font-bold mb-4">Empresa</h2>
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">{trip.user.companyName || 'Sin nombre'}</p>
                  {trip.user.ratingAvg > 0 && (
                    <p className="text-sm text-warning">
                      ★ {trip.user.ratingAvg.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Auction section */}
      {trip.auction && (
        <Card>
          <h2 className="text-lg font-bold mb-4">Subasta</h2>
          <AuctionCard
            auction={trip.auction}
            trip={{ originAddress: trip.originAddress, destAddress: trip.destAddress }}
          />

          {/* Bid Form for drivers */}
          {canShowBidForm && (
            <div className="mt-6 pt-6 border-t border-secondary-500/20">
              <h3 className="font-semibold mb-4">Realizar oferta</h3>
              <BidForm
                auctionId={trip.auction.id}
                currentPrice={trip.auction.currentPrice}
                onBidPlaced={handleBidPlaced}
              />
            </div>
          )}

          {/* Bid history */}
          {trip.auction.bids && trip.auction.bids.length > 0 && (
            <div className="mt-6 pt-6 border-t border-secondary-500/20">
              <h3 className="font-semibold mb-4">Historial de ofertas</h3>
              <BidHistory bids={trip.auction.bids} />
            </div>
          )}
        </Card>
      )}

      {/* Rating section */}
      {canShowRating && !showRating && (
        <Card className="text-center">
          <p className="text-text-muted mb-4">
            ¿Ya completaste este viaje? Califica a la empresa
          </p>
          <Button variant="accent" onClick={() => setShowRating(true)}>
            Dejar una valoración
          </Button>
        </Card>
      )}

      {showRating && trip.user && (
        <Card>
          <h2 className="text-lg font-bold mb-4">Valorar a {trip.user.companyName}</h2>
          <RatingForm
            tripId={trip.id}
            toUserId={trip.user.id}
            onRated={handleRated}
          />
        </Card>
      )}
    </div>
  )
}