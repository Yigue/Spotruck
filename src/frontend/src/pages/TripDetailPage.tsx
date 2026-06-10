import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { TripDetailMap } from '../components/maps/TripDetailMap'
import { LiveTrackingMap } from '../components/maps/LiveTrackingMap'
import { AuctionCard } from '../components/auctions/AuctionCard'
import { AuctionCountdown } from '../components/auctions/AuctionCountdown'
import { BidForm } from '../components/auctions/BidForm'
import { BidList, type BidWithDetails } from '../components/auctions/BidList'
import { RatingForm } from '../components/ratings/RatingForm'
import { TripStatusStepper } from '../components/trips/TripStatusStepper'
import { UserProfileModal } from '../components/users/UserProfileModal'
import { PaymentCard } from '../components/payments/PaymentCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useAuthStore } from '../hooks/useAuthStore'
import { useWebSocket } from '../hooks/useWebSocket'
import { formatDuration } from '../utils/geo'
import api from '../utils/api'

interface Trip {
  id: string
  originAddress: string
  originLat: number
  originLng: number
  destAddress: string
  destLat: number
  destLng: number
  distanceKm?: number | null
  durationMin?: number | null
  cargoType: string
  cargoDesc?: string
  weightKg?: number
  volumeDesc?: string | null
  scheduledDate: string
  endDate?: string | null
  basePrice: number
  status: string
  user: {
    id: string
    companyName?: string
    companyCuit?: string
    phone?: string
    ratingAvg: number
    ratingCount?: number
  }
  auction?: {
    id: string
    type: 'OPEN' | 'DUTCH' | 'SEALED'
    currentPrice: number
    status: string
    endTime: string
    bids: BidWithDetails[]
  }
  ratings?: { fromUserId: string; toUserId: string; score: number }[]
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  OPEN: 'Abierto',
  AUCTION: 'En subasta',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En viaje',
  DELIVERED: 'Esperando confirmación',
  SETTLED: 'Finalizado',
  CANCELLED: 'Cancelado',
}

