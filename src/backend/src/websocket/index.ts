import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  userRole?: string
  isAlive?: boolean
  channels?: Set<string>
}

// Registro de suscripciones: canal → conexiones.
// Canales: `auction:<id>`, `trip:<id>` (suscripción explícita) y
// `user:<id>` (automático al conectar, para notificaciones personales)
const channels = new Map<string, Set<AuthenticatedWebSocket>>()

function join(channel: string, ws: AuthenticatedWebSocket) {
  if (!channels.has(channel)) channels.set(channel, new Set())
  channels.get(channel)!.add(ws)
  ws.channels = ws.channels ?? new Set()
  ws.channels.add(channel)
}

function leave(channel: string, ws: AuthenticatedWebSocket) {
  channels.get(channel)?.delete(ws)
  if (channels.get(channel)?.size === 0) channels.delete(channel)
  ws.channels?.delete(channel)
}

function leaveAll(ws: AuthenticatedWebSocket) {
  for (const channel of ws.channels ?? []) {
    channels.get(channel)?.delete(ws)
    if (channels.get(channel)?.size === 0) channels.delete(channel)
  }
  ws.channels?.clear()
}

// Broadcast a todas las conexiones suscriptas a un canal
export function broadcast(channel: string, data: object) {
  const subscribers = channels.get(channel)
  if (!subscribers) return
  const payload = JSON.stringify(data)
  for (const ws of subscribers) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload)
  }
}

export function broadcastToAuction(auctionId: string, data: object) {
  broadcast(`auction:${auctionId}`, { type: 'auction_update', auctionId, ...data })
}

export function broadcastToTrip(tripId: string, data: object) {
  broadcast(`trip:${tripId}`, { tripId, ...data })
}

export function broadcastToUser(userId: string, data: object) {
  broadcast(`user:${userId}`, data)
}

const SUBSCRIBABLE = ['auction', 'trip'] as const

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  // Heartbeat to detect dead connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedWebSocket
      if (client.isAlive === false) {
        client.terminate()
        return
      }
      client.isAlive = false
      client.ping()
    })
  }, 30000)

  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    // Parse token from query string: ws://host/ws?token=xxx
    const url = new URL(req.url || '', `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(4001, 'Missing token')
      return
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret) as { sub: string; role: string }
      ws.userId = payload.sub
      ws.userRole = payload.role
      ws.isAlive = true
    } catch {
      ws.close(4001, 'Invalid token')
      return
    }

    // Canal personal para notificaciones
    join(`user:${ws.userId}`, ws)

    ws.on('pong', () => { ws.isAlive = true })

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        handleMessage(ws, msg)
      } catch {
        ws.send(JSON.stringify({ type: 'error', code: 'INVALID_MESSAGE' }))
      }
    })

    ws.on('close', () => {
      leaveAll(ws)
    })

    // Send welcome
    ws.send(JSON.stringify({ type: 'connected', userId: ws.userId }))
  })

  function handleMessage(
    ws: AuthenticatedWebSocket,
    msg: { type: string; payload?: { channel?: string; id?: string; auctionId?: string } }
  ) {
    switch (msg.type) {
      case 'subscribe': {
        // payload: { channel: 'auction' | 'trip', id } — se mantiene el
        // formato legado { auctionId } por compatibilidad
        const legacyAuctionId = msg.payload?.auctionId
        const channel = legacyAuctionId ? 'auction' : msg.payload?.channel
        const id = legacyAuctionId ?? msg.payload?.id
        if (!channel || !id || !SUBSCRIBABLE.includes(channel as (typeof SUBSCRIBABLE)[number])) {
          ws.send(JSON.stringify({ type: 'error', code: 'INVALID_SUBSCRIPTION' }))
          return
        }
        join(`${channel}:${id}`, ws)
        ws.send(JSON.stringify({ type: 'subscribed', channel, id }))
        break
      }
      case 'unsubscribe': {
        const { channel, id } = msg.payload ?? {}
        if (channel && id) leave(`${channel}:${id}`, ws)
        ws.send(JSON.stringify({ type: 'unsubscribed', channel, id }))
        break
      }
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }))
        break
      default:
        ws.send(JSON.stringify({ type: 'error', code: 'UNKNOWN_MESSAGE_TYPE' }))
    }
  }

  wss.on('close', () => { clearInterval(heartbeat) })

  return wss
}
