"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageHelper = void 0;
const constants_1 = require("../utils/constants");
/**
 * Language helper functions
 */
class LanguageHelper {
    /**
     * Get language name from code
     */
    static getLanguageName(code) {
        return constants_1.LANGUAGE_NAMES[code] || code;
    }
    /**
     * Check if text contains specific language characters
     */
    static containsLanguage(text, language) {
        var _a;
        const patterns = {
            en: /[a-zA-Z]/,
            ko: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/,
            ja: /[ひらがな|カタカナ|漢字]/,
            zh: /[一-龯]/,
            vi: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
        };
        return ((_a = patterns[language]) === null || _a === void 0 ? void 0 : _a.test(text)) || false;
    }
    /**
     * Get language code from locale string
     */
    static getLanguageFromLocale(locale) {
        const langCode = locale.split('-')[0].toLowerCase();
        const supportedLanguages = ['en', 'ko', 'ja', 'zh', 'vi'];
        if (supportedLanguages.includes(langCode)) {
            return langCode;
        }
        return 'en'; // Default
    }
}
exports.LanguageHelper = LanguageHelper;
//# sourceMappingURL=languageHelper.js.map