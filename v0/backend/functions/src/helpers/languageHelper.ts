import { SupportedLanguage } from '../types/translation.types';
import { LANGUAGE_NAMES } from '../utils/constants';

/**
 * Language helper functions
 */
export class LanguageHelper {
  /**
   * Get language name from code
   */
  static getLanguageName(code: SupportedLanguage): string {
    return LANGUAGE_NAMES[code] || code;
  }

  /**
   * Check if text contains specific language characters
   */
  static containsLanguage(text: string, language: SupportedLanguage): boolean {
    const patterns: Record<SupportedLanguage, RegExp> = {
      en: /[a-zA-Z]/,
      ko: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/,
      ja: /[ひらがな|カタカナ|漢字]/,
      zh: /[一-龯]/,
      vi: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
    };

    return patterns[language]?.test(text) || false;
  }

  /**
   * Get language code from locale string
   */
  static getLanguageFromLocale(locale: string): SupportedLanguage {
    const langCode = locale.split('-')[0].toLowerCase();
    const supportedLanguages: SupportedLanguage[] = ['en', 'ko', 'ja', 'zh', 'vi'];

    if (supportedLanguages.includes(langCode as SupportedLanguage)) {
      return langCode as SupportedLanguage;
    }

    return 'en'; // Default
  }
}
