import { Request, Response, NextFunction } from 'express';
import { rateLimitService } from '../services/rateLimitService';
import { logger } from '../utils/logger';

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Convert clientId to string (handle string | string[] type)
  const rawClientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const clientId = Array.isArray(rawClientId) ? rawClientId[0] : rawClientId.toString();
  const limit = 100; // requests per minute
  const window = 60000; // 1 minute

  if (!rateLimitService.isAllowed(clientId, limit, window)) {
    logger.warn('Rate limit exceeded', { clientId });
    res.status(429).json({
      error: {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
    return;
  }

  const remaining = rateLimitService.getRemaining(clientId, limit);
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  next();
};
