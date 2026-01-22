"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringHelper = void 0;
/**
 * String helper functions
 */
class StringHelper {
    /**
     * Truncate string to max length
     */
    static truncate(text, maxLength, suffix = '...') {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - suffix.length) + suffix;
    }
    /**
     * Remove extra whitespace
     */
    static normalizeWhitespace(text) {
        return text.replace(/\s+/g, ' ').trim();
    }
    /**
     * Check if string is empty or only whitespace
     */
    static isEmpty(text) {
        return !text || text.trim().length === 0;
    }
    /**
     * Count words in text
     */
    static countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    /**
     * Escape special characters
     */
    static escape(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
exports.StringHelper = StringHelper;
//# sourceMappingURL=stringHelper.js.map