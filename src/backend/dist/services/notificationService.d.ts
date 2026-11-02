import type { Prisma } from '@prisma/client';
export declare const notificationService: {
    createInApp(userId: string, type: string, title: string, body?: string, payload?: Prisma.InputJsonValue): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        title: string;
        body: string | null;
        payload: Prisma.JsonValue | null;
        readAt: Date | null;
        userId: string;
    }>;
    sendEmail(to: string, subject: string, emailBody: string): Promise<{
        sent: boolean;
    }>;
    notifyAuctionClosed(auctionId: string, winnerId: string | null): Promise<void>;
    notifyNewBid(_auctionId: string, companyId: string, bidAmount: number): Promise<void>;
};
//# sourceMappingURL=notificationService.d.ts.map