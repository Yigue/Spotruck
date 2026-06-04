"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingService = void 0;
const prisma_js_1 = require("../models/prisma.js");
const errors_js_1 = require("../utils/errors.js");
exports.ratingService = {
    async submitRating(data) {
        if (data.fromUserId === data.toUserId) {
            throw errors_js_1.errors.badRequest('Cannot rate yourself');
        }
        const existing = await prisma_js_1.prisma.rating.findUnique({
            where: { tripId_fromUserId: { tripId: data.tripId, fromUserId: data.fromUserId } },
        });
        if (existing)
            throw errors_js_1.errors.conflict('Already rated this trip');
        const rating = await prisma_js_1.prisma.rating.create({
            data: {
                tripId: data.tripId,
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                score: data.score,
                punctuality: data.punctuality,
                communication: data.communication,
                cargoCondition: data.cargoCondition,
                comment: data.comment,
            },
        });
        // Recalculate target user's ratingAvg
        const allRatings = await prisma_js_1.prisma.rating.findMany({ where: { toUserId: data.toUserId } });
        const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
        await prisma_js_1.prisma.user.update({
            where: { id: data.toUserId },
            data: { ratingAvg: avg, ratingCount: allRatings.length },
        });
        return rating;
    },
    async getUserRatings(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [ratings, total] = await Promise.all([
            prisma_js_1.prisma.rating.findMany({
                where: { toUserId: userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    fromUser: { select: { id: true, companyName: true, ratingAvg: true } },
                    trip: { select: { id: true, originAddress: true, destAddress: true, scheduledDate: true } },
                },
            }),
            prisma_js_1.prisma.rating.count({ where: { toUserId: userId } }),
        ]);
        return { data: ratings, meta: { total, page, limit } };
    },
    async calculateTrustScore(userId) {
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw errors_js_1.errors.notFound('User');
        const ratingCount = user.ratingCount;
        const ratingAvg = user.ratingAvg;
        const tripsCompleted = user.tripsCompleted;
        // Elo-like formula: (ratingCount * ratingAvg / 5 + tripsCompleted * 0.1) / (ratingCount + 1)
        const trust = (ratingCount * ratingAvg / 5 + tripsCompleted * 0.1) / (ratingCount + 1);
        // Clamp 0-1
        const clamped = Math.min(1, Math.max(0, trust));
        await prisma_js_1.prisma.user.update({ where: { id: userId }, data: { trustScore: clamped } });
        return clamped;
    },
};
//# sourceMappingURL=ratingService.js.map