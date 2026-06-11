import { useCallback, useEffect } from 'react'
import { useAuthStore } from './useAuthStore'
import {
  addWsListener,
  setWsToken,
  wsSubscribe,
  wsUnsubscribe,
  type WSMessage,
  type WSChannel,
} from '../utils/wsClient'

// Hook sobre la conexión WebSocket compartida (una sola por pestaña):
// registra un listener y expone subscribe/unsubscribe por canal
export function useWebSocket(onMessage: (msg: WSMessage) => void) {
  const { token } = useAuthStore()

  useEffect(() => {
    setWsToken(token)
  }, [token])

  useEffect(() => addWsListener(onMessage), [onMessage])

  const subscribe = useCallback((id: string, channel: WSChannel = 'auction') => {
    wsSubscribe(id, channel)
  }, [])

  const unsubscribe = useCallback((id: string, channel: WSChannel = 'auction') => {
    wsUnsubscribe(id, channel)
  }, [])

  return { subscribe, unsubscribe }
}
