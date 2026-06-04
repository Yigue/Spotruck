"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../config/index.js");
const errors_js_1 = require("../utils/errors.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.paymentsRouter = router;
// POST /payments/hold — crear hold de pago al asignar transportista
router.post('/hold', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { tripId } = zod_1.z.object({ tripId: zod_1.z.string().uuid() }).parse(req.body);
        const trip = await prisma_js_1.prisma.trip.findUnique({
            where: { id: tripId },
            include: { auction: true },
        });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.status !== 'AUCTION')
            return next(errors_js_1.errors.badRequest('Trip must be in AUCTION status'));
        const amount = trip.auction.currentPrice;
        const platformFee = amount * index_js_1.config.payment.platformFeePercent;
        const netAmount = amount - platformFee;
        const holdExpiresAt = new Date(Date.now() + index_js_1.config.payment.holdDurationHours * 60 * 60 * 1000);
        const payment = await prisma_js_1.prisma.payment.create({
            data: {
                tripId,
                userId: req.user.sub,
                amount,
                platformFee,
                netAmount,
                status: 'HELD',
                holdExpiresAt,
            },
        });
        res.status(201).json({ data: payment });
    }
    catch (err) {
        next(err);
    }
});
// POST /payments/release — liberar pago post-entrega
router.post('/release', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { tripId } = zod_1.z.object({ tripId: zod_1.z.string().uuid() }).parse(req.body);
        const payment = await prisma_js_1.prisma.payment.findFirst({
            where: { tripId, status: 'HELD' },
        });
        if (!payment)
            return next(errors_js_1.errors.notFound('Held payment for this trip'));
        const updated = await prisma_js_1.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'RELEASED' },
        });
        await prisma_js_1.prisma.trip.update({ where: { id: tripId }, data: { status: 'SETTLED' } });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
// GET /payments/:tripId
router.get('/:tripId', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const payment = await prisma_js_1.prisma.payment.findFirst({
            where: { tripId: req.params.tripId },
        });
        if (!payment)
            return next(errors_js_1.errors.notFound('Payment'));
        res.json({ data: payment });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=payments.js.map