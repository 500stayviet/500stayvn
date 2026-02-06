import { Router } from 'express';
import { TranslationController } from '../controllers/translationController';
import { corsMiddleware } from '../middleware/cors';
import { errorMiddleware } from '../middleware/errorMiddleware';

const router = Router();

// Apply CORS middleware
router.use(corsMiddleware);

/**
 * Translation routes
 */
router.post('/translate', TranslationController.translate);
router.post('/translateBatch', TranslationController.translateBatch);
router.post('/detectLanguage', TranslationController.detectLanguage);
router.get('/supportedLanguages', TranslationController.getSupportedLanguages);

// Error handling middleware
router.use(errorMiddleware);

export default router;
