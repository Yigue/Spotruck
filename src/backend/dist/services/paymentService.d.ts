import { Prisma } from '@prisma/client';
export declare const paymentService: {
    createHold(tripId: string, driverId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        userId: string;
        amount: Prisma.Decimal;
        platformFee: Prisma.Decimal;
        netAmount: Prisma.Decimal;
        mercadopagoId: string | null;
        mercadopagoStatus: string | null;
        paymentUrl: string | null;
        holdExpiresAt: Date | null;
    }>;
    releasePayment(paymentId: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        userId: string;
        amount: Prisma.Decimal;
        platformFee: Prisma.Decimal;
        netAmount: Prisma.Decimal;
        mercadopagoId: string | null;
        mercadopagoStatus: string | null;
        paymentUrl: string | null;
        holdExpiresAt: Date | null;
    }>;
    calculatePenalty(tripId: string, _cancellerRole: string, hoursBefore: number): Promise<Prisma.Decimal>;
    processRefund(paymentId: string, _reason: string): Promise<{
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        userId: string;
        amount: Prisma.Decimal;
        platformFee: Prisma.Decimal;
        netAmount: Prisma.Decimal;
        mercadopagoId: string | null;
        mercadopagoStatus: string | null;
        paymentUrl: string | null;
        holdExpiresAt: Date | null;
    }>;
};
//# sourceMappingURL=paymentService.d.ts.map