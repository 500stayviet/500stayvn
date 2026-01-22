"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = void 0;
const metricsService_1 = require("../services/metricsService");
/**
 * Metrics collection middleware
 */
const metricsMiddleware = (req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        metricsService_1.metricsService.timing('http_request_duration', duration, {
            method: req.method,
            path: req.path,
            statusCode: String(res.statusCode),
        });
        metricsService_1.metricsService.increment('http_request_total', 1, {
            method: req.method,
            path: req.path,
            statusCode: String(res.statusCode),
        });
    });
    next();
};
exports.metricsMiddleware = metricsMiddleware;
//# sourceMappingURL=metricsMiddleware.js.map