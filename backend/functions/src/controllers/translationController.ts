import { Request, Response } from 'express';
import { TranslationService } from '../services/translationService';
import { Validator } from '../utils/validator';
import { ErrorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

const translationService = new TranslationService();

/**
 * Translation controller
 */
export class TranslationController {
  /**
   * Translate single text
   */
  static async translate(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = Validator.validateTranslationRequest(req.body);
      const result = await translationService.translate(
        validatedData.text,
        validatedData.targetLanguage,
        validatedData.sourceLanguage
      );

      logger.info('Translation successful', {
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
      });

      res.status(200).json(result);
    } catch (error) {
      const errorResponse = ErrorHandler.handle(error);
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
  static async translateBatch(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = Validator.validateBatchTranslationRequest(req.body);
      const results = await translationService.translateBatch(
        validatedData.texts,
        validatedData.targetLanguage,
        validatedData.sourceLanguage
      );

      logger.info('Batch translation successful', {
        count: results.length,
        targetLanguage: validatedData.targetLanguage,
      });

      res.status(200).json({ results });
    } catch (error) {
      const errorResponse = ErrorHandler.handle(error);
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
  static async detectLanguage(req: Request, res: Response): Promise<void> {
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

      Validator.validateText(req.body.text);
      const detectedLanguage = await translationService.detectLanguage(req.body.text);

      logger.info('Language detection successful', { detectedLanguage });

      res.status(200).json({
        language: detectedLanguage,
        text: req.body.text,
      });
    } catch (error) {
      const errorResponse = ErrorHandler.handle(error);
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
  static async getSupportedLanguages(req: Request, res: Response): Promise<void> {
    try {
      const languages = translationService.getSupportedLanguages();
      res.status(200).json({ languages });
    } catch (error) {
      const errorResponse = ErrorHandler.handle(error);
      res.status(errorResponse.statusCode).json({
        error: {
          message: errorResponse.message,
          code: errorResponse.code,
        },
      });
    }
  }
}
