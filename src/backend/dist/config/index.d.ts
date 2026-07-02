export declare const config: {
    port: number;
    nodeEnv: string;
    corsOrigin: string;
    frontendUrl: string;
    apiUrl: string;
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
    email: {
        resendApiKey: string;
        from: string;
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