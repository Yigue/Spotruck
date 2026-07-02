"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../config/index.js");
const errors_js_1 = require("../utils/errors.js");
const client_1 = require("@prisma/client");
const mercadopagoService_js_1 = require("./mercadopagoService.js");
const notificationService_js_1 = require("./notificationService.js");
// Aritmética de dinero con Decimal (acepta number o Decimal de Prisma)
const D = (v) => new client_1.Prisma.Decimal(v);
exports.paymentService = {
    async createHold(tripId, driverId) {
        const trip = await prisma_js_1.prisma.trip.findUnique({
            where: { id: tripId },
            include: { user: { select: { id: true, email: true } } },
        });
        if (!trip)
            throw errors_js_1.errors.notFound('Trip');
        const auction = await prisma_js_1.prisma.auction.findUnique({ where: { tripId } });
        if (!auction)
            throw errors_js_1.errors.notFound('Auction for this trip');
        const amount = D(auction.currentPrice).toDecimalPlaces(2);
        const platformFee = amount.mul(index_js_1.config.payment.platformFeePercent).toDecimalPlaces(2);
        const netAmount = amount.minus(platformFee);
        const holdExpiresAt = new Date(Date.now() + index_js_1.config.payment.holdDurationHours * 60 * 60 * 1000);
        // Con MercadoPago configurado el pago nace PENDING y pasa a HELD cuando
        // la empresa paga (webhook). Sin credenciales: modo simulado, HELD directo.
        const useMP = mercadopagoService_js_1.mercadopagoService.isConfigured();
        const payment = await prisma_js_1.prisma.payment.create({
            data: {
                tripId,
                userId: driverId,
                amount,
                platformFee,
                netAmount,
                status: useMP ? 'PENDING' : 'HELD',
                holdExpiresAt,
            },
        });
        if (useMP) {
            try {
                const preference = await mercadopagoService_js_1.mercadopagoService.createPreference({
                    paymentId: payment.id,
                    title: `Flete ${trip.originAddress} → ${trip.destAddress}`,
                    amount: amount.toNumber(),
                    payerEmail: trip.user.email,
                });
                const updated = await prisma_js_1.prisma.payment.update({
                    where: { id: payment.id },
                    data: { mercadopagoId: preference.id, paymentUrl: preference.initPoint },
                });
                await notificationService_js_1.notificationService.createInApp(trip.userId, 'PAYMENT_PENDING', 'Pagá el viaje para confirmar al transportista', `El pago de ${amount} ARS queda en custodia hasta que confirmes la entrega`, { tripId, paymentId: payment.id, paymentUrl: preference.initPoint });
                return updated;
            }
            catch (err) {
                console.error('[MP] No se pudo crear la preferencia de pago:', err);
            }
        }
        return payment;
    },
    async releasePayment(paymentId) {
        const payment = await prisma_js_1.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment)
            throw errors_js_1.errors.notFound('Payment');
        if (payment.status !== 'HELD')
            throw errors_js_1.errors.badRequest('Payment is not HELD');
        const updated = await prisma_js_1.prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'RELEASED' },
        });
        await prisma_js_1.prisma.trip.update({ where: { id: payment.tripId }, data: { status: 'SETTLED' } });
        return updated;
    },
    async calculatePenalty(tripId, _cancellerRole, hoursBefore) {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            throw errors_js_1.errors.notFound('Trip');
        let penaltyPercent;
        if (hoursBefore > 48) {
            penaltyPercent = 0.10;
        }
        else if (hoursBefore >= 24) {
            penaltyPercent = 0.20;
        }
        else {
            penaltyPercent = 0.30;
        }
        return D(trip.basePrice).mul(penaltyPercent).toDecimalPlaces(2);
    },
    async processRefund(paymentId, _reason) {
        const payment = await prisma_js_1.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment)
            throw errors_js_1.errors.notFound('Payment');
        let updated;
        if (payment.status === 'HELD') {
            updated = await prisma_js_1.prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'REFUNDED' },
            });
        }
        else if (payment.status === 'DISPUTED') {
            updated = await prisma_js_1.prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'REFUNDED' },
            });
        }
        else {
            throw errors_js_1.errors.badRequest('Only HELD or DISPUTED payments can be refunded');
        }
        return updated;
    },
};
//# sourceMappingURL=paymentService.js.map