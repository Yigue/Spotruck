import { prisma } from '../models/prisma.js'
import { config } from '../config/index.js'
import { auctionService } from '../services/auctionService.js'

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

// Tick de subastas holandesas: baja el precio en vivo
async function runDutchTick() {
  try {
    await auctionService.tickDutchAuctions()
  } catch (err) {
    console.error('[CRON] Error en tick DUTCH:', err)
  }
}

// El cron debe iniciarse explícitamente desde index.ts (antes el archivo se
// auto-iniciaba al importarse, pero nadie lo importaba y nunca corría)
function startAuctionCron() {
  setInterval(runAuctionCron, 60 * 1000)
  runAuctionCron().catch(console.error)
  // El decremento DUTCH corre más seguido para que el precio "baje en vivo"
  setInterval(runDutchTick, config.auction.dutchTickSeconds * 1000)
  runDutchTick()
  console.log(`[CRON] Auction close (60s) + DUTCH tick (${config.auction.dutchTickSeconds}s) started`)
}

export { runAuctionCron, startAuctionCron }