const cargoLabels: Record<string, string> = {
  BULK: 'Granel',
  PALLETS: 'Unitarizada (Pallets)',
  GENERAL: 'General',
  REFRIGERATED: 'Refrigerada',
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
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [livePosition, setLivePosition] = useState<{
    lat: number
    lng: number
    speed?: number | null
    recordedAt: string
  } | null>(null)

  const refreshTrip = useCallback(async () => {
    if (!id) return
    try {
      const { data } = await api.get(`/trips/${id}`)
      setTrip(data.data)
    } catch {
      // silently fail
    }
  }, [id])

  const handleWSMessage = useCallback(
    (msg: { type: string; [key: string]: unknown }) => {
      if (msg.type === 'auction_update' || msg.type === 'trip_update') refreshTrip()
      if (msg.type === 'tracking_update') {
        setLivePosition({
          lat: msg.lat as number,
          lng: msg.lng as number,
          speed: msg.speed as number | null,
          recordedAt: msg.recordedAt as string,
        })
      }
    },
    [refreshTrip]
  )

  const { subscribe } = useWebSocket(handleWSMessage)

  useEffect(() => {
    if (trip?.auction?.id) {
      subscribe(trip.auction.id, 'auction')
    }
  }, [trip?.auction?.id, subscribe])

  useEffect(() => {
    if (trip?.id) {
      subscribe(trip.id, 'trip')
    }
  }, [trip?.id, subscribe])

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

  const isOwnerCompany = user?.id === trip.user?.id
  const acceptedBid = trip.auction?.bids.find((b) => b.status === 'ACCEPTED')
  const isAssignedDriver = !!acceptedBid && user?.id === acceptedBid.user.id

  const canShowBidForm =
    user?.role === 'DRIVER' &&
    trip.auction &&
    (trip.auction.status === 'OPEN' || trip.auction.status === 'PENDING')

  // A quién valora el usuario actual: el transportista valora a la empresa;
  // la empresa valora al transportista asignado
  const ratingTarget = isAssignedDriver
    ? { id: trip.user.id, name: trip.user.companyName }
    : isOwnerCompany && acceptedBid
      ? { id: acceptedBid.user.id, name: acceptedBid.user.companyName }
      : null

  const hasRated = !!trip.ratings?.some((r) => r.fromUserId === user?.id)
  const canShowRating = trip.status === 'SETTLED' && !!ratingTarget && !hasRated

  const inLifecycle = ['ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'SETTLED'].includes(trip.status)

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

      {/* Stepper de estados (viaje asignado en adelante) */}
      {inLifecycle && (
        <Card>
          <TripStatusStepper
            tripId={trip.id}
            status={trip.status}
            isAssignedDriver={isAssignedDriver}
            isOwnerCompany={isOwnerCompany}
            onStatusChanged={refreshTrip}
          />
          {canShowRating && (
            <div className="text-center mt-4 pt-4 border-t border-secondary-500/20">
              <Button variant="accent" onClick={() => setShowRating(true)}>
                Valorar
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Map: tracking en vivo durante el viaje, mapa estático antes */}
      {['IN_PROGRESS', 'DELIVERED'].includes(trip.status) ? (
        <Card>
          <h2 className="text-lg font-bold mb-4">Seguimiento en vivo</h2>
          <LiveTrackingMap
            tripId={trip.id}
            originLat={trip.originLat}
            originLng={trip.originLng}
            destLat={trip.destLat}
            destLng={trip.destLng}
            isAssignedDriver={isAssignedDriver && trip.status === 'IN_PROGRESS'}
            livePosition={livePosition}
          />
        </Card>
      ) : (
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
      )}

      {/* Trip Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Route and cargo info */}
        <Card>
          <h2 className="text-lg font-bold mb-4">Datos de la publicación</h2>
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
              {trip.distanceKm && (
                <div>
                  <p className="text-sm text-text-muted">Distancia</p>
                  <p className="font-medium">{trip.distanceKm.toLocaleString('es-AR')} km</p>
                </div>
              )}
              {trip.durationMin && (
                <div>
                  <p className="text-sm text-text-muted">Duración del viaje</p>
                  <p className="font-medium">{formatDuration(trip.durationMin)}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Tipo de carga</p>
                <p className="font-medium">{cargoLabels[trip.cargoType] || trip.cargoType}</p>
              </div>
              {trip.weightKg && (
                <div>
                  <p className="text-sm text-text-muted">Peso</p>
                  <p className="font-medium">{trip.weightKg.toLocaleString('es-AR')} kg</p>
                </div>
              )}
            </div>
            {trip.volumeDesc && (
              <div>
                <p className="text-sm text-text-muted">Volumen</p>
                <p className="font-medium">{trip.volumeDesc}</p>
              </div>
            )}
            {trip.cargoDesc && (
              <div>
                <p className="text-sm text-text-muted">Descripción</p>
                <p className="font-medium">{trip.cargoDesc}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Fecha de inicio</p>
                <p className="font-medium">{formatDate(trip.scheduledDate)}</p>
              </div>
              {trip.endDate && (
                <div>
                  <p className="text-sm text-text-muted">Fecha fin</p>
                  <p className="font-medium">{formatDate(trip.endDate)}</p>
                </div>
              )}
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

          {inLifecycle && (
            <PaymentCard
              tripId={trip.id}
              isOwnerCompany={isOwnerCompany}
              isAssignedDriver={isAssignedDriver}
              tripStatus={trip.status}
            />
          )}

          {trip.user && (
            <Card>
              <h2 className="text-lg font-bold mb-4">Empresa</h2>
              <button
                className="flex items-center gap-3 text-left w-full hover:bg-background rounded p-2 -m-2 transition-colors"
                onClick={() => setProfileUserId(trip.user.id)}
              >
                <div className="flex-1">
                  <p className="font-medium">{trip.user.companyName || 'Sin nombre'}</p>
                  {trip.user.ratingAvg > 0 && (
                    <p className="text-sm text-warning">
                      ★ {trip.user.ratingAvg.toFixed(1)}
                      {trip.user.ratingCount ? ` (${trip.user.ratingCount})` : ''}
                    </p>
                  )}
                </div>
                <span className="text-xs text-primary font-medium">Ver perfil →</span>
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* Postulantes (vista empresa) / Subasta */}
      {trip.auction && (
        <Card>
          {isOwnerCompany ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Postulantes</h2>
                <AuctionCountdown endTime={trip.auction.endTime} status={trip.auction.status} />
              </div>
              <BidList
                bids={trip.auction.bids ?? []}
                canDecide={trip.auction.status === 'OPEN'}
                onDecided={refreshTrip}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Subasta</h2>
                <AuctionCountdown endTime={trip.auction.endTime} status={trip.auction.status} />
              </div>
              <AuctionCard
                auction={trip.auction}
                trip={{ originAddress: trip.originAddress, destAddress: trip.destAddress }}
              />

              {/* Postularse (transportista) */}
              {canShowBidForm && (
                <div className="mt-6 pt-6 border-t border-secondary-500/20">
                  <h3 className="font-semibold mb-4">Postularse</h3>
                  <BidForm
                    auctionId={trip.auction.id}
                    currentPrice={trip.auction.currentPrice}
                    cargoWeightKg={trip.weightKg}
                    onBidPlaced={refreshTrip}
                  />
                </div>
              )}

              {/* Mis ofertas en esta subasta */}
              {user?.role === 'DRIVER' &&
                (trip.auction.bids ?? []).some((b) => b.user.id === user.id) && (
                  <div className="mt-6 pt-6 border-t border-secondary-500/20">
                    <h3 className="font-semibold mb-4">Tus ofertas</h3>
                    <BidList
                      bids={(trip.auction.bids ?? []).filter((b) => b.user.id === user.id)}
                      canDecide={false}
                      onDecided={refreshTrip}
                    />
                  </div>
                )}
            </>
          )}
        </Card>
      )}

      {/* Modal de valoración */}
      <Modal
        open={showRating && !!ratingTarget}
        onClose={() => setShowRating(false)}
        title={`Valorar a ${ratingTarget?.name ?? ''}`}
      >
        {ratingTarget && (
          <RatingForm
            tripId={trip.id}
            toUserId={ratingTarget.id}
            onRated={() => {
              setShowRating(false)
              refreshTrip()
            }}
          />
        )}
      </Modal>

      {/* Perfil público */}
      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  )
}
