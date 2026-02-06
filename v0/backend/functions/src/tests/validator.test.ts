import { Validator } from '../utils/validator';
import { ValidationError } from '../utils/errorHandler';

/**
 * Test suite for Validator
 */
describe('Validator', () => {
  describe('validateText', () => {
    it('should pass for valid text', () => {
      expect(() => Validator.validateText('Hello')).not.toThrow();
    });

    it('should throw for empty text', () => {
      expect(() => Validator.validateText('')).toThrow(ValidationError);
    });

    it('should throw for text exceeding max length', () => {
      const longText = 'a'.repeat(10001);
      expect(() => Validator.validateText(longText)).toThrow(ValidationError);
    });
  });

  describe('validateTranslationRequest', () => {
    it('should pass for valid request', () => {
      const request = {
        text: 'Hello',
        targetLanguage: 'ko',
      };
      expect(() => Validator.validateTranslationRequest(request)).not.toThrow();
    });

    it('should throw for missing text', () => {
      const request = {
        targetLanguage: 'ko',
      };
      expect(() => Validator.validateTranslationRequest(request)).toThrow(ValidationError);
    });
  });
});
