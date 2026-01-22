"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.LanguageNotSupportedError = exports.ValidationError = exports.TranslationError = void 0;
const logger_1 = require("./logger");
/**
 * Custom error classes
 */
class TranslationError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'TranslationError';
    }
}
exports.TranslationError = TranslationError;
class ValidationError extends TranslationError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class LanguageNotSupportedError extends TranslationError {
    constructor(language) {
        super(`Language ${language} is not supported`, 'LANGUAGE_NOT_SUPPORTED', 400);
        this.name = 'LanguageNotSupportedError';
    }
}
exports.LanguageNotSupportedError = LanguageNotSupportedError;
/**
 * Error handler utility
 */
class ErrorHandler {
    static handle(error) {
        if (error instanceof TranslationError) {
            logger_1.logger.error('Translation error:', error);
            return {
                message: error.message,
                code: error.code,
                statusCode: error.statusCode,
            };
        }
        if (error instanceof Error) {
            logger_1.logger.error('Unexpected error:', error);
            return {
                message: error.message,
                code: 'INTERNAL_ERROR',
                statusCode: 500,
            };
        }
        logger_1.logger.error('Unknown error:', error);
        return {
            message: 'An unknown error occurred',
            code: 'UNKNOWN_ERROR',
            statusCode: 500,
        };
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=errorHandler.js.map