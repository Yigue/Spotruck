export declare const paymentService: {
    createHold(tripId: string, driverId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        tripId: string;
        amount: number;
        platformFee: number;
        netAmount: number;
        mercadopagoId: string | null;
        holdExpiresAt: Date | null;
    }>;
    releasePayment(paymentId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        tripId: string;
        amount: number;
        platformFee: number;
        netAmount: number;
        mercadopagoId: string | null;
        holdExpiresAt: Date | null;
    }>;
    calculatePenalty(tripId: string, _cancellerRole: string, hoursBefore: number): Promise<number>;
    processRefund(paymentId: string, _reason: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        tripId: string;
        amount: number;
        platformFee: number;
        netAmount: number;
        mercadopagoId: string | null;
        holdExpiresAt: Date | null;
    }>;
};
//# sourceMappingURL=paymentService.d.ts.map