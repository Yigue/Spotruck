"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const index_js_1 = require("../config/index.js");
const prisma_js_1 = require("../models/prisma.js");
const errors_js_1 = require("../utils/errors.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.authRouter = router;
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['COMPANY', 'DRIVER']),
    companyName: zod_1.z.string().optional(),
    companyCuit: zod_1.z.string().optional(),
    driverLicense: zod_1.z.string().optional(),
    vehiclePlate: zod_1.z.string().optional(),
    vehicleType: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
function signTokens(userId, role, email) {
    const accessToken = jsonwebtoken_1.default.sign({ sub: userId, role, email }, index_js_1.config.jwt.secret, { expiresIn: index_js_1.config.jwt.accessExpiresIn });
    const refreshToken = jsonwebtoken_1.default.sign({ sub: userId, type: 'refresh' }, index_js_1.config.jwt.secret, { expiresIn: index_js_1.config.jwt.refreshExpiresIn });
    return { accessToken, refreshToken };
}
// POST /auth/register
router.post('/register', async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);
        const existing = await prisma_js_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existing)
            return next(errors_js_1.errors.conflict('Email already registered'));
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                role: data.role,
                companyName: data.companyName,
                companyCuit: data.companyCuit,
                driverLicense: data.driverLicense,
                vehiclePlate: data.vehiclePlate,
                vehicleType: data.vehicleType,
                phone: data.phone,
            },
        });
        const tokens = signTokens(user.id, user.role, user.email);
        res.status(201).json({ data: { user: { id: user.id, email: user.email, role: user.role }, ...tokens } });
    }
    catch (err) {
        next(err);
    }
});
// POST /auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma_js_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return next(errors_js_1.errors.unauthorized('Invalid credentials'));
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid)
            return next(errors_js_1.errors.unauthorized('Invalid credentials'));
        const tokens = signTokens(user.id, user.role, user.email);
        res.json({ data: { user: { id: user.id, email: user.email, role: user.role }, ...tokens } });
    }
    catch (err) {
        next(err);
    }
});
// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return next(errors_js_1.errors.badRequest('refreshToken required'));
        const payload = jsonwebtoken_1.default.verify(refreshToken, index_js_1.config.jwt.secret);
        if (payload.type !== 'refresh')
            return next(errors_js_1.errors.unauthorized('Invalid refresh token'));
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            return next(errors_js_1.errors.unauthorized('User not found'));
        const tokens = signTokens(user.id, user.role, user.email);
        res.json({ data: tokens });
    }
    catch {
        next(errors_js_1.errors.unauthorized('Invalid or expired refresh token'));
    }
});
// POST /auth/logout
router.post('/logout', auth_js_1.authenticate, (_req, res) => {
    res.json({ data: { success: true } });
});
// GET /auth/me
router.get('/me', auth_js_1.authenticate, async (req, res) => {
    const user = await prisma_js_1.prisma.user.findUnique({
        where: { id: req.user.sub },
        select: {
            id: true, email: true, role: true,
            companyName: true, companyCuit: true, phone: true,
            driverLicense: true, vehiclePlate: true, vehicleType: true,
            vehicleCapacity: true, ratingAvg: true, tripsCompleted: true, createdAt: true,
        },
    });
    if (!user) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
    }
    res.json({ data: user });
});
//# sourceMappingURL=auth.js.map