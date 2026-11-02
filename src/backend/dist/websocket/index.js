"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = broadcast;
exports.broadcastToAuction = broadcastToAuction;
exports.broadcastToTrip = broadcastToTrip;
exports.broadcastToUser = broadcastToUser;
exports.setupWebSocket = setupWebSocket;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
// Registro de suscripciones: canal → conexiones.
// Canales: `auction:<id>`, `trip:<id>` (suscripción explícita) y
// `user:<id>` (automático al conectar, para notificaciones personales)
const channels = new Map();
function join(channel, ws) {
    if (!channels.has(channel))
        channels.set(channel, new Set());
    channels.get(channel).add(ws);
    ws.channels = ws.channels ?? new Set();
    ws.channels.add(channel);
}
function leave(channel, ws) {
    channels.get(channel)?.delete(ws);
    if (channels.get(channel)?.size === 0)
        channels.delete(channel);
    ws.channels?.delete(channel);
}
function leaveAll(ws) {
    for (const channel of ws.channels ?? []) {
        channels.get(channel)?.delete(ws);
        if (channels.get(channel)?.size === 0)
            channels.delete(channel);
    }
    ws.channels?.clear();
}
// Broadcast a todas las conexiones suscriptas a un canal
function broadcast(channel, data) {
    const subscribers = channels.get(channel);
    if (!subscribers)
        return;
    const payload = JSON.stringify(data);
    for (const ws of subscribers) {
        if (ws.readyState === ws_1.WebSocket.OPEN)
            ws.send(payload);
    }
}
function broadcastToAuction(auctionId, data) {
    broadcast(`auction:${auctionId}`, { type: 'auction_update', auctionId, ...data });
}
function broadcastToTrip(tripId, data) {
    broadcast(`trip:${tripId}`, { tripId, ...data });
}
function broadcastToUser(userId, data) {
    broadcast(`user:${userId}`, data);
}
const SUBSCRIBABLE = ['auction', 'trip'];
function setupWebSocket(server) {
    const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    // Heartbeat to detect dead connections
    const heartbeat = setInterval(() => {
        wss.clients.forEach((ws) => {
            const client = ws;
            if (client.isAlive === false) {
                client.terminate();
                return;
            }
            client.isAlive = false;
            client.ping();
        });
    }, 30000);
    // Autentica la conexión y abre el canal personal del usuario
    function tryAuth(ws, token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, index_js_1.config.jwt.secret);
            ws.userId = payload.sub;
            ws.userRole = payload.role;
            join(`user:${ws.userId}`, ws);
            ws.send(JSON.stringify({ type: 'connected', userId: ws.userId }));
            return true;
        }
        catch {
            ws.close(4001, 'Invalid token');
            return false;
        }
    }
    wss.on('connection', (ws, req) => {
        ws.isAlive = true;
        // Auth preferida: primer mensaje { type: 'auth', payload: { token } } —
        // así el JWT no viaja en la URL (logs de proxies/servidores).
        // Se mantiene ?token= por compatibilidad.
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const legacyToken = url.searchParams.get('token');
        if (legacyToken) {
            if (!tryAuth(ws, legacyToken))
                return;
        }
        else {
            const authTimeout = setTimeout(() => {
                if (!ws.userId)
                    ws.close(4001, 'Auth timeout');
            }, 5000);
            ws.once('close', () => clearTimeout(authTimeout));
        }
        ws.on('pong', () => { ws.isAlive = true; });
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                handleMessage(ws, msg);
            }
            catch {
                ws.send(JSON.stringify({ type: 'error', code: 'INVALID_MESSAGE' }));
            }
        });
        ws.on('close', () => {
            leaveAll(ws);
        });
    });
    function handleMessage(ws, msg) {
        if (msg.type === 'auth') {
            if (!ws.userId && msg.payload?.token)
                tryAuth(ws, msg.payload.token);
            return;
        }
        // Todo lo demás requiere conexión autenticada
        if (!ws.userId) {
            ws.send(JSON.stringify({ type: 'error', code: 'UNAUTHORIZED' }));
            return;
        }
        switch (msg.type) {
            case 'subscribe': {
                // payload: { channel: 'auction' | 'trip', id } — se mantiene el
                // formato legado { auctionId } por compatibilidad
                const legacyAuctionId = msg.payload?.auctionId;
                const channel = legacyAuctionId ? 'auction' : msg.payload?.channel;
                const id = legacyAuctionId ?? msg.payload?.id;
                if (!channel || !id || !SUBSCRIBABLE.includes(channel)) {
                    ws.send(JSON.stringify({ type: 'error', code: 'INVALID_SUBSCRIPTION' }));
                    return;
                }
                join(`${channel}:${id}`, ws);
                ws.send(JSON.stringify({ type: 'subscribed', channel, id }));
                break;
            }
            case 'unsubscribe': {
                const { channel, id } = msg.payload ?? {};
                if (channel && id)
                    leave(`${channel}:${id}`, ws);
                ws.send(JSON.stringify({ type: 'unsubscribed', channel, id }));
                break;
            }
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
            default:
                ws.send(JSON.stringify({ type: 'error', code: 'UNKNOWN_MESSAGE_TYPE' }));
        }
    }
    wss.on('close', () => { clearInterval(heartbeat); });
    return wss;
}
//# sourceMappingURL=index.js.map