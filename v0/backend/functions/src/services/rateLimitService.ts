/**
 * Rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimitService {
  private limits: Map<string, RateLimitEntry> = new Map();
  private defaultLimit: number = 100; // requests
  private defaultWindow: number = 60000; // 1 minute in milliseconds

  /**
   * Check if request is within rate limit
   */
  isAllowed(key: string, limit?: number, window?: number): boolean {
    const maxRequests = limit || this.defaultLimit;
    const windowMs = window || this.defaultWindow;
    const now = Date.now();

    const entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      // Create new entry or reset expired entry
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string, limit?: number): number {
    const maxRequests = limit || this.defaultLimit;
    const entry = this.limits.get(key);

    if (!entry) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.limits.clear();
  }
}

export const rateLimitService = new RateLimitService();
