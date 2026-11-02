"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const http_1 = require("http");
const index_js_1 = require("./config/index.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const auth_js_1 = require("./routes/auth.js");
const users_js_1 = require("./routes/users.js");
const trips_js_1 = require("./routes/trips.js");
const auctions_js_1 = require("./routes/auctions.js");
const payments_js_1 = require("./routes/payments.js");
const ratings_js_1 = require("./routes/ratings.js");
const tracking_js_1 = require("./routes/tracking.js");
const trucks_js_1 = require("./routes/trucks.js");
const bids_js_1 = require("./routes/bids.js");
const notifications_js_1 = require("./routes/notifications.js");
const stats_js_1 = require("./routes/stats.js");
const index_js_2 = require("./websocket/index.js");
const auctionCron_js_1 = require("./jobs/auctionCron.js");
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
// Los montos viven en Decimal(12,2): se serializan como number en JSON para
// que el frontend no cambie. (this[key] es el valor original, antes de toJSON)
app.set('json replacer', function (key, value) {
    const original = this[key];
    if (client_1.Prisma.Decimal.isDecimal(original))
        return Number(original);
    return value;
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: index_js_1.config.corsOrigin }));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
// Archivos subidos (avatares y documentación) — Wave 1, disco local
app.use('/uploads', express_1.default.static(path_1.default.resolve(process.cwd(), 'uploads'), {
    maxAge: '7d',
    fallthrough: true,
}));
// Rate limiting en auth (fuerza bruta de login/register)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: index_js_1.config.nodeEnv === 'production' ? 30 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
});
// Routes
app.use('/api/v1/auth', authLimiter, auth_js_1.authRouter);
app.use('/api/v1/users', users_js_1.usersRouter);
app.use('/api/v1/trips', trips_js_1.tripsRouter);
app.use('/api/v1/auctions', auctions_js_1.auctionsRouter);
app.use('/api/v1/payments', payments_js_1.paymentsRouter);
app.use('/api/v1/ratings', ratings_js_1.ratingsRouter);
app.use('/api/v1/tracking', tracking_js_1.trackingRouter);
app.use('/api/v1/trucks', trucks_js_1.trucksRouter);
app.use('/api/v1/bids', bids_js_1.bidsRouter);
app.use('/api/v1/notifications', notifications_js_1.notificationsRouter);
app.use('/api/v1/stats', stats_js_1.statsRouter);
// 404
app.use((_, res) => res.status(404).json({ error: 'Not found' }));
// Error handler
app.use(errorHandler_js_1.errorHandler);
// WebSocket server
const wss = (0, index_js_2.setupWebSocket)(server);
global.wss = wss;
// Start server
server.listen(index_js_1.config.port, () => {
    console.log(`Server running on port ${index_js_1.config.port}`);
    (0, auctionCron_js_1.startAuctionCron)();
});
//# sourceMappingURL=index.js.map