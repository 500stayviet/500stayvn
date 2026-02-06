"use strict";
/**
 * Rate limiting service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitService = exports.RateLimitService = void 0;
class RateLimitService {
    constructor() {
        this.limits = new Map();
        this.defaultLimit = 100; // requests
        this.defaultWindow = 60000; // 1 minute in milliseconds
    }
    /**
     * Check if request is within rate limit
     */
    isAllowed(key, limit, window) {
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
    getRemaining(key, limit) {
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
    reset(key) {
        this.limits.delete(key);
    }
    /**
     * Clear all rate limits
     */
    clear() {
        this.limits.clear();
    }
}
exports.RateLimitService = RateLimitService;
exports.rateLimitService = new RateLimitService();
//# sourceMappingURL=rateLimitService.js.map