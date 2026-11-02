export declare const trackingService: {
    recordPosition(tripId: string, lat: number, lng: number, speed?: number, heading?: number): Promise<{
        id: string;
        tripId: string;
        lat: number;
        lng: number;
        speed: number | null;
        heading: number | null;
        recordedAt: Date;
    }>;
    getCurrentPosition(tripId: string): Promise<{
        id: string;
        tripId: string;
        lat: number;
        lng: number;
        speed: number | null;
        heading: number | null;
        recordedAt: Date;
    }>;
    getRouteHistory(tripId: string, limit?: number): Promise<{
        id: string;
        tripId: string;
        lat: number;
        lng: number;
        speed: number | null;
        heading: number | null;
        recordedAt: Date;
    }[]>;
    calculateETA(tripId: string): Promise<{
        distanceKm: number;
        eta: Date;
        speedKmh: number;
    } | null>;
};
//# sourceMappingURL=trackingService.d.ts.map