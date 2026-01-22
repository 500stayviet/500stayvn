"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isProduction = exports.isDevelopment = exports.getEnvironmentConfig = void 0;
/**
 * Environment configuration
 */
const getEnvironmentConfig = () => {
    const nodeEnv = (process.env.NODE_ENV || 'development');
    const logLevel = (process.env.LOG_LEVEL || 'info');
    return {
        nodeEnv,
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
        logLevel,
    };
};
exports.getEnvironmentConfig = getEnvironmentConfig;
const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};
exports.isDevelopment = isDevelopment;
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};
exports.isProduction = isProduction;
const isTest = () => {
    return process.env.NODE_ENV === 'test';
};
exports.isTest = isTest;
//# sourceMappingURL=environment.js.map