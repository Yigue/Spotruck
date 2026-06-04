import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string
  userRole?: string
  isAlive?: boolean
}

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
      // Cleanup subscriptions
    })

    // Send welcome
    ws.send(JSON.stringify({ type: 'connected', userId: ws.userId }))
  })

  function handleMessage(ws: AuthenticatedWebSocket, msg: { type: string; payload?: unknown }) {
    switch (msg.type) {
      case 'subscribe':
        // Subscribe to auction updates
        // payload: { auctionId: string }
        ws.send(JSON.stringify({ type: 'subscribed', auctionId: (msg.payload as { auctionId: string }).auctionId }))
        break
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

// Helper to broadcast to all clients subscribed to an auction
export function broadcastToAuction(auctionId: string, data: object) {
  const wss = (global as unknown as { wss?: WebSocketServer }).wss
  if (!wss) return
  wss.clients.forEach((client) => {
    const ws = client as AuthenticatedWebSocket
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'auction_update', auctionId, ...data }))
    }
  })
}