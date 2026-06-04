"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = require("../models/prisma.js");
const errors_js_1 = require("../utils/errors.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.usersRouter = router;
router.get('/me', auth_js_1.authenticate, async (req, res) => {
    const user = await prisma_js_1.prisma.user.findUnique({
        where: { id: req.user.sub },
        select: {
            id: true, email: true, role: true, companyName: true,
            companyCuit: true, phone: true, driverLicense: true,
            vehiclePlate: true, vehicleType: true, vehicleCapacity: true,
            ratingAvg: true, ratingCount: true, tripsCompleted: true,
            trustScore: true, createdAt: true,
        },
    });
    if (!user) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
    }
    res.json({ data: user });
});
const updateUserSchema = zod_1.z.object({
    companyName: zod_1.z.string().optional(),
    companyCuit: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    driverLicense: zod_1.z.string().optional(),
    vehiclePlate: zod_1.z.string().optional(),
    vehicleType: zod_1.z.string().optional(),
    vehicleCapacity: zod_1.z.number().optional(),
});
router.put('/me', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const data = updateUserSchema.parse(req.body);
        const user = await prisma_js_1.prisma.user.update({
            where: { id: req.user.sub },
            data,
            select: { id: true, email: true, role: true, updatedAt: true },
        });
        res.json({ data: user });
    }
    catch (err) {
        next(err);
    }
});
router.get('/:id/profile', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const id = req.params.id;
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true, role: true, companyName: true,
                ratingAvg: true, ratingCount: true,
                tripsCompleted: true, trustScore: true, createdAt: true,
            },
        });
        if (!user)
            return next(errors_js_1.errors.notFound('User'));
        res.json({ data: user });
    }
    catch (err) {
        next(err);
    }
});
router.get('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)('ADMIN'), async (req, res, next) => {
    try {
        const { page = '1', limit = '20', role } = req.query;
        const where = role ? { role: role } : {};
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const [users, total] = await Promise.all([
            prisma_js_1.prisma.user.findMany({ where, skip, take, select: { id: true, email: true, role: true, ratingAvg: true, tripsCompleted: true, createdAt: true } }),
            prisma_js_1.prisma.user.count({ where }),
        ]);
        res.json({ data: users, meta: { total, page: Number(page), limit } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=users.js.map