"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const translationController_1 = require("../controllers/translationController");
const cors_1 = require("../middleware/cors");
const errorMiddleware_1 = require("../middleware/errorMiddleware");
const router = (0, express_1.Router)();
// Apply CORS middleware
router.use(cors_1.corsMiddleware);
/**
 * Translation routes
 */
router.post('/translate', translationController_1.TranslationController.translate);
router.post('/translateBatch', translationController_1.TranslationController.translateBatch);
router.post('/detectLanguage', translationController_1.TranslationController.detectLanguage);
router.get('/supportedLanguages', translationController_1.TranslationController.getSupportedLanguages);
// Error handling middleware
router.use(errorMiddleware_1.errorMiddleware);
exports.default = router;
//# sourceMappingURL=translationRoutes.js.map