export declare const config: {
    port: number;
    nodeEnv: string;
    corsOrigin: string;
    jwt: {
        secret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    db: {
        url: string;
    };
    redis: {
        url: string;
    };
    mercadopago: {
        accessToken: string;
        webhookSecret: string;
    };
    auction: {
        antiSnipingWindowMinutes: number;
        antiSnipingExtensionMinutes: number;
        minBidDecrementPercent: number;
        maxExtensions: number;
    };
    payment: {
        platformFeePercent: number;
        holdDurationHours: number;
    };
};
//# sourceMappingURL=index.d.ts.map