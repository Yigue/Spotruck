import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuctionCard } from '../components/auctions/AuctionCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import api from '../utils/api'

interface Auction {
  id: string
  type: 'OPEN' | 'DUTCH' | 'SEALED'
  currentPrice: number
  status: string
  endTime: string
  bids?: { id: string }[]
  trip?: {
    originAddress: string
    destAddress: string
  }
}

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'OPEN', label: 'Abierta' },
  { value: 'CLOSED', label: 'Cerrada' },
  { value: 'SETTLED', label: 'Liquidada' },
]

const typeOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'OPEN', label: 'Abierta' },
  { value: 'DUTCH', label: 'Holandesa' },
  { value: 'SEALED', label: 'Cerrada' },
]

export default function AuctionPage() {
  const navigate = useNavigate()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    const fetchAuctions = async () => {
      setLoading(true)
      setError(null)
      try {
        const params: Record<string, string> = {}
        if (statusFilter) params.status = statusFilter
        if (typeFilter) params.type = typeFilter

        const { data } = await api.get('/auctions', { params })
        setAuctions(data.data || [])
      } catch {
        setError('Error al cargar subastas')
      } finally {
        setLoading(false)
      }
    }

    fetchAuctions()
  }, [statusFilter, typeFilter])

  const handleAuctionClick = (auctionId: string) => {
    // Find the trip associated with this auction to navigate
    const auction = auctions.find((a) => a.id === auctionId)
    if (auction?.trip) {
      // Navigate to trip detail which shows auction info
      navigate(`/trips?auction=${auctionId}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Subastas</h1>
      </div>

      {/* Filter bar */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Estado"
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-[160px]"
          />
          <Select
            label="Tipo"
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="min-w-[160px]"
          />
          {(statusFilter || typeFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter('')
                setTypeFilter('')
              }}
            >
              Limpiar filtros
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

      {/* Auctions grid */}
      {!loading && !error && (
        <>
          {auctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {auctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  trip={auction.trip}
                  onClick={() => handleAuctionClick(auction.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🔨"
              title="No hay subastas"
              description={
                statusFilter || typeFilter
                  ? 'No hay subastas que coincidan con los filtros'
                  : 'No hay subastas disponibles en este momento'
              }
              action={
                (statusFilter || typeFilter)
                  ? {
                      label: 'Limpiar filtros',
                      onClick: () => {
                        setStatusFilter('')
                        setTypeFilter('')
                      },
                    }
                  : undefined
              }
            />
          )}
        </>
      )}
    </div>
  )
}