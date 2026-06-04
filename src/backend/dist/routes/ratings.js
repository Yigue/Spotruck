"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = require("../models/prisma.js");
const errors_js_1 = require("../utils/errors.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.ratingsRouter = router;
const createRatingSchema = zod_1.z.object({
    tripId: zod_1.z.string().uuid(),
    toUserId: zod_1.z.string().uuid(),
    score: zod_1.z.number().min(1).max(5),
    punctuality: zod_1.z.number().min(1).max(5).optional(),
    communication: zod_1.z.number().min(1).max(5).optional(),
    cargoCondition: zod_1.z.number().min(1).max(5).optional(),
    comment: zod_1.z.string().max(500).optional(),
});
// POST /ratings
router.post('/', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const data = createRatingSchema.parse(req.body);
        if (req.user.sub === data.toUserId) {
            return next(errors_js_1.errors.badRequest('Cannot rate yourself'));
        }
        const existing = await prisma_js_1.prisma.rating.findUnique({
            where: { tripId_fromUserId: { tripId: data.tripId, fromUserId: req.user.sub } },
        });
        if (existing)
            return next(errors_js_1.errors.conflict('Already rated this trip'));
        const [rating] = await prisma_js_1.prisma.$transaction([
            prisma_js_1.prisma.rating.create({
                data: {
                    tripId: data.tripId,
                    fromUserId: req.user.sub,
                    toUserId: data.toUserId,
                    score: data.score,
                    punctuality: data.punctuality,
                    communication: data.communication,
                    cargoCondition: data.cargoCondition,
                    comment: data.comment,
                },
            }),
            // Update user rating avg
            prisma_js_1.prisma.user.update({
                where: { id: data.toUserId },
                data: {
                    ratingCount: { increment: 1 },
                    // Recalculate avg: (oldAvg * oldCount + newScore) / newCount
                },
            }),
        ]);
        // Recalculate average
        const stats = await prisma_js_1.prisma.rating.aggregate({
            where: { toUserId: data.toUserId },
            _avg: { score: true },
            _count: { score: true },
        });
        if (stats._avg.score !== null) {
            await prisma_js_1.prisma.user.update({
                where: { id: data.toUserId },
                data: { ratingAvg: stats._avg.score },
            });
        }
        res.status(201).json({ data: rating });
    }
    catch (err) {
        next(err);
    }
});
// GET /ratings/user/:userId
router.get('/user/:userId', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const ratings = await prisma_js_1.prisma.rating.findMany({
            where: { toUserId: req.params.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                fromUser: { select: { id: true, companyName: true, role: true } },
                trip: { select: { id: true, originAddress: true, destAddress: true } },
            },
        });
        res.json({ data: ratings });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=ratings.js.map