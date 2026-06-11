// Conexión WebSocket única y compartida por toda la app (singleton).
// La autenticación va en el primer mensaje ({type:'auth'}) para que el JWT
// no viaje en la URL. Re-suscribe automáticamente al reconectar.

export interface WSMessage {
  type: string
  [key: string]: unknown
}

type Listener = (msg: WSMessage) => void
export type WSChannel = 'auction' | 'trip'

let ws: WebSocket | null = null
let currentToken: string | null = null
let authed = false
let reconnectTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<Listener>()
const subscriptions = new Set<string>() // "channel:id"

function send(obj: unknown) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj))
}

function connect() {
  if (!currentToken) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  ws = new WebSocket(`${proto}://${window.location.host}/ws`)

  ws.onopen = () => {
    send({ type: 'auth', payload: { token: currentToken } })
  }

  ws.onmessage = (event) => {
    let msg: WSMessage
    try {
      msg = JSON.parse(event.data)
    } catch {
      return
    }
    if (msg.type === 'connected') {
      authed = true
      for (const sub of subscriptions) {
        const [channel, id] = sub.split(':')
        send({ type: 'subscribe', payload: { channel, id } })
      }
    }
    listeners.forEach((l) => l(msg))
  }

  ws.onclose = () => {
    authed = false
    if (currentToken) reconnectTimer = setTimeout(connect, 3000)
  }

  ws.onerror = () => {
    ws?.close()
  }
}

export function setWsToken(token: string | null) {
  if (token === currentToken) {
    if (token) connect()
    return
  }
  currentToken = token
  authed = false
  clearTimeout(reconnectTimer)
  if (ws) {
    ws.onclose = null
    ws.close()
    ws = null
  }
  if (token) connect()
}

export function addWsListener(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function wsSubscribe(id: string, channel: WSChannel = 'auction') {
  subscriptions.add(`${channel}:${id}`)
  if (authed) send({ type: 'subscribe', payload: { channel, id } })
}

export function wsUnsubscribe(id: string, channel: WSChannel = 'auction') {
  subscriptions.delete(`${channel}:${id}`)
  if (authed) send({ type: 'unsubscribe', payload: { channel, id } })
}
