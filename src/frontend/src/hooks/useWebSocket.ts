import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from './useAuthStore'

interface WSMessage {
  type: string
  [key: string]: unknown
}

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const { token, user } = useAuthStore()
  const authToken = token || user?.accessToken
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    if (!authToken) return

    const ws = new WebSocket(`ws://localhost:4000/ws?token=${authToken}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[WS] Connected')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        onMessage(msg)
      } catch {
        console.error('[WS] Failed to parse message')
      }
    }

    ws.onclose = () => {
      console.log('[WS] Disconnected, reconnecting in 3s...')
      reconnectTimeout.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [authToken, onMessage])

  useEffect(() => {
    if (authToken) {
      connect()
    }
    return () => {
      clearTimeout(reconnectTimeout.current)
      wsRef.current?.close()
    }
  }, [authToken, connect])

  const subscribe = useCallback((auctionId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'subscribe', payload: { auctionId } }))
  }, [])

  return { subscribe }
}
