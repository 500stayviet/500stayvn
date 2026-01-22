"use strict";
/**
 * Cache service for translation results
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
class CacheService {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 3600000; // 1 hour in milliseconds
    }
    /**
     * Get value from cache
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    /**
     * Set value in cache
     */
    set(key, value, ttl) {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, { value, expiresAt });
    }
    /**
     * Delete value from cache
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Generate cache key for translation
     */
    generateTranslationKey(text, sourceLanguage, targetLanguage) {
        return `translation:${sourceLanguage}:${targetLanguage}:${this.hashText(text)}`;
    }
    /**
     * Hash text for cache key
     */
    hashText(text) {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cacheService.js.map