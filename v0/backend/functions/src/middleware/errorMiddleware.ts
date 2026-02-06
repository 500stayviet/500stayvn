import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from '../utils/errorHandler';

/**
 * Error handling middleware
 */
export const errorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errorResponse = ErrorHandler.handle(error);

  res.status(errorResponse.statusCode).json({
    error: {
      message: errorResponse.message,
      code: errorResponse.code,
    },
  });
};
