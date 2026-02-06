import { SupportedLanguage } from './translation.types';

/**
 * Translation service configuration
 */
export interface TranslationConfig {
  defaultLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  apiKey: string;
  apiEndpoint?: string;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port?: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
