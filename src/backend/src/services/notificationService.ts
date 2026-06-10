import type { Prisma } from '@prisma/client'
import { prisma } from '../models/prisma.js'
import { emailService } from './emailService.js'
import { broadcastToUser } from '../websocket/index.js'

export const notificationService = {
  async createInApp(
    userId: string,
    type: string,
    title: string,
    body?: string,
    payload?: Prisma.InputJsonValue
  ) {
    const notification = await prisma.notification.create({
      data: { userId, type, title, body, payload },
    })
    // Push en tiempo real al canal personal del usuario
    broadcastToUser(userId, { type: 'notification', notification })
    return notification
  },

  async sendEmail(to: string, subject: string, emailBody: string) {
    return emailService.send(to, subject, `<p>${emailBody}</p>`)
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

  async notifyNewBid(_auctionId: string, companyId: string, bidAmount: number) {
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