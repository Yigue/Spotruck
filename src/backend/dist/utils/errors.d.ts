export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: unknown | undefined;
    constructor(statusCode: number, code: string, message: string, details?: unknown | undefined);
}
export declare const errors: {
    notFound: (resource?: string) => AppError;
    unauthorized: (reason?: string) => AppError;
    forbidden: (reason?: string) => AppError;
    badRequest: (reason?: string, details?: unknown) => AppError;
    conflict: (reason?: string) => AppError;
    tooManyRequests: (reason?: string) => AppError;
    internal: (reason?: string) => AppError;
};
//# sourceMappingURL=errors.d.ts.map