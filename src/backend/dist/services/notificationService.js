"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const prisma_js_1 = require("../models/prisma.js");
exports.notificationService = {
    async sendEmail(to, subject, _emailBody) {
        // Stub for V1 — use console.log
        // TODO: integrate with SendGrid or AWS SES
        console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
        return { sent: true };
    },
    async notifyAuctionClosed(auctionId, winnerId) {
        // Fetch auction with trip and company
        const auction = await prisma_js_1.prisma.auction.findUnique({
            where: { id: auctionId },
            include: { trip: { include: { user: true } } },
        });
        if (!auction)
            return;
        // Notify company
        const company = auction.trip.user;
        await this.sendEmail(company.email, `¡Subasta #${auctionId.slice(0, 8)} cerrada!`, winnerId
            ? `Ganador encontrado: ${auction.currentPrice} ARS`
            : 'La subasta cerró sin ofertas');
        // Notify winner
        if (winnerId) {
            const winner = await prisma_js_1.prisma.user.findUnique({ where: { id: winnerId } });
            if (winner) {
                await this.sendEmail(winner.email, `¡Ganaste la subasta #${auctionId.slice(0, 8)}!`, `Precio: ${auction.currentPrice} ARS. ¡Buen viaje!`);
            }
        }
    },
    async notifyNewBid(_auctionId, companyId, bidAmount) {
        const company = await prisma_js_1.prisma.user.findUnique({ where: { id: companyId } });
        if (company) {
            await this.sendEmail(company.email, `Nueva oferta en tu viaje`, `Un transportista ofreció ${bidAmount} ARS`);
        }
    },
};
//# sourceMappingURL=notificationService.js.map