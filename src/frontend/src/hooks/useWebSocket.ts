import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from './useAuthStore'

interface WSMessage {
  type: string
  [key: string]: unknown
}

type Channel = 'auction' | 'trip'

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const { token } = useAuthStore()
  const authToken = token
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>()
  // Suscripciones activas, para re-suscribir tras una reconexión
  const subscriptions = useRef<Set<string>>(new Set())

  const connect = useCallback(() => {
    if (!authToken) return

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = import.meta.env.DEV ? 'localhost:4000' : window.location.host
    const ws = new WebSocket(`${proto}://${host}/ws?token=${authToken}`)
    wsRef.current = ws

    ws.onopen = () => {
      for (const sub of subscriptions.current) {
        const [channel, id] = sub.split(':')
        ws.send(JSON.stringify({ type: 'subscribe', payload: { channel, id } }))
      }
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
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [authToken, connect])

  const subscribe = useCallback((id: string, channel: Channel = 'auction') => {
    subscriptions.current.add(`${channel}:${id}`)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', payload: { channel, id } }))
    }
  }, [])

  const unsubscribe = useCallback((id: string, channel: Channel = 'auction') => {
    subscriptions.current.delete(`${channel}:${id}`)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', payload: { channel, id } }))
    }
  }, [])

  return { subscribe, unsubscribe }
}
