"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
        accessExpiresIn: '15m',
        refreshExpiresIn: '7d',
    },
    db: {
        url: process.env.DATABASE_URL,
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    },
    mercadopago: {
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
        webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
    },
    auction: {
        antiSnipingWindowMinutes: 5,
        antiSnipingExtensionMinutes: 2,
        minBidDecrementPercent: 0.10,
        maxExtensions: 3,
    },
    payment: {
        platformFeePercent: 0.08,
        holdDurationHours: 72,
    },
};
//# sourceMappingURL=index.js.map