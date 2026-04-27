import type { SupportedLanguage } from '@/lib/api/translation';

/** `LanguageContext`와 동일한 키 — 비 React 코드에서 UI 언어를 읽을 때 사용 */
export const UI_LANGUAGE_STORAGE_KEY = 'stayviet_language';

const ALLOWED: readonly SupportedLanguage[] = ['ko', 'vi', 'en', 'ja', 'zh'];

/**
 * localStorage에 저장된 UI 언어 (없거나 유효하지 않으면 `en`).
 * SSR/비브라우저에서는 항상 `en`.
 */
export function readStoredUiLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    if (raw && (ALLOWED as readonly string[]).includes(raw)) {
      return raw as SupportedLanguage;
    }
  } catch {
    /* private mode, quota, etc. */
  }
  return 'en';
}
