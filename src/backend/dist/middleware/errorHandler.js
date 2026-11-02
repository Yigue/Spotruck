"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const multer_1 = __importDefault(require("multer"));
const errors_js_1 = require("../utils/errors.js");
function errorHandler(err, _req, res, _next) {
    if (err instanceof multer_1.default.MulterError) {
        // LIMIT_FILE_SIZE → 413 con mensaje en español (specs de avatar/documentos)
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                error: {
                    code: 'PAYLOAD_TOO_LARGE',
                    message: 'El archivo supera el tamaño máximo permitido (2 MB para avatar, 5 MB por documento)',
                },
            });
        }
        return res.status(400).json({
            error: { code: err.code, message: err.message },
        });
    }
    if (err instanceof errors_js_1.AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        });
    }
    if (err instanceof zod_1.z.ZodError) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: err.errors,
            },
        });
    }
    // Unexpected error
    console.error('[ERROR]', err);
    return res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
        },
    });
}
//# sourceMappingURL=errorHandler.js.map