import { EnvironmentConfig } from '../types/config.types';

/**
 * Environment configuration
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const logLevel = (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error';

  return {
    nodeEnv,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    logLevel,
  };
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};
