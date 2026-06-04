"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
exports.errors = {
    notFound: (resource = 'Resource') => new AppError(404, 'NOT_FOUND', `${resource} not found`),
    unauthorized: (reason = 'Unauthorized') => new AppError(401, 'UNAUTHORIZED', reason),
    forbidden: (reason = 'Forbidden') => new AppError(403, 'FORBIDDEN', reason),
    badRequest: (reason = 'Bad request', details) => new AppError(400, 'BAD_REQUEST', reason, details),
    conflict: (reason = 'Conflict') => new AppError(409, 'CONFLICT', reason),
    tooManyRequests: (reason = 'Too many requests') => new AppError(429, 'TOO_MANY_REQUESTS', reason),
    internal: (reason = 'Internal server error') => new AppError(500, 'INTERNAL_ERROR', reason),
};
//# sourceMappingURL=errors.js.map