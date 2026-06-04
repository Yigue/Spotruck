import { prisma } from '../models/prisma.js'

export const notificationService = {
  async sendEmail(to: string, subject: string, body: string) {
    // Stub for V1 — use console.log
    // TODO: integrate with SendGrid or AWS SES
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`)
    return { sent: true }
  },

  async notifyAuctionClosed(auctionId: string, winnerId: string | null) {
    // Fetch auction with trip and company
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { trip: { include: { user: true } } },
    })
    if (!auction) return

    // Notify company
    const company = auction.trip.user
    await this.sendEmail(
      company.email,
      `¡Subasta #${auctionId.slice(0, 8)} cerrada!`,
      winnerId
        ? `Ganador encontrado: ${auction.currentPrice} ARS`
        : 'La subasta cerró sin ofertas'
    )

    // Notify winner
    if (winnerId) {
      const winner = await prisma.user.findUnique({ where: { id: winnerId } })
      if (winner) {
        await this.sendEmail(
          winner.email,
          `¡Ganaste la subasta #${auctionId.slice(0, 8)}!`,
          `Precio: ${auction.currentPrice} ARS. ¡Buen viaje!`
        )
      }
    }
  },

  async notifyNewBid(auctionId: string, companyId: string, bidAmount: number) {
    const company = await prisma.user.findUnique({ where: { id: companyId } })
    if (company) {
      await this.sendEmail(
        company.email,
        `Nueva oferta en tu viaje`,
        `Un transportista ofreció ${bidAmount} ARS`
      )
    }
  },
}