"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const prisma_js_1 = require("../models/prisma.js");
const emailService_js_1 = require("./emailService.js");
const index_js_1 = require("../websocket/index.js");
exports.notificationService = {
    async createInApp(userId, type, title, body, payload) {
        const notification = await prisma_js_1.prisma.notification.create({
            data: { userId, type, title, body, payload },
        });
        // Push en tiempo real al canal personal del usuario
        (0, index_js_1.broadcastToUser)(userId, { type: 'notification', notification });
        return notification;
    },
    async sendEmail(to, subject, emailBody) {
        return emailService_js_1.emailService.send(to, subject, `<p>${emailBody}</p>`);
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