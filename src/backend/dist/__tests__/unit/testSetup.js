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
globals_1.jest.mock('@prisma/client', () => require('./prismaClientMock'));
// ─── bcrypt / jsonwebtoken mocks ──────────────────────────────────────────────
globals_1.jest.mock('bcryptjs');
globals_1.jest.mock('jsonwebtoken');
// ─── Config mock ───────────────────────────────────────────────────────────────
globals_1.jest.mock('../../config/index', () => require('./configMock'));
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