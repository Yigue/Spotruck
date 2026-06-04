import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

export interface Trip {
  id: string
  originAddress: string
  destAddress: string
  cargoType: string
  scheduledDate: string
  basePrice: number
  status: string
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  cargoDesc?: string
  weightKg?: number
  user?: {
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
    bids?: {
      id: string
      amount: number
      createdAt: string
      user: { companyName?: string; ratingAvg: number }
    }[]
  }
}

interface TripsState {
  trips: Trip[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseTripsOptions {
  page?: number
  limit?: number
  status?: string
  cargoType?: string
  minPrice?: number
  maxPrice?: number
}

export function useTrips(options: UseTripsOptions = {}) {
  const [state, setState] = useState<TripsState>({
    trips: [],
    loading: true,
    error: null,
    pagination: {
      page: options.page || 1,
      limit: options.limit || 10,
      total: 0,
      totalPages: 0,
    },
  })

  const [cache] = useState(() => new Map<string, Trip>())

  const fetchTrips = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const params: Record<string, string | number> = {
        page: options.page || state.pagination.page,
        limit: options.limit || state.pagination.limit,
      }

      if (options.status) params.status = options.status
      if (options.cargoType) params.cargoType = options.cargoType
      if (options.minPrice) params.minPrice = options.minPrice
      if (options.maxPrice) params.maxPrice = options.maxPrice

      const { data } = await api.get('/trips', { params })

      // Cache trips
      if (data.data) {
        data.data.forEach((trip: Trip) => {
          cache.set(trip.id, trip)
        })
      }

      setState((prev) => ({
        ...prev,
        trips: data.data || [],
        loading: false,
        pagination: {
          ...prev.pagination,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        },
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Error al cargar viajes',
      }))
    }
  }, [options.status, options.cargoType, options.minPrice, options.maxPrice, options.page, options.limit])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const refetch = useCallback(() => {
    fetchTrips()
  }, [fetchTrips])

  return {
    ...state,
    refetch,
  }
}

export function useTrip(id: string) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrip = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get(`/trips/${id}`)
      setTrip(data.data)
    } catch {
      setError('Error al cargar el viaje')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  const refetch = useCallback(() => {
    fetchTrip()
  }, [fetchTrip])

  return { trip, loading, error, refetch }
}