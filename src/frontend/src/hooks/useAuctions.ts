import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

export interface Auction {
  id: string
  type: 'OPEN' | 'DUTCH' | 'SEALED'
  currentPrice: number
  status: string
  endTime: string
  tripId?: string
  bids?: {
    id: string
    amount: number
    createdAt: string
    user: { companyName?: string; ratingAvg: number }
  }[]
  trip?: {
    originAddress: string
    destAddress: string
  }
}

interface AuctionsState {
  auctions: Auction[]
  loading: boolean
  error: string | null
}

interface UseAuctionsOptions {
  status?: string
  type?: string
}

export function useAuctions(options: UseAuctionsOptions = {}) {
  const [state, setState] = useState<AuctionsState>({
    auctions: [],
    loading: true,
    error: null,
  })

  const fetchAuctions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const params: Record<string, string> = {}
      if (options.status) params.status = options.status
      if (options.type) params.type = options.type

      const { data } = await api.get('/auctions', { params })
      setState({
        auctions: data.data || [],
        loading: false,
        error: null,
      })
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Error al cargar subastas',
      }))
    }
  }, [options.status, options.type])

  useEffect(() => {
    fetchAuctions()
  }, [fetchAuctions])

  const refetch = useCallback(() => {
    fetchAuctions()
  }, [fetchAuctions])

  return {
    ...state,
    refetch,
  }
}

export function useAuction(id: string) {
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAuction = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const { data } = await api.get(`/auctions/${id}`)
      setAuction(data.data)
    } catch {
      setError('Error al cargar la subasta')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAuction()
  }, [fetchAuction])

  const refetch = useCallback(() => {
    fetchAuction()
  }, [fetchAuction])

  return { auction, loading, error, refetch }
}