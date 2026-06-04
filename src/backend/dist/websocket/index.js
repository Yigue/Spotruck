"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocket = setupWebSocket;
exports.broadcastToAuction = broadcastToAuction;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
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
    wss.on('connection', (ws, req) => {
        // Parse token from query string: ws://host/ws?token=xxx
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        if (!token) {
            ws.close(4001, 'Missing token');
            return;
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, index_js_1.config.jwt.secret);
            ws.userId = payload.sub;
            ws.userRole = payload.role;
            ws.isAlive = true;
        }
        catch {
            ws.close(4001, 'Invalid token');
            return;
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
            // Cleanup subscriptions
        });
        // Send welcome
        ws.send(JSON.stringify({ type: 'connected', userId: ws.userId }));
    });
    function handleMessage(ws, msg) {
        switch (msg.type) {
            case 'subscribe':
                // Subscribe to auction updates
                // payload: { auctionId: string }
                ws.send(JSON.stringify({ type: 'subscribed', auctionId: msg.payload.auctionId }));
                break;
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
// Helper to broadcast to all clients subscribed to an auction
function broadcastToAuction(auctionId, data) {
    const wss = global.wss;
    if (!wss)
        return;
    wss.clients.forEach((client) => {
        const ws = client;
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'auction_update', auctionId, ...data }));
        }
    });
}
//# sourceMappingURL=index.js.map