"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
const errors_js_1 = require("../utils/errors.js");
function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return next(errors_js_1.errors.unauthorized('Missing or invalid authorization header'));
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, index_js_1.config.jwt.secret);
        req.user = payload;
        next();
    }
    catch {
        next(errors_js_1.errors.unauthorized('Invalid or expired token'));
    }
}
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user)
            return next(errors_js_1.errors.unauthorized());
        if (!roles.includes(req.user.role)) {
            return next(errors_js_1.errors.forbidden('Insufficient permissions'));
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map