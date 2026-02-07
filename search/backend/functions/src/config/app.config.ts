import { getEnvironmentConfig } from './environment';
import { getDatabaseConfig } from './database';

/**
 * Application configuration
 */
export const appConfig = {
  environment: getEnvironmentConfig(),
  database: getDatabaseConfig(),
  translation: {
    apiKey: process.env.TRANSLATION_API_KEY || '',
    apiEndpoint: process.env.TRANSLATION_API_ENDPOINT || '',
    timeout: process.env.TRANSLATION_TIMEOUT
      ? parseInt(process.env.TRANSLATION_TIMEOUT, 10)
      : 30000,
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100,
    window: process.env.RATE_LIMIT_WINDOW
      ? parseInt(process.env.RATE_LIMIT_WINDOW, 10)
      : 60000,
  },
};
