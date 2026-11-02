"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAuctionCron = runAuctionCron;
exports.startAuctionCron = startAuctionCron;
const prisma_js_1 = require("../models/prisma.js");
const auctionService_js_1 = require("../services/auctionService.js");
async function runAuctionCron() {
    const now = new Date();
    const expiredAuctions = await prisma_js_1.prisma.auction.findMany({
        where: { status: 'OPEN', endTime: { lt: now } },
    });
    for (const auction of expiredAuctions) {
        try {
            const result = await auctionService_js_1.auctionService.closeAuction(auction.id);
            if (result.winnerId) {
                console.log(`[CRON] Closed auction ${auction.id} - winner: ${result.winnerId}`);
            }
            else {
                console.log(`[CRON] Closed auction ${auction.id} - no bids`);
            }
        }
        catch (err) {
            console.error(`[CRON] Error closing auction ${auction.id}:`, err);
        }
    }
}
// El cron debe iniciarse explícitamente desde index.ts (antes el archivo se
// auto-iniciaba al importarse, pero nadie lo importaba y nunca corría)
function startAuctionCron() {
    setInterval(runAuctionCron, 60 * 1000);
    runAuctionCron().catch(console.error);
    console.log('[CRON] Auction close job started (every 60s)');
}
//# sourceMappingURL=auctionCron.js.map