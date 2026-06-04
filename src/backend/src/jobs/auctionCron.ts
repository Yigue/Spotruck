import { prisma } from '../models/prisma.js'
import { auctionService } from '../services/auctionService.js'

// setInterval type is inferred correctly

async function runAuctionCron() {
  const now = new Date()
  const expiredAuctions = await prisma.auction.findMany({
    where: { status: 'OPEN', endTime: { lt: now } },
  })

  for (const auction of expiredAuctions) {
    try {
      const result = await auctionService.closeAuction(auction.id)
      if (result.winnerId) {
        console.log(`[CRON] Closed auction ${auction.id} - winner: ${result.winnerId}`)
      } else {
        console.log(`[CRON] Closed auction ${auction.id} - no bids`)
      }
    } catch (err) {
      console.error(`[CRON] Error closing auction ${auction.id}:`, err)
    }
  }
}

// Run every 60 seconds
setInterval(runAuctionCron, 60 * 1000)

// Run immediately on start
runAuctionCron().catch(console.error)

export { runAuctionCron }