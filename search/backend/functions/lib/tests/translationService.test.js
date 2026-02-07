"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const translationService_1 = require("../services/translationService");
/**
 * Test suite for TranslationService
 */
describe('TranslationService', () => {
    let service;
    beforeEach(() => {
        service = new translationService_1.TranslationService();
    });
    describe('translate', () => {
        it('should translate text to target language', async () => {
            const result = await service.translate('Hello', 'ko');
            expect(result).toBeDefined();
            expect(result.targetLanguage).toBe('ko');
            expect(result.originalText).toBe('Hello');
        });
        it('should return original text if source and target languages are same', async () => {
            const result = await service.translate('Hello', 'en', 'en');
            expect(result.translatedText).toBe('Hello');
            expect(result.confidence).toBe(1.0);
        });
        it('should throw error for unsupported language', async () => {
            await expect(service.translate('Hello', 'fr')).rejects.toThrow();
        });
    });
    describe('detectLanguage', () => {
        it('should detect Korean text', async () => {
            const language = await service.detectLanguage('안녕하세요');
            expect(language).toBe('ko');
        });
        it('should detect English text', async () => {
            const language = await service.detectLanguage('Hello world');
            expect(language).toBe('en');
        });
    });
    describe('isLanguageSupported', () => {
        it('should return true for supported language', () => {
            expect(service.isLanguageSupported('ko')).toBe(true);
        });
        it('should return false for unsupported language', () => {
            expect(service.isLanguageSupported('fr')).toBe(false);
        });
    });
});
//# sourceMappingURL=translationService.test.js.map