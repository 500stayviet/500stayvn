"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationController = void 0;
const translationService_1 = require("../services/translationService");
const validator_1 = require("../utils/validator");
const errorHandler_1 = require("../utils/errorHandler");
const logger_1 = require("../utils/logger");
const translationService = new translationService_1.TranslationService();
/**
 * Translation controller
 */
class TranslationController {
    /**
     * Translate single text
     */
    static async translate(req, res) {
        try {
            const validatedData = validator_1.Validator.validateTranslationRequest(req.body);
            const result = await translationService.translate(validatedData.text, validatedData.targetLanguage, validatedData.sourceLanguage);
            logger_1.logger.info('Translation successful', {
                sourceLanguage: result.sourceLanguage,
                targetLanguage: result.targetLanguage,
            });
            res.status(200).json(result);
        }
        catch (error) {
            const errorResponse = errorHandler_1.ErrorHandler.handle(error);
            res.status(errorResponse.statusCode).json({
                error: {
                    message: errorResponse.message,
                    code: errorResponse.code,
                },
            });
        }
    }
    /**
     * Translate multiple texts
     */
    static async translateBatch(req, res) {
        try {
            const validatedData = validator_1.Validator.validateBatchTranslationRequest(req.body);
            const results = await translationService.translateBatch(validatedData.texts, validatedData.targetLanguage, validatedData.sourceLanguage);
            logger_1.logger.info('Batch translation successful', {
                count: results.length,
                targetLanguage: validatedData.targetLanguage,
            });
            res.status(200).json({ results });
        }
        catch (error) {
            const errorResponse = errorHandler_1.ErrorHandler.handle(error);
            res.status(errorResponse.statusCode).json({
                error: {
                    message: errorResponse.message,
                    code: errorResponse.code,
                },
            });
        }
    }
    /**
     * Detect language of text
     */
    static async detectLanguage(req, res) {
        try {
            if (!req.body.text) {
                res.status(400).json({
                    error: {
                        message: 'Text is required',
                        code: 'VALIDATION_ERROR',
                    },
                });
                return;
            }
            validator_1.Validator.validateText(req.body.text);
            const detectedLanguage = await translationService.detectLanguage(req.body.text);
            logger_1.logger.info('Language detection successful', { detectedLanguage });
            res.status(200).json({
                language: detectedLanguage,
                text: req.body.text,
            });
        }
        catch (error) {
            const errorResponse = errorHandler_1.ErrorHandler.handle(error);
            res.status(errorResponse.statusCode).json({
                error: {
                    message: errorResponse.message,
                    code: errorResponse.code,
                },
            });
        }
    }
    /**
     * Get supported languages
     */
    static async getSupportedLanguages(req, res) {
        try {
            const languages = translationService.getSupportedLanguages();
            res.status(200).json({ languages });
        }
        catch (error) {
            const errorResponse = errorHandler_1.ErrorHandler.handle(error);
            res.status(errorResponse.statusCode).json({
                error: {
                    message: errorResponse.message,
                    code: errorResponse.code,
                },
            });
        }
    }
}
exports.TranslationController = TranslationController;
//# sourceMappingURL=translationController.js.map