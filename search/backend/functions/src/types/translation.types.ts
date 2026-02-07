/**
 * Supported languages for translation
 */
export type SupportedLanguage = 'en' | 'ko' | 'ja' | 'zh' | 'vi';

/**
 * Translation request interface
 */
export interface TranslationRequest {
  text: string;
  targetLanguage: SupportedLanguage;
  sourceLanguage?: SupportedLanguage;
}

/**
 * Translation response interface
 */
export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  confidence: number;
}

/**
 * Batch translation request
 */
export interface BatchTranslationRequest {
  texts: string[];
  targetLanguage: SupportedLanguage;
  sourceLanguage?: SupportedLanguage;
}

/**
 * Language detection result
 */
export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
}
