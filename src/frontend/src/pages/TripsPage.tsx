import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TripCard } from '../components/trips/TripCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
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
  auction?: { currentPrice: number; status: string }
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
  }, [pagination.page, statusFilter, cargoTypeFilter, minPrice, maxPrice])

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Viajes</h1>
        <Button variant="accent" onClick={() => navigate('/trips/new')}>
          + Publicar viaje
        </Button>
      </div>

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
        <div className="flex items-center justify-center py-12">
          <Spinner />
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
                {trips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onClick={() => navigate(`/trips/${trip.id}`)}
                  />
                ))}
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
                hasActiveFilters
                  ? 'No hay viajes que coincidan con los filtros'
                  : 'Aún no hay viajes publicados'
              }
              action={
                hasActiveFilters
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