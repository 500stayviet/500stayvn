"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const errorHandler_1 = require("./errorHandler");
/**
 * Validation utility functions
 */
class Validator {
    static validateText(text) {
        if (!text || typeof text !== 'string') {
            throw new errorHandler_1.ValidationError('Text must be a non-empty string');
        }
        if (text.trim().length === 0) {
            throw new errorHandler_1.ValidationError('Text cannot be empty or only whitespace');
        }
        if (text.length > 10000) {
            throw new errorHandler_1.ValidationError('Text exceeds maximum length of 10000 characters');
        }
    }
    static validateLanguage(language, supportedLanguages) {
        if (!language || typeof language !== 'string') {
            throw new errorHandler_1.ValidationError('Language must be a non-empty string');
        }
        if (!supportedLanguages.includes(language)) {
            throw new errorHandler_1.ValidationError(`Language ${language} is not supported`);
        }
    }
    static validateTranslationRequest(data) {
        if (!data || typeof data !== 'object') {
            throw new errorHandler_1.ValidationError('Request body must be an object');
        }
        if (!data.text) {
            throw new errorHandler_1.ValidationError('Text is required');
        }
        if (!data.targetLanguage) {
            throw new errorHandler_1.ValidationError('Target language is required');
        }
        this.validateText(data.text);
        return {
            text: data.text,
            targetLanguage: data.targetLanguage,
            sourceLanguage: data.sourceLanguage,
        };
    }
    static validateBatchTranslationRequest(data) {
        if (!data || typeof data !== 'object') {
            throw new errorHandler_1.ValidationError('Request body must be an object');
        }
        if (!Array.isArray(data.texts)) {
            throw new errorHandler_1.ValidationError('Texts must be an array');
        }
        if (data.texts.length === 0) {
            throw new errorHandler_1.ValidationError('Texts array cannot be empty');
        }
        if (data.texts.length > 100) {
            throw new errorHandler_1.ValidationError('Maximum 100 texts allowed per batch');
        }
        if (!data.targetLanguage) {
            throw new errorHandler_1.ValidationError('Target language is required');
        }
        data.texts.forEach((text, index) => {
            try {
                this.validateText(text);
            }
            catch (error) {
                throw new errorHandler_1.ValidationError(`Text at index ${index} is invalid: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
        return {
            texts: data.texts,
            targetLanguage: data.targetLanguage,
            sourceLanguage: data.sourceLanguage,
        };
    }
}
exports.Validator = Validator;
//# sourceMappingURL=validator.js.map