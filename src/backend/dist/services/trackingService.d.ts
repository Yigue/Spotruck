export declare const trackingService: {
    recordPosition(tripId: string, lat: number, lng: number, speed?: number, heading?: number): Promise<{
        id: string;
        tripId: string;
        recordedAt: Date;
        lat: number;
        lng: number;
        speed: number | null;
        heading: number | null;
    }>;
    getCurrentPosition(tripId: string): Promise<{
        id: string;
        tripId: string;
        recordedAt: Date;
        lat: number;
        lng: number;
        speed: number | null;
        heading: number | null;
    }>;
    getRouteHistory(tripId: string, limit?: number): Promise<{
        id: string;
        tripId: string;
        recordedAt: Date;
        lat: number;
        lng: number;
        speed: number | null;
        heading: number | null;
    }[]>;
    calculateETA(tripId: string): Promise<{
        distanceKm: number;
        eta: Date;
        speedKmh: number;
    } | null>;
};
//# sourceMappingURL=trackingService.d.ts.map