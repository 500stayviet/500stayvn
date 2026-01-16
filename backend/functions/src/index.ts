import * as functions from 'firebase-functions';
import { TranslationService } from './services/translationService';
import { TranslationResponse } from './types/translation.types';
import { Validator } from './utils/validator';
import { ErrorHandler } from './utils/errorHandler';
import { logger } from './utils/logger';

/**
 * Firebase Cloud Function for translation
 */
export const translate = functions.https.onRequest(async (request, response) => {
  try {
    const validatedData = Validator.validateTranslationRequest(request.body);
    
    const translationService = new TranslationService();
    const result: TranslationResponse = await translationService.translate(
      validatedData.text,
      validatedData.targetLanguage,
      validatedData.sourceLanguage
    );

    logger.info('Translation successful', {
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
    });

    response.status(200).json(result);
  } catch (error) {
    const errorResponse = ErrorHandler.handle(error);
    logger.error('Translation error', error);
    response.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.message,
        code: errorResponse.code,
      },
    });
  }
});

/**
 * Firebase Cloud Function for batch translation
 */
export const translateBatch = functions.https.onRequest(async (request, response) => {
  try {
    const validatedData = Validator.validateBatchTranslationRequest(request.body);

    const translationService = new TranslationService();
    const results: TranslationResponse[] = await translationService.translateBatch(
      validatedData.texts,
      validatedData.targetLanguage,
      validatedData.sourceLanguage
    );

    logger.info('Batch translation successful', {
      count: results.length,
      targetLanguage: validatedData.targetLanguage,
    });

    response.status(200).json({ results });
  } catch (error) {
    const errorResponse = ErrorHandler.handle(error);
    logger.error('Batch translation error', error);
    response.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.message,
        code: errorResponse.code,
      },
    });
  }
});

/**
 * Firebase Cloud Function for language detection
 */
export const detectLanguage = functions.https.onRequest(async (request, response) => {
  try {
    if (!request.body.text) {
      response.status(400).json({
        error: {
          message: 'Text is required',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    Validator.validateText(request.body.text);

    const translationService = new TranslationService();
    const detectedLanguage = await translationService.detectLanguage(request.body.text);

    logger.info('Language detection successful', { detectedLanguage });

    response.status(200).json({
      language: detectedLanguage,
      text: request.body.text,
    });
  } catch (error) {
    const errorResponse = ErrorHandler.handle(error);
    logger.error('Language detection error', error);
    response.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.message,
        code: errorResponse.code,
      },
    });
  }
});

/**
 * Firebase Cloud Function for getting supported languages
 */
export const getSupportedLanguages = functions.https.onRequest(async (request, response) => {
  try {
    const translationService = new TranslationService();
    const languages = translationService.getSupportedLanguages();

    response.status(200).json({ languages });
  } catch (error) {
    const errorResponse = ErrorHandler.handle(error);
    logger.error('Get supported languages error', error);
    response.status(errorResponse.statusCode).json({
      error: {
        message: errorResponse.message,
        code: errorResponse.code,
      },
    });
  }
});
