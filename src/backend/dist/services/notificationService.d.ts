export declare const notificationService: {
    sendEmail(to: string, subject: string, _emailBody: string): Promise<{
        sent: boolean;
    }>;
    notifyAuctionClosed(auctionId: string, winnerId: string | null): Promise<void>;
    notifyNewBid(_auctionId: string, companyId: string, bidAmount: number): Promise<void>;
};
//# sourceMappingURL=notificationService.d.ts.map