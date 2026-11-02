"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../config/index.js");
const errors_js_1 = require("../utils/errors.js");
const mercadopagoService_js_1 = require("../services/mercadopagoService.js");
const notificationService_js_1 = require("../services/notificationService.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.paymentsRouter = router;
// POST /payments/webhook — notificaciones de MercadoPago (sin auth: las
// llama MP; se valida la firma x-signature si hay webhook secret)
router.post('/webhook', async (req, res) => {
    try {
        const dataId = req.query['data.id'] ??
            req.body?.data?.id;
        const type = req.query.type ?? req.body?.type;
        // MP reintenta si no respondemos 200; los eventos que no son de pago se ignoran
        if (type !== 'payment' || !dataId) {
            res.sendStatus(200);
            return;
        }
        const validSignature = mercadopagoService_js_1.mercadopagoService.verifyWebhookSignature({
            signature: req.headers['x-signature'],
            requestId: req.headers['x-request-id'],
            dataId,
        });
        if (!validSignature) {
            res.sendStatus(401);
            return;
        }
        const mpPayment = await mercadopagoService_js_1.mercadopagoService.getPayment(dataId);
        if (!mpPayment.external_reference) {
            res.sendStatus(200);
            return;
        }
        const payment = await prisma_js_1.prisma.payment.findUnique({
            where: { id: mpPayment.external_reference },
            include: { trip: { select: { id: true, userId: true, originAddress: true, destAddress: true } } },
        });
        if (!payment) {
            res.sendStatus(200);
            return;
        }
        // approved → el dinero queda en custodia (HELD) hasta confirmar la entrega
        if (mpPayment.status === 'approved' && payment.status === 'PENDING') {
            await prisma_js_1.prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'HELD', mercadopagoStatus: mpPayment.status },
            });
            await notificationService_js_1.notificationService.createInApp(payment.userId, 'PAYMENT_HELD', 'La empresa pagó el viaje', `El pago de ${payment.amount} ARS quedó en custodia. Se libera al confirmar la entrega`, { tripId: payment.tripId, paymentId: payment.id });
        }
        else {
            await prisma_js_1.prisma.payment.update({
                where: { id: payment.id },
                data: { mercadopagoStatus: mpPayment.status },
            });
        }
        res.sendStatus(200);
    }
    catch (err) {
        console.error('[MP] Error procesando webhook:', err);
        // 500 para que MP reintente
        res.sendStatus(500);
    }
});
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
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden('Only the trip owner can hold a payment'));
        }
        if (trip.status !== 'AUCTION')
            return next(errors_js_1.errors.badRequest('Trip must be in AUCTION status'));
        const amount = new client_1.Prisma.Decimal(trip.auction.currentPrice).toDecimalPlaces(2);
        const platformFee = amount.mul(index_js_1.config.payment.platformFeePercent).toDecimalPlaces(2);
        const netAmount = amount.minus(platformFee);
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
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden('Only the trip owner can release a payment'));
        }
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
// GET /payments/:tripId — solo la empresa dueña del viaje, el transportista
// que cobra o un admin pueden ver los montos
router.get('/:tripId', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const payment = await prisma_js_1.prisma.payment.findFirst({
            where: { tripId: req.params.tripId },
            include: { trip: { select: { userId: true } } },
        });
        if (!payment)
            return next(errors_js_1.errors.notFound('Payment'));
        const requester = req.user.sub;
        const isParty = payment.trip.userId === requester || payment.userId === requester;
        if (!isParty && req.user.role !== 'ADMIN')
            return next(errors_js_1.errors.forbidden());
        const { trip: _trip, ...data } = payment;
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=payments.js.map