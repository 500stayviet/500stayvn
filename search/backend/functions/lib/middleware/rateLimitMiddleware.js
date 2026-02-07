"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = void 0;
const rateLimitService_1 = require("../services/rateLimitService");
const logger_1 = require("../utils/logger");
/**
 * Rate limiting middleware
 */
const rateLimitMiddleware = (req, res, next) => {
    // Convert clientId to string (handle string | string[] type)
    const rawClientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const clientId = Array.isArray(rawClientId) ? rawClientId[0] : rawClientId.toString();
    const limit = 100; // requests per minute
    const window = 60000; // 1 minute
    if (!rateLimitService_1.rateLimitService.isAllowed(clientId, limit, window)) {
        logger_1.logger.warn('Rate limit exceeded', { clientId });
        res.status(429).json({
            error: {
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
            },
        });
        return;
    }
    const remaining = rateLimitService_1.rateLimitService.getRemaining(clientId, limit);
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    next();
};
exports.rateLimitMiddleware = rateLimitMiddleware;
//# sourceMappingURL=rateLimitMiddleware.js.map