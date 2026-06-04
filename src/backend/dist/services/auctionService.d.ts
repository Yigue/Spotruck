export declare const auctionService: {
    startAuction(tripId: string): Promise<{
        status: import(".prisma/client").$Enums.AuctionStatus;
        type: import(".prisma/client").$Enums.AuctionType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        startTime: Date;
        endTime: Date;
        currentPrice: number;
        reservePrice: number | null;
        extensionCount: number;
    }>;
    closeAuction(auctionId: string): Promise<{
        auctionId: string;
        winnerId: string | null;
        winningAmount: number | null;
    }>;
    processBid(auctionId: string, userId: string, amount: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        amount: number;
        auctionId: string;
    }>;
    getAuctionStatus(auctionId: string): Promise<{
        timeRemainingMs: number;
        currentWinner: {
            companyName: string | null;
            id: string;
        };
        trip: {
            status: import(".prisma/client").$Enums.TripStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            originAddress: string;
            originLat: number;
            originLng: number;
            destAddress: string;
            destLat: number;
            destLng: number;
            cargoType: import(".prisma/client").$Enums.CargoType;
            cargoDesc: string | null;
            weightKg: number | null;
            scheduledDate: Date;
            basePrice: number;
            userId: string;
        };
        bids: ({
            user: {
                companyName: string | null;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            amount: number;
            auctionId: string;
        })[];
        _count: {
            bids: number;
        };
        status: import(".prisma/client").$Enums.AuctionStatus;
        type: import(".prisma/client").$Enums.AuctionType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        startTime: Date;
        endTime: Date;
        currentPrice: number;
        reservePrice: number | null;
        extensionCount: number;
    }>;
};
//# sourceMappingURL=auctionService.d.ts.map