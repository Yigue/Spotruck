import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TripCard } from '../components/trips/TripCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import api from '../utils/api'

interface Trip {
  id: string
  originAddress: string
  destAddress: string
  cargoType: string
  scheduledDate: string
  basePrice: number
  status: string
  user?: { companyName?: string; ratingAvg: number }
  auction?: { id: string; currentPrice: number; status: string }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'AUCTION', label: 'En subasta' },
  { value: 'ASSIGNED', label: 'Asignado' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'SETTLED', label: 'Liquidado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const cargoTypeOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'GENERAL', label: 'General' },
  { value: 'BULK', label: 'Granel' },
  { value: 'PALLETS', label: 'Pallets' },
  { value: 'REFRIGERATED', label: 'Refrigerada' },
]

export default function TripsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const auctionId = searchParams.get('auction') ?? ''
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [mineOnly, setMineOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [cargoTypeFilter, setCargoTypeFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true)
      setError(null)

      try {
        const params: Record<string, string | number> = {
          page: pagination.page,
          limit: pagination.limit,
        }

        if (mineOnly) params.mine = 'true'
        if (statusFilter) params.status = statusFilter
        if (cargoTypeFilter) params.cargoType = cargoTypeFilter
        if (minPrice) params.minPrice = parseFloat(minPrice)
        if (maxPrice) params.maxPrice = parseFloat(maxPrice)

        const { data } = await api.get('/trips', { params })
        setTrips(data.data || [])
        if (data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: data.pagination.total || 0,
            totalPages: data.pagination.totalPages || 0,
          }))
        }
      } catch {
        setError('Error al cargar viajes')
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [pagination.page, mineOnly, statusFilter, cargoTypeFilter, minPrice, maxPrice])

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const clearFilters = () => {
    setStatusFilter('')
    setCargoTypeFilter('')
    setMinPrice('')
    setMaxPrice('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = statusFilter || cargoTypeFilter || minPrice || maxPrice

  const matchedTrip = useMemo(
    () => (auctionId ? trips.find((t) => t.auction?.id === auctionId) ?? null : null),
    [auctionId, trips],
  )

  const clearAuctionFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('auction')
    setSearchParams(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Viajes</h1>
        <Button variant="accent" onClick={() => navigate('/trips/new')}>
          + Publicar viaje
        </Button>
      </div>

      {/* Pestañas: todos / mis viajes (SDD wave1) */}
      <div className="flex gap-2 mb-4">
        {[
          { mine: false, label: 'Todos' },
          { mine: true, label: 'Mis viajes' },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setMineOnly(tab.mine)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mineOnly === tab.mine
                ? 'bg-primary text-white'
                : 'bg-surface border border-secondary-500/20 text-text-muted hover:border-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {auctionId && (
        <div
          data-testid="auction-filter-banner"
          className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-accent/40 bg-accent-50 px-4 py-3"
        >
          <div className="text-sm">
            <span className="font-medium">Filtrando por subasta:</span>{' '}
            <span className="font-mono text-text-muted">{auctionId}</span>
            {matchedTrip ? (
              <span className="ml-2 text-text-muted">
                · {matchedTrip.originAddress} → {matchedTrip.destAddress}
              </span>
            ) : (
              <span className="ml-2 text-text-muted">· buscando coincidencia…</span>
            )}
          </div>
          <Button variant="ghost" onClick={clearAuctionFilter}>
            Quitar filtro
          </Button>
        </div>
      )}

      {/* Filter bar */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Estado"
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="min-w-[160px]"
          />
          <Select
            label="Tipo de carga"
            options={cargoTypeOptions}
            value={cargoTypeFilter}
            onChange={(e) => {
              setCargoTypeFilter(e.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="min-w-[160px]"
          />
          <Input
            label="Precio mínimo"
            type="number"
            placeholder="0"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="w-[120px]"
          />
          <Input
            label="Precio máximo"
            type="number"
            placeholder="999999"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="w-[120px]"
          />
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Limpiar
            </Button>
          )}
        </div>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <EmptyState
          icon="❌"
          title="Error al cargar"
          description={error}
          action={{
            label: 'Reintentar',
            onClick: () => window.location.reload(),
          }}
        />
      )}

      {/* Trips grid */}
      {!loading && !error && (
        <>
          {trips.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map((trip) => {
                  const highlighted = !!auctionId && trip.auction?.id === auctionId
                  return (
                    <div
                      key={trip.id}
                      data-testid={highlighted ? 'auction-matched-trip' : undefined}
                      ref={highlighted ? (el) => el?.scrollIntoView({ block: 'center', behavior: 'smooth' }) : undefined}
                      className={highlighted ? 'rounded-lg ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}
                    >
                      <TripCard
                        trip={trip}
                        onClick={() => navigate(`/trips/${trip.id}`)}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="ghost"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-text-muted px-4">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}

              {/* Results count */}
              <p className="text-center text-sm text-text-muted mt-4">
                Mostrando {trips.length} de {pagination.total} viajes
              </p>
            </>
          ) : (
            <EmptyState
              icon="🚚"
              title="No hay viajes"
              description={
                auctionId
                  ? 'No hay viajes que coincidan con la subasta seleccionada'
                  : hasActiveFilters
                  ? 'No hay viajes que coincidan con los filtros'
                  : 'Aún no hay viajes publicados'
              }
              action={
                auctionId
                  ? { label: 'Quitar filtro de subasta', onClick: clearAuctionFilter }
                  : hasActiveFilters
                  ? { label: 'Limpiar filtros', onClick: clearFilters }
                  : { label: 'Crear viaje', onClick: () => navigate('/trips/new') }
              }
            />
          )}
        </>
      )}
    </div>
  )
}