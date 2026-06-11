import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useWebSocket } from '../../hooks/useWebSocket'

interface Notification {
  id: string
  type: string
  title: string
  body?: string | null
  payload?: { tripId?: string } | null
  readAt?: string | null
  createdAt: string
}

const typeIcons: Record<string, string> = {
  NEW_BID: '📩',
  BID_ACCEPTED: '✅',
  BID_REJECTED: '❌',
  TRIP_STATE: '🚚',
  AUCTION_CLOSED: '🔨',
}

function timeAgo(date: string) {
  const diffMin = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

interface NotificationBellProps {
  // compact: solo el ícono (header mobile). direction: hacia dónde abre el panel
  compact?: boolean
  direction?: 'up' | 'down'
}

// Campanita de notificaciones in-app: contador de no leídas, panel
// desplegable y actualización en tiempo real por WebSocket
export function NotificationBell({ compact = false, direction = 'up' }: NotificationBellProps) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    api
      .get('/notifications', { params: { limit: 15 } })
      .then(({ data }) => {
        setNotifications(data.data)
        setUnread(data.meta.unread)
      })
      .catch(() => {})
  }, [])

  const handleWSMessage = useCallback(
    (msg: { type: string; notification?: Notification }) => {
      if (msg.type === 'notification' && msg.notification) {
        setNotifications((prev) => [msg.notification!, ...prev].slice(0, 15))
        setUnread((u) => u + 1)
      }
    },
    []
  )

  useWebSocket(handleWSMessage)

  useEffect(() => {
    load()
    // Polling de respaldo por si se cae el WebSocket
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  // Cerrar el panel al hacer click afuera
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setUnread(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    } catch {
      // silently fail
    }
  }

  const handleClick = async (n: Notification) => {
    if (!n.readAt) {
      api.patch(`/notifications/${n.id}/read`).catch(() => {})
      setUnread((u) => Math.max(0, u - 1))
      setNotifications((prev) =>
        prev.map((p) => (p.id === n.id ? { ...p, readAt: new Date().toISOString() } : p))
      )
    }
    setOpen(false)
    if (n.payload?.tripId) navigate(`/trips/${n.payload.tripId}`)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-2 text-sm text-secondary-300 hover:text-white transition-colors"
        aria-label="Notificaciones"
      >
        <span className="text-lg">🔔</span>
        {!compact && 'Notificaciones'}
        {unread > 0 && (
          <span className="absolute -top-2 left-3 bg-error text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute w-80 max-w-[calc(100vw-2rem)] bg-surface text-text rounded-lg shadow-lg border border-secondary-500/20 z-50 ${
            direction === 'up' ? 'bottom-full left-0 mb-2' : 'top-full right-0 mt-2'
          }`}
        >
          <div className="flex items-center justify-between p-3 border-b border-secondary-500/10">
            <span className="font-semibold text-sm">Notificaciones</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary font-medium">
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-text-muted py-6">No tenés notificaciones</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left p-3 border-b border-secondary-500/10 hover:bg-background transition-colors ${
                    !n.readAt ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-2">
                    <span>{typeIcons[n.type] ?? '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!n.readAt ? 'font-semibold' : 'font-medium'}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-text-muted line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-text-muted mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.readAt && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
