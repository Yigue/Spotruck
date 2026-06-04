"use strict";
/**
 * Shared test setup — must be imported BEFORE any router modules.
 * Mocks Prisma, config, bcrypt, and jsonwebtoken.
 * Provides mockReq with proper Express req shape including headers/auth.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockReq = mockReq;
exports.mockRes = mockRes;
exports.mockNext = mockNext;
const globals_1 = require("@jest/globals");
// ─── Prisma mock ──────────────────────────────────────────────────────────────
globals_1.jest.mock('@prisma/client', () => ({
    PrismaClient: globals_1.jest.fn().mockImplementation(() => ({
        user: {
            findUnique: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
        },
        trip: {
            findUnique: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            count: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
            delete: globals_1.jest.fn(),
        },
        auction: {
            findUnique: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            count: globals_1.jest.fn(),
            create: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
        },
        bid: {
            create: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
        },
        payment: {
            create: globals_1.jest.fn(),
            findFirst: globals_1.jest.fn(),
            update: globals_1.jest.fn(),
        },
        rating: {
            create: globals_1.jest.fn(),
            findUnique: globals_1.jest.fn(),
            findMany: globals_1.jest.fn(),
            aggregate: globals_1.jest.fn(),
        },
    })),
}));
// ─── bcrypt / jsonwebtoken mocks ──────────────────────────────────────────────
globals_1.jest.mock('bcryptjs');
globals_1.jest.mock('jsonwebtoken');
// ─── Config mock ───────────────────────────────────────────────────────────────
globals_1.jest.mock('../../config/index', () => ({
    config: {
        jwt: { secret: 'test-secret', accessExpiresIn: '15m', refreshExpiresIn: '7d' },
        db: { url: 'postgresql://test' },
        redis: { url: 'redis://localhost:6379' },
        mercadopago: { accessToken: '', webhookSecret: '' },
        auction: {
            antiSnipingWindowMinutes: 5,
            antiSnipingExtensionMinutes: 5,
            maxExtensions: 3,
        },
        payment: { platformFeePercent: 0.08, holdDurationHours: 72 },
    },
}));
function mockReq(body = {}, params = {}, query = {}, user = { sub: 'company-1', role: 'COMPANY', email: 'co@example.com' }) {
    return { body, params, query, user, headers: { authorization: 'Bearer test-token' } };
}
function mockRes() {
    const res = {};
    res.status = globals_1.jest.fn().mockReturnThis();
    res.json = globals_1.jest.fn().mockReturnThis();
    return res;
}
function mockNext() {
    return globals_1.jest.fn();
}
//# sourceMappingURL=testSetup.js.map