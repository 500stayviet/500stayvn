import { SupportedLanguage } from '../types/translation.types';
import { ValidationError } from './errorHandler';

/**
 * Validation utility functions
 */
export class Validator {
  static validateText(text: string): void {
    if (!text || typeof text !== 'string') {
      throw new ValidationError('Text must be a non-empty string');
    }

    if (text.trim().length === 0) {
      throw new ValidationError('Text cannot be empty or only whitespace');
    }

    if (text.length > 10000) {
      throw new ValidationError('Text exceeds maximum length of 10000 characters');
    }
  }

  static validateLanguage(language: string, supportedLanguages: SupportedLanguage[]): void {
    if (!language || typeof language !== 'string') {
      throw new ValidationError('Language must be a non-empty string');
    }

    if (!supportedLanguages.includes(language as SupportedLanguage)) {
      throw new ValidationError(`Language ${language} is not supported`);
    }
  }

  static validateTranslationRequest(data: any): {
    text: string;
    targetLanguage: SupportedLanguage;
    sourceLanguage?: SupportedLanguage;
  } {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Request body must be an object');
    }

    if (!data.text) {
      throw new ValidationError('Text is required');
    }

    if (!data.targetLanguage) {
      throw new ValidationError('Target language is required');
    }

    this.validateText(data.text);

    return {
      text: data.text,
      targetLanguage: data.targetLanguage,
      sourceLanguage: data.sourceLanguage,
    };
  }

  static validateBatchTranslationRequest(data: any): {
    texts: string[];
    targetLanguage: SupportedLanguage;
    sourceLanguage?: SupportedLanguage;
  } {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Request body must be an object');
    }

    if (!Array.isArray(data.texts)) {
      throw new ValidationError('Texts must be an array');
    }

    if (data.texts.length === 0) {
      throw new ValidationError('Texts array cannot be empty');
    }

    if (data.texts.length > 100) {
      throw new ValidationError('Maximum 100 texts allowed per batch');
    }

    if (!data.targetLanguage) {
      throw new ValidationError('Target language is required');
    }

    data.texts.forEach((text: string, index: number) => {
      try {
        this.validateText(text);
      } catch (error) {
        throw new ValidationError(`Text at index ${index} is invalid: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return {
      texts: data.texts,
      targetLanguage: data.targetLanguage,
      sourceLanguage: data.sourceLanguage,
    };
  }
}
