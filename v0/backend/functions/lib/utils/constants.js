"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.API_ENDPOINTS = exports.DEFAULT_TIMEOUT = exports.MAX_BATCH_SIZE = exports.MAX_TEXT_LENGTH = exports.LANGUAGE_NAMES = exports.DEFAULT_LANGUAGE = exports.SUPPORTED_LANGUAGES = void 0;
/**
 * Application constants
 */
exports.SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh', 'vi'];
exports.DEFAULT_LANGUAGE = 'en';
exports.LANGUAGE_NAMES = {
    en: 'English',
    ko: 'Korean',
    ja: 'Japanese',
    zh: 'Chinese',
    vi: 'Vietnamese',
};
exports.MAX_TEXT_LENGTH = 10000;
exports.MAX_BATCH_SIZE = 100;
exports.DEFAULT_TIMEOUT = 30000; // 30 seconds
exports.API_ENDPOINTS = {
    TRANSLATE: '/translate',
    TRANSLATE_BATCH: '/translateBatch',
    DETECT_LANGUAGE: '/detectLanguage',
    SUPPORTED_LANGUAGES: '/supportedLanguages',
};
exports.ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    LANGUAGE_NOT_SUPPORTED: 'LANGUAGE_NOT_SUPPORTED',
    TRANSLATION_FAILED: 'TRANSLATION_FAILED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    TIMEOUT: 'TIMEOUT',
};
//# sourceMappingURL=constants.js.map