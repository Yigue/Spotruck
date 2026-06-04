"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../config/index.js");
const errors_js_1 = require("../utils/errors.js");
exports.paymentService = {
    async createHold(tripId, driverId) {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            throw errors_js_1.errors.notFound('Trip');
        const auction = await prisma_js_1.prisma.auction.findUnique({ where: { tripId } });
        if (!auction)
            throw errors_js_1.errors.notFound('Auction for this trip');
        const amount = auction.currentPrice;
        const platformFee = amount * index_js_1.config.payment.platformFeePercent;
        const netAmount = amount - platformFee;
        const holdExpiresAt = new Date(Date.now() + index_js_1.config.payment.holdDurationHours * 60 * 60 * 1000);
        const payment = await prisma_js_1.prisma.payment.create({
            data: {
                tripId,
                userId: driverId,
                amount,
                platformFee,
                netAmount,
                status: 'HELD',
                holdExpiresAt,
            },
        });
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
        return trip.basePrice * penaltyPercent;
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