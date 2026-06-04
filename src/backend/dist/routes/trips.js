"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = require("../models/prisma.js");
const errors_js_1 = require("../utils/errors.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.tripsRouter = router;
const createTripSchema = zod_1.z.object({
    originAddress: zod_1.z.string().min(1),
    originLat: zod_1.z.number().min(-90).max(90),
    originLng: zod_1.z.number().min(-180).max(180),
    destAddress: zod_1.z.string().min(1),
    destLat: zod_1.z.number().min(-90).max(90),
    destLng: zod_1.z.number().min(-180).max(180),
    cargoType: zod_1.z.enum(['BULK', 'PALLETS', 'GENERAL', 'REFRIGERATED']),
    cargoDesc: zod_1.z.string().optional(),
    weightKg: zod_1.z.number().positive().optional(),
    scheduledDate: zod_1.z.string().datetime(),
    basePrice: zod_1.z.number().positive(),
});
const tripWhereSchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    cargoType: zod_1.z.string().optional(),
    minPrice: zod_1.z.string().optional(),
    maxPrice: zod_1.z.string().optional(),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
// GET /trips
router.get('/', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { status, cargoType, minPrice, maxPrice, page = '1', limit = '20' } = tripWhereSchema.parse(req.query);
        const where = {};
        if (status)
            where.status = status;
        if (cargoType)
            where.cargoType = cargoType;
        if (minPrice || maxPrice) {
            where.basePrice = {};
            if (minPrice)
                where.basePrice.gte = Number(minPrice);
            if (maxPrice)
                where.basePrice.lte = Number(maxPrice);
        }
        const [trips, total] = await Promise.all([
            prisma_js_1.prisma.trip.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, companyName: true, ratingAvg: true } },
                    auction: { select: { id: true, status: true, currentPrice: true, type: true, endTime: true } },
                },
            }),
            prisma_js_1.prisma.trip.count({ where }),
        ]);
        res.json({ data: trips, meta: { total, page: Number(page), limit: Number(limit) } });
    }
    catch (err) {
        next(err);
    }
});
// GET /trips/:id
router.get('/:id', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({
            where: { id: req.params.id },
            include: {
                user: { select: { id: true, companyName: true, ratingAvg: true } },
                auction: {
                    include: {
                        bids: {
                            orderBy: { createdAt: 'desc' },
                            take: 10,
                            include: { user: { select: { id: true, companyName: true, ratingAvg: true } } },
                        },
                    },
                },
                trackingLogs: { orderBy: { recordedAt: 'desc' }, take: 100 },
            },
        });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        res.json({ data: trip });
    }
    catch (err) {
        next(err);
    }
});
// POST /trips
router.post('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)('COMPANY', 'ADMIN'), async (req, res, next) => {
    try {
        const data = createTripSchema.parse(req.body);
        const trip = await prisma_js_1.prisma.trip.create({
            data: {
                userId: req.user.sub,
                originAddress: data.originAddress,
                originLat: data.originLat,
                originLng: data.originLng,
                destAddress: data.destAddress,
                destLat: data.destLat,
                destLng: data.destLng,
                cargoType: data.cargoType,
                cargoDesc: data.cargoDesc,
                weightKg: data.weightKg,
                scheduledDate: new Date(data.scheduledDate),
                basePrice: data.basePrice,
            },
        });
        res.status(201).json({ data: trip });
    }
    catch (err) {
        next(err);
    }
});
// PUT /trips/:id
router.put('/:id', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: req.params.id } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden());
        }
        if (!['DRAFT', 'OPEN'].includes(trip.status)) {
            return next(errors_js_1.errors.badRequest('Cannot edit trip in current status'));
        }
        const updated = await prisma_js_1.prisma.trip.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /trips/:id
router.delete('/:id', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: req.params.id } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden());
        }
        if (!['DRAFT', 'OPEN'].includes(trip.status)) {
            return next(errors_js_1.errors.badRequest('Cannot delete trip in current status'));
        }
        await prisma_js_1.prisma.trip.delete({ where: { id: req.params.id } });
        res.json({ data: { success: true } });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=trips.js.map