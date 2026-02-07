"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationHelper = void 0;
/**
 * Validation helper functions
 */
class ValidationHelper {
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate URL format
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    /**
     * Validate phone number (basic)
     */
    static isValidPhoneNumber(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }
    /**
     * Validate UUID format
     */
    static isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    /**
     * Validate JSON string
     */
    static isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.ValidationHelper = ValidationHelper;
//# sourceMappingURL=validationHelper.js.map