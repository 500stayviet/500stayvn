"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const environment_1 = require("./environment");
const database_1 = require("./database");
/**
 * Application configuration
 */
exports.appConfig = {
    environment: (0, environment_1.getEnvironmentConfig)(),
    database: (0, database_1.getDatabaseConfig)(),
    translation: {
        apiKey: process.env.TRANSLATION_API_KEY || '',
        apiEndpoint: process.env.TRANSLATION_API_ENDPOINT || '',
        timeout: process.env.TRANSLATION_TIMEOUT
            ? parseInt(process.env.TRANSLATION_TIMEOUT, 10)
            : 30000,
    },
    cors: {
        allowedOrigins: ((_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || ['*'],
    },
    rateLimit: {
        enabled: process.env.RATE_LIMIT_ENABLED === 'true',
        max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100,
        window: process.env.RATE_LIMIT_WINDOW
            ? parseInt(process.env.RATE_LIMIT_WINDOW, 10)
            : 60000,
    },
};
//# sourceMappingURL=app.config.js.map