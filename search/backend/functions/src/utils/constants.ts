import { SupportedLanguage } from '../types/translation.types';

/**
 * Application constants
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'ko', 'ja', 'zh', 'vi'];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  zh: 'Chinese',
  vi: 'Vietnamese',
};

export const MAX_TEXT_LENGTH = 10000;
export const MAX_BATCH_SIZE = 100;
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const API_ENDPOINTS = {
  TRANSLATE: '/translate',
  TRANSLATE_BATCH: '/translateBatch',
  DETECT_LANGUAGE: '/detectLanguage',
  SUPPORTED_LANGUAGES: '/supportedLanguages',
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  LANGUAGE_NOT_SUPPORTED: 'LANGUAGE_NOT_SUPPORTED',
  TRANSLATION_FAILED: 'TRANSLATION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;
