"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
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
const index_js_2 = require("./websocket/index.js");
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: index_js_1.config.corsOrigin }));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
// Routes
app.use('/api/v1/auth', auth_js_1.authRouter);
app.use('/api/v1/users', users_js_1.usersRouter);
app.use('/api/v1/trips', trips_js_1.tripsRouter);
app.use('/api/v1/auctions', auctions_js_1.auctionsRouter);
app.use('/api/v1/payments', payments_js_1.paymentsRouter);
app.use('/api/v1/ratings', ratings_js_1.ratingsRouter);
app.use('/api/v1/tracking', tracking_js_1.trackingRouter);
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
});
//# sourceMappingURL=index.js.map