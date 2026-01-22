"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationService = void 0;
const cacheService_1 = require("./cacheService");
const logger_1 = require("../utils/logger");
const translationTerms_1 = require("../utils/translationTerms");
/**
 * Translation Service
 * Handles translation operations for multiple languages
 */
class TranslationService {
    constructor(config) {
        this.config = Object.assign({ defaultLanguage: 'en', supportedLanguages: ['en', 'ko', 'ja', 'zh', 'vi'], apiKey: process.env.GEMINI_API_KEY || process.env.TRANSLATION_API_KEY || '' }, config);
        this.apiKey = this.config.apiKey;
        if (!this.apiKey) {
            logger_1.logger.warn('TranslationService: GEMINI_API_KEY not configured');
        }
        else {
            logger_1.logger.debug('TranslationService: API key configured (using direct HTTP calls)');
        }
    }
    /**
     * Translate text to target language
     */
    async translate(text, targetLanguage, sourceLanguage) {
        try {
            if (!text || !text.trim()) {
                throw new Error('Text to translate cannot be empty');
            }
            if (!this.isLanguageSupported(targetLanguage)) {
                throw new Error(`Target language ${targetLanguage} is not supported`);
            }
            // Check cache first
            const cacheKey = cacheService_1.cacheService.generateTranslationKey(text, sourceLanguage || 'auto', targetLanguage);
            const cached = cacheService_1.cacheService.get(cacheKey);
            if (cached) {
                logger_1.logger.debug('Translation cache hit', { cacheKey });
                return cached;
            }
            // If source language is not provided, try to detect it
            const detectedSourceLanguage = sourceLanguage || await this.detectLanguage(text);
            // If source and target are the same, return original text
            if (detectedSourceLanguage === targetLanguage) {
                const result = {
                    originalText: text,
                    translatedText: text,
                    sourceLanguage: detectedSourceLanguage,
                    targetLanguage,
                    confidence: 1.0,
                };
                cacheService_1.cacheService.set(cacheKey, result);
                return result;
            }
            // Perform translation
            const translatedText = await this.performTranslation(text, detectedSourceLanguage, targetLanguage);
            const result = {
                originalText: text,
                translatedText,
                sourceLanguage: detectedSourceLanguage,
                targetLanguage,
                confidence: 0.95,
            };
            // Cache the result
            cacheService_1.cacheService.set(cacheKey, result);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Translation failed', error);
            throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Translate multiple texts at once
     */
    async translateBatch(texts, targetLanguage, sourceLanguage) {
        const promises = texts.map(text => this.translate(text, targetLanguage, sourceLanguage));
        return Promise.all(promises);
    }
    /**
     * Detect the language of the given text
     */
    async detectLanguage(text) {
        // Simple language detection logic
        // In production, you would use a proper language detection API
        const koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
        const japanesePattern = /[ひらがな|カタカナ|漢字]/;
        const chinesePattern = /[一-龯]/;
        const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        if (koreanPattern.test(text)) {
            return 'ko';
        }
        if (japanesePattern.test(text)) {
            return 'ja';
        }
        if (chinesePattern.test(text)) {
            return 'zh';
        }
        if (vietnamesePattern.test(text)) {
            return 'vi';
        }
        return 'en'; // Default to English
    }
    /**
     * Check if language is supported
     */
    isLanguageSupported(language) {
        return this.config.supportedLanguages.includes(language);
    }
    /**
     * Get all supported languages
     */
    getSupportedLanguages() {
        return [...this.config.supportedLanguages];
    }
    /**
     * Perform the actual translation using Gemini API v1 (direct HTTP call)
     */
    async performTranslation(text, sourceLanguage, targetLanguage) {
        if (!this.apiKey) {
            throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY environment variable in .env file.');
        }
        try {
            // 언어 코드 매핑
            const languageNames = {
                en: 'English',
                ko: 'Korean',
                ja: 'Japanese',
                zh: 'Chinese',
                vi: 'Vietnamese',
            };
            const sourceLangName = languageNames[sourceLanguage];
            const targetLangName = languageNames[targetLanguage];
            // 부동산 용어 사전 프롬프트 (베트남어 -> 한국어인 경우)
            const realEstatePrompt = sourceLanguage === 'vi' && targetLanguage === 'ko'
                ? (0, translationTerms_1.getRealEstateTermsPrompt)() + '\n\n'
                : '';
            const prompt = `${realEstatePrompt}다음 텍스트를 ${sourceLangName}에서 ${targetLangName}로 번역해주세요. 
번역할 때 원문의 의미와 톤을 정확히 유지해주세요.

원문:
${text}

번역:`;
            logger_1.logger.debug('Calling Gemini API v1 (direct HTTP)', { sourceLanguage, targetLanguage, textLength: text.length });
            // First, try to get available models
            let availableModels = [];
            try {
                const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`;
                const listResponse = await fetch(listUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (listResponse.ok) {
                    const listData = await listResponse.json();
                    if (listData.models) {
                        availableModels = listData.models
                            .map((m) => { var _a; return ((_a = m.name) === null || _a === void 0 ? void 0 : _a.replace('models/', '')) || m.name; })
                            .filter((name) => name && name.includes('gemini'));
                        logger_1.logger.debug('Available models', { models: availableModels });
                    }
                }
            }
            catch (e) {
                logger_1.logger.debug('Could not fetch model list', { error: e });
            }
            // Direct HTTP call to Gemini API v1
            // Try different model names (prioritize available models if found)
            const defaultModels = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
            const modelNames = availableModels.length > 0 ? availableModels : defaultModels;
            let lastError = null;
            for (const modelName of modelNames) {
                try {
                    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${this.apiKey}`;
                    const requestBody = {
                        contents: [{
                                parts: [{
                                        text: prompt
                                    }]
                            }]
                    };
                    logger_1.logger.debug(`Trying model: ${modelName}`);
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                    });
                    if (response.ok) {
                        logger_1.logger.debug(`✅ Successfully using model: ${modelName}`);
                        const data = await response.json();
                        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
                            logger_1.logger.error('Invalid Gemini API response', data);
                            throw new Error('Invalid response format from Gemini API');
                        }
                        let translatedText = data.candidates[0].content.parts[0].text.trim();
                        // 부동산 용어 사전 적용 (베트남어 -> 한국어인 경우)
                        if (sourceLanguage === 'vi' && targetLanguage === 'ko') {
                            translatedText = (0, translationTerms_1.applyRealEstateTerms)(translatedText, 'ko');
                        }
                        logger_1.logger.debug('Translation completed', {
                            originalLength: text.length,
                            translatedLength: translatedText.length,
                            model: modelName
                        });
                        return translatedText;
                    }
                    else {
                        const errorText = await response.text();
                        lastError = new Error(`Model ${modelName}: ${response.status} ${response.statusText}`);
                        logger_1.logger.debug(`Model ${modelName} failed (${response.status}), trying next...`);
                        continue;
                    }
                }
                catch (error) {
                    lastError = error instanceof Error ? error : new Error('Unknown error');
                    logger_1.logger.debug(`Model ${modelName} error, trying next...`, { error: lastError.message });
                    continue;
                }
            }
            // All models failed
            logger_1.logger.error('All Gemini models failed', { models: modelNames, lastError: lastError === null || lastError === void 0 ? void 0 : lastError.message });
            throw new Error(`All models failed. Last error: ${(lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Unknown error'}`);
        }
        catch (error) {
            logger_1.logger.error('Gemini API error', error);
            throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.TranslationService = TranslationService;
exports.default = TranslationService;
//# sourceMappingURL=translationService.js.map