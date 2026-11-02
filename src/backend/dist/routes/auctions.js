"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auctionsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../config/index.js");
const errors_js_1 = require("../utils/errors.js");
const notificationService_js_1 = require("../services/notificationService.js");
const index_js_2 = require("../websocket/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
exports.auctionsRouter = router;
const createAuctionSchema = zod_1.z.object({
    tripId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['OPEN', 'DUTCH', 'SEALED']).default('OPEN'),
    startTime: zod_1.z.string().datetime().optional(),
    endTime: zod_1.z.string().datetime().optional(),
    reservePrice: zod_1.z.number().positive().optional(),
});
const bidSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    note: zod_1.z.string().max(500).optional(),
    truckId: zod_1.z.string().uuid().optional(),
});
// GET /auctions
router.get('/', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const { status, type, page = '1', limit = '20' } = zod_1.z
            .object({
            status: zod_1.z.enum(['PENDING', 'OPEN', 'CLOSED', 'SETTLED', 'CANCELLED']).optional(),
            type: zod_1.z.enum(['OPEN', 'DUTCH', 'SEALED']).optional(),
            page: zod_1.z.string().optional(),
            limit: zod_1.z.string().optional(),
        })
            .parse(req.query);
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        const [auctions, total] = await Promise.all([
            prisma_js_1.prisma.auction.findMany({
                where,
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
                orderBy: { startTime: 'desc' },
                include: {
                    trip: {
                        select: { id: true, originAddress: true, destAddress: true, cargoType: true, basePrice: true, scheduledDate: true },
                    },
                    _count: { select: { bids: true } },
                },
            }),
            prisma_js_1.prisma.auction.count({ where }),
        ]);
        res.json({ data: auctions, meta: { total, page: Number(page), limit: Number(limit) } });
    }
    catch (err) {
        next(err);
    }
});
// GET /auctions/:id
router.get('/:id', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const auction = await prisma_js_1.prisma.auction.findUnique({
            where: { id: req.params.id },
            include: {
                trip: {
                    include: { user: { select: { id: true, companyName: true, ratingAvg: true } } },
                },
                bids: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { id: true, companyName: true, ratingAvg: true, ratingCount: true, phone: true, tripsCompleted: true, documentsStatus: true, avatarUrl: true } },
                        truck: { select: { id: true, plate: true, type: true, capacityKg: true } },
                    },
                },
            },
        });
        if (!auction)
            return next(errors_js_1.errors.notFound('Auction'));
        // Teléfonos de postulantes: solo para la empresa dueña del viaje
        const isOwner = auction.trip.userId === req.user.sub || req.user.role === 'ADMIN';
        const data = isOwner
            ? auction
            : {
                ...auction,
                bids: auction.bids.map((b) => b.user.id === req.user.sub ? b : { ...b, user: { ...b.user, phone: null } }),
            };
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
// POST /auctions
router.post('/', auth_js_1.authenticate, (0, auth_js_1.requireRole)('COMPANY', 'ADMIN'), async (req, res, next) => {
    try {
        const data = createAuctionSchema.parse(req.body);
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: data.tripId } });
        if (!trip)
            return next(errors_js_1.errors.notFound('Trip'));
        if (trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden('Not your trip'));
        }
        if (trip.status !== 'OPEN')
            return next(errors_js_1.errors.badRequest('Trip must be OPEN to create auction'));
        const now = new Date();
        const auction = await prisma_js_1.prisma.auction.create({
            data: {
                tripId: data.tripId,
                type: data.type,
                startTime: data.startTime ? new Date(data.startTime) : now,
                endTime: data.endTime ? new Date(data.endTime) : new Date(now.getTime() + 24 * 60 * 60 * 1000),
                reservePrice: data.reservePrice ?? new client_1.Prisma.Decimal(trip.basePrice).mul(0.9).toDecimalPlaces(2),
                currentPrice: trip.basePrice,
                status: 'OPEN',
            },
        });
        await prisma_js_1.prisma.trip.update({ where: { id: data.tripId }, data: { status: 'AUCTION' } });
        res.status(201).json({ data: auction });
    }
    catch (err) {
        next(err);
    }
});
// POST /auctions/:id/bid
router.post('/:id/bid', auth_js_1.authenticate, (0, auth_js_1.requireRole)('DRIVER'), async (req, res, next) => {
    try {
        const { amount, note, truckId } = bidSchema.parse(req.body);
        const auctionId = req.params.id;
        const auction = await prisma_js_1.prisma.auction.findUnique({
            where: { id: auctionId },
            include: { trip: true },
        });
        if (!auction)
            return next(errors_js_1.errors.notFound('Auction'));
        if (auction.status !== 'OPEN')
            return next(errors_js_1.errors.badRequest('Auction is not open'));
        if (new Date() > auction.endTime)
            return next(errors_js_1.errors.badRequest('Auction has ended'));
        const minBid = new client_1.Prisma.Decimal(auction.currentPrice).mul(1 - index_js_1.config.auction.minBidDecrementPercent);
        if (minBid.lte(amount))
            return next(errors_js_1.errors.badRequest(`Bid must be lower than ${minBid}`));
        if (truckId) {
            const truck = await prisma_js_1.prisma.truck.findUnique({ where: { id: truckId } });
            if (!truck || truck.ownerId !== req.user.sub)
                return next(errors_js_1.errors.badRequest('Invalid truck'));
            if (!truck.active)
                return next(errors_js_1.errors.badRequest('Truck is not active'));
            if (auction.trip.weightKg && truck.capacityKg < auction.trip.weightKg) {
                return next(errors_js_1.errors.badRequest('Truck capacity is below the cargo weight'));
            }
        }
        // Anti-sniping extension
        const now = new Date();
        const timeLeft = auction.endTime.getTime() - now.getTime();
        const antiSnipingWindow = index_js_1.config.auction.antiSnipingWindowMinutes * 60 * 1000;
        let newEndTime = auction.endTime;
        if (timeLeft < antiSnipingWindow && auction.extensionCount < index_js_1.config.auction.maxExtensions) {
            newEndTime = new Date(now.getTime() + index_js_1.config.auction.antiSnipingExtensionMinutes * 60 * 1000);
        }
        const [bid] = await prisma_js_1.prisma.$transaction([
            prisma_js_1.prisma.bid.create({ data: { auctionId, userId: req.user.sub, amount, note, truckId } }),
            prisma_js_1.prisma.auction.update({
                where: { id: auctionId },
                data: { currentPrice: amount, endTime: newEndTime, extensionCount: { increment: newEndTime > auction.endTime ? 1 : 0 } },
            }),
        ]);
        await notificationService_js_1.notificationService.createInApp(auction.trip.userId, 'NEW_BID', 'Nueva oferta en tu publicación', `Un transportista ofreció ${amount} ARS por ${auction.trip.originAddress} → ${auction.trip.destAddress}`, { tripId: auction.tripId, auctionId, bidId: bid.id });
        (0, index_js_2.broadcastToAuction)(auctionId, { currentPrice: amount, endTime: newEndTime.toISOString(), bidId: bid.id });
        res.status(201).json({ data: bid });
    }
    catch (err) {
        next(err);
    }
});
// GET /auctions/:id/bids
router.get('/:id/bids', auth_js_1.authenticate, async (req, res, next) => {
    try {
        const auction = await prisma_js_1.prisma.auction.findUnique({
            where: { id: req.params.id },
            select: { trip: { select: { userId: true } } },
        });
        if (!auction)
            return next(errors_js_1.errors.notFound('Auction'));
        const bids = await prisma_js_1.prisma.bid.findMany({
            where: { auctionId: req.params.id },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, companyName: true, ratingAvg: true, ratingCount: true, phone: true, tripsCompleted: true, documentsStatus: true, avatarUrl: true } },
                truck: { select: { id: true, plate: true, type: true, capacityKg: true } },
            },
        });
        const isOwner = auction.trip.userId === req.user.sub || req.user.role === 'ADMIN';
        const data = isOwner
            ? bids
            : bids.map((b) => (b.user.id === req.user.sub ? b : { ...b, user: { ...b.user, phone: null } }));
        res.json({ data });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /auctions/:id/extend — la empresa dueña extiende la subasta manualmente
router.patch('/:id/extend', auth_js_1.authenticate, (0, auth_js_1.requireRole)('COMPANY', 'ADMIN'), async (req, res, next) => {
    try {
        const { hours } = zod_1.z.object({ hours: zod_1.z.number().int().positive().max(72) }).parse(req.body);
        const auctionId = req.params.id;
        const auction = await prisma_js_1.prisma.auction.findUnique({
            where: { id: auctionId },
            include: { trip: true }
        });
        if (!auction)
            return next(errors_js_1.errors.notFound('Auction'));
        if (auction.trip.userId !== req.user.sub && req.user.role !== 'ADMIN') {
            return next(errors_js_1.errors.forbidden('Not your trip'));
        }
        if (auction.status !== 'OPEN')
            return next(errors_js_1.errors.badRequest('Auction is not open'));
        const newEndTime = new Date(Math.max(auction.endTime.getTime(), Date.now()) + hours * 60 * 60 * 1000);
        const updated = await prisma_js_1.prisma.auction.update({
            where: { id: auctionId },
            data: { endTime: newEndTime }
        });
        (0, index_js_2.broadcastToAuction)(auctionId, { endTime: newEndTime.toISOString() });
        res.json({ data: updated });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=auctions.js.map