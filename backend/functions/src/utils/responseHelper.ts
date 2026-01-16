import { Response } from 'express';
import { ApiResponse } from '../types/api.types';

/**
 * Response helper utilities
 */
export class ResponseHelper {
  /**
   * Send success response
   */
  static success<T>(res: Response, data: T, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
    };
    res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string,
    code: string,
    statusCode: number = 500
  ): void {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        code,
      },
    };
    res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    pageSize: number
  ): void {
    const response = {
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
    res.status(200).json(response);
  }
}
