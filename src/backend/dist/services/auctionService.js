"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auctionService = void 0;
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../config/index.js");
const errors_js_1 = require("../utils/errors.js");
exports.auctionService = {
    async startAuction(tripId) {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip)
            throw errors_js_1.errors.notFound('Trip');
        if (trip.status !== 'OPEN')
            throw errors_js_1.errors.badRequest('Trip must be OPEN to start auction');
        const auction = await prisma_js_1.prisma.auction.create({
            data: {
                tripId,
                currentPrice: trip.basePrice,
                status: 'PENDING',
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
        await prisma_js_1.prisma.trip.update({ where: { id: tripId }, data: { status: 'AUCTION' } });
        return auction;
    },
    async closeAuction(auctionId) {
        const auction = await prisma_js_1.prisma.auction.findUnique({
            where: { id: auctionId },
            include: { trip: true, bids: { orderBy: { amount: 'asc' } } },
        });
        if (!auction)
            throw errors_js_1.errors.notFound('Auction');
        if (auction.status !== 'OPEN')
            throw errors_js_1.errors.badRequest('Auction is not OPEN');
        let winnerId = null;
        let winningAmount = null;
        if (auction.type === 'OPEN' || auction.type === 'SEALED') {
            // Reverse auction: lowest price wins. SEALED also uses lowest.
            const winningBid = auction.bids[0]; // sorted ASC, lowest first
            if (winningBid) {
                if (auction.reservePrice && winningBid.amount > auction.reservePrice) {
                    // Reserve not met - no winner
                }
                else {
                    winnerId = winningBid.userId;
                    winningAmount = winningBid.amount;
                }
            }
        }
        else if (auction.type === 'DUTCH') {
            // Dutch auction: first to accept the descending price wins
            const winningBid = auction.bids[auction.bids.length - 1]; // last bid (first acceptance in dutch)
            if (winningBid) {
                winnerId = winningBid.userId;
                winningAmount = winningBid.amount;
            }
        }
        if (winnerId && winningAmount !== null) {
            // Create payment hold for winner
            const platformFee = winningAmount * index_js_1.config.payment.platformFeePercent;
            const netAmount = winningAmount - platformFee;
            const holdExpiresAt = new Date(Date.now() + index_js_1.config.payment.holdDurationHours * 60 * 60 * 1000);
            await prisma_js_1.prisma.payment.create({
                data: {
                    tripId: auction.tripId,
                    userId: winnerId,
                    amount: winningAmount,
                    platformFee,
                    netAmount,
                    status: 'HELD',
                    holdExpiresAt,
                },
            });
            await prisma_js_1.prisma.trip.update({ where: { id: auction.tripId }, data: { status: 'ASSIGNED' } });
        }
        await prisma_js_1.prisma.auction.update({ where: { id: auctionId }, data: { status: 'SETTLED' } });
        return { auctionId, winnerId, winningAmount };
    },
    async processBid(auctionId, userId, amount) {
        const auction = await prisma_js_1.prisma.auction.findUnique({
            where: { id: auctionId },
            include: { trip: true },
        });
        if (!auction)
            throw errors_js_1.errors.notFound('Auction');
        if (auction.status !== 'OPEN')
            throw errors_js_1.errors.badRequest('Auction is not open');
        const now = new Date();
        if (now > auction.endTime)
            throw errors_js_1.errors.badRequest('Auction has ended');
        const user = await prisma_js_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw errors_js_1.errors.notFound('User');
        if (user.role !== 'DRIVER')
            throw errors_js_1.errors.forbidden('Only drivers can bid');
        if (amount >= auction.currentPrice) {
            throw errors_js_1.errors.badRequest(`Bid must be lower than current price ${auction.currentPrice}`);
        }
        // Anti-sniping: extend if time remaining < 5min and extensionCount < maxExtensions
        const timeRemaining = auction.endTime.getTime() - now.getTime();
        const antiSnipingWindowMs = index_js_1.config.auction.antiSnipingWindowMinutes * 60 * 1000;
        let newEndTime = auction.endTime;
        if (timeRemaining < antiSnipingWindowMs && auction.extensionCount < index_js_1.config.auction.maxExtensions) {
            const extensionMs = index_js_1.config.auction.antiSnipingExtensionMinutes * 60 * 1000;
            newEndTime = new Date(now.getTime() + extensionMs);
        }
        const [bid] = await prisma_js_1.prisma.$transaction([
            prisma_js_1.prisma.bid.create({ data: { auctionId, userId, amount } }),
            prisma_js_1.prisma.auction.update({
                where: { id: auctionId },
                data: {
                    currentPrice: amount,
                    endTime: newEndTime,
                    extensionCount: { increment: newEndTime > auction.endTime ? 1 : 0 },
                },
            }),
        ]);
        return bid;
    },
    async getAuctionStatus(auctionId) {
        const auction = await prisma_js_1.prisma.auction.findUnique({
            where: { id: auctionId },
            include: {
                trip: true,
                _count: { select: { bids: true } },
                bids: {
                    orderBy: { amount: 'asc' },
                    take: 1,
                    include: { user: { select: { id: true, companyName: true } } },
                },
            },
        });
        if (!auction)
            throw errors_js_1.errors.notFound('Auction');
        const now = new Date();
        const timeRemaining = Math.max(0, auction.endTime.getTime() - now.getTime());
        return {
            ...auction,
            timeRemainingMs: timeRemaining,
            currentWinner: auction.bids[0]?.user ?? null,
        };
    },
};
//# sourceMappingURL=auctionService.js.map