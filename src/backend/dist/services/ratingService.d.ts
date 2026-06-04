export declare const ratingService: {
    submitRating(data: {
        tripId: string;
        fromUserId: string;
        toUserId: string;
        score: number;
        punctuality?: number;
        communication?: number;
        cargoCondition?: number;
        comment?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        tripId: string;
        toUserId: string;
        score: number;
        punctuality: number | null;
        communication: number | null;
        cargoCondition: number | null;
        comment: string | null;
        fromUserId: string;
    }>;
    getUserRatings(userId: string, page?: number, limit?: number): Promise<{
        data: ({
            trip: {
                id: string;
                originAddress: string;
                destAddress: string;
                scheduledDate: Date;
            };
            fromUser: {
                companyName: string | null;
                id: string;
                ratingAvg: number;
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            toUserId: string;
            score: number;
            punctuality: number | null;
            communication: number | null;
            cargoCondition: number | null;
            comment: string | null;
            fromUserId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    calculateTrustScore(userId: string): Promise<number>;
};
//# sourceMappingURL=ratingService.d.ts.map