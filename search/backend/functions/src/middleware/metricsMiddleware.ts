import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metricsService';

/**
 * Metrics collection middleware
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metricsService.timing('http_request_duration', duration, {
      method: req.method,
      path: req.path,
      statusCode: String(res.statusCode),
    });
    metricsService.increment('http_request_total', 1, {
      method: req.method,
      path: req.path,
      statusCode: String(res.statusCode),
    });
  });

  next();
};
