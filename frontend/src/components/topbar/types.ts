import type { SupportedLanguage } from '@/lib/api/translation';

export interface TopBarProps {
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  hideLanguageSelector?: boolean;
}
