import { logger } from './logger';

/**
 * Custom error classes
 */
export class TranslationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

export class ValidationError extends TranslationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class LanguageNotSupportedError extends TranslationError {
  constructor(language: string) {
    super(
      `Language ${language} is not supported`,
      'LANGUAGE_NOT_SUPPORTED',
      400
    );
    this.name = 'LanguageNotSupportedError';
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  static handle(error: unknown): { message: string; code: string; statusCode: number } {
    if (error instanceof TranslationError) {
      logger.error('Translation error:', error);
      return {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      };
    }

    if (error instanceof Error) {
      logger.error('Unexpected error:', error);
      return {
        message: error.message,
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      };
    }

    logger.error('Unknown error:', error);
    return {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    };
  }
}
