import { Prisma } from '@prisma/client';
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
        currentPrice: Prisma.Decimal;
        reservePrice: Prisma.Decimal | null;
        extensionCount: number;
    }>;
    closeAuction(auctionId: string): Promise<{
        auctionId: string;
        winnerId: string | null;
        winningAmount: Prisma.Decimal | null;
    }>;
    processBid(auctionId: string, userId: string, amount: number): Promise<{
        status: import(".prisma/client").$Enums.BidStatus;
        id: string;
        createdAt: Date;
        auctionId: string;
        userId: string;
        note: string | null;
        amount: Prisma.Decimal;
        truckId: string | null;
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
            userId: string;
            originAddress: string;
            originLat: number;
            originLng: number;
            originProvince: string | null;
            originCity: string | null;
            destAddress: string;
            destLat: number;
            destLng: number;
            destProvince: string | null;
            destCity: string | null;
            distanceKm: number | null;
            durationMin: number | null;
            cargoType: import(".prisma/client").$Enums.CargoType;
            cargoDesc: string | null;
            weightKg: number | null;
            volumeDesc: string | null;
            scheduledDate: Date;
            endDate: Date | null;
            basePrice: Prisma.Decimal;
        };
        bids: ({
            user: {
                companyName: string | null;
                id: string;
            };
        } & {
            status: import(".prisma/client").$Enums.BidStatus;
            id: string;
            createdAt: Date;
            auctionId: string;
            userId: string;
            note: string | null;
            amount: Prisma.Decimal;
            truckId: string | null;
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
        currentPrice: Prisma.Decimal;
        reservePrice: Prisma.Decimal | null;
        extensionCount: number;
    }>;
};
//# sourceMappingURL=auctionService.d.ts.map