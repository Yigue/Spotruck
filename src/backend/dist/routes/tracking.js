"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = require("../models/prisma.js");
const errors_js_1 = require("../utils/errors.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.trackingRouter = router;
// GET /tracking/:tripId/current — última posición
router.get('/:tripId/current', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const log = await prisma_js_1.prisma.trackingLog.findFirst({
            where: { tripId: req.params.tripId },
            orderBy: { recordedAt: 'desc' },
        });
        if (!log)
            return next(errors_js_1.errors.notFound('Tracking data'));
        res.json({ data: log });
    }
    catch (err) {
        next(err);
    }
});
// GET /tracking/:tripId/history — historial de posiciones
router.get('/:tripId/history', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { limit = '100' } = req.query;
        const logs = await prisma_js_1.prisma.trackingLog.findMany({
            where: { tripId: req.params.tripId },
            orderBy: { recordedAt: 'desc' },
            take: Number(limit),
        });
        res.json({ data: logs });
    }
    catch (err) {
        next(err);
    }
});
// POST /tracking/:tripId — registrar posición (desde GPS del truck)
router.post('/:tripId', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { lat, lng, speed, heading } = zod_1.z.object({
            lat: zod_1.z.number().min(-90).max(90),
            lng: zod_1.z.number().min(-180).max(180),
            speed: zod_1.z.number().optional(),
            heading: zod_1.z.number().optional(),
        }).parse(req.body);
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: req.params.tripId } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (!['ASSIGNED', 'IN_PROGRESS'].includes(trip.status)) {
            return next(errors_js_1.errors.badRequest('Trip not in progress'));
        }
        const log = await prisma_js_1.prisma.trackingLog.create({
            data: {
                tripId: req.params.tripId,
                lat,
                lng,
                speed,
                heading,
            },
        });
        // Update trip status if needed
        if (trip.status === 'ASSIGNED') {
            await prisma_js_1.prisma.trip.update({ where: { id: req.params.tripId }, data: { status: 'IN_PROGRESS' } });
        }
        res.status(201).json({ data: log });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=tracking.js.map