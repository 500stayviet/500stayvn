"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("../utils/validator");
const errorHandler_1 = require("../utils/errorHandler");
/**
 * Test suite for Validator
 */
describe('Validator', () => {
    describe('validateText', () => {
        it('should pass for valid text', () => {
            expect(() => validator_1.Validator.validateText('Hello')).not.toThrow();
        });
        it('should throw for empty text', () => {
            expect(() => validator_1.Validator.validateText('')).toThrow(errorHandler_1.ValidationError);
        });
        it('should throw for text exceeding max length', () => {
            const longText = 'a'.repeat(10001);
            expect(() => validator_1.Validator.validateText(longText)).toThrow(errorHandler_1.ValidationError);
        });
    });
    describe('validateTranslationRequest', () => {
        it('should pass for valid request', () => {
            const request = {
                text: 'Hello',
                targetLanguage: 'ko',
            };
            expect(() => validator_1.Validator.validateTranslationRequest(request)).not.toThrow();
        });
        it('should throw for missing text', () => {
            const request = {
                targetLanguage: 'ko',
            };
            expect(() => validator_1.Validator.validateTranslationRequest(request)).toThrow(errorHandler_1.ValidationError);
        });
    });
});
//# sourceMappingURL=validator.test.js.map