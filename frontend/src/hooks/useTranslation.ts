/**
 * useTranslation Hook
 * 
 * 언어 선택에 따라 실시간으로 번역을 가져오는 Hook
 * Firebase Functions의 translate API 사용
 */

import { useState, useEffect, useCallback } from 'react';
import { translate, SupportedLanguage } from '@/lib/api/translation';

/**
 * 번역 결과 타입
 */
interface TranslationState {
  original: string;
  translated: string;
  loading: boolean;
  error: Error | null;
}

/**
 * 텍스트를 실시간으로 번역하는 Hook
 * 
 * @param text - 번역할 텍스트 (베트남어)
 * @param targetLanguage - 목표 언어
 * @param sourceLanguage - 출발 언어 (선택, 자동 감지)
 * @returns { translated, loading, error, retry }
 */
export function useTranslation(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
) {
  const [state, setState] = useState<TranslationState>({
    original: text,
    translated: '',
    loading: false,
    error: null,
  });

  // 번역 실행 함수
  const translateText = useCallback(async () => {
    if (!text.trim()) {
      setState({
        original: text,
        translated: '',
        loading: false,
        error: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await translate(text, targetLanguage, sourceLanguage);
      setState({
        original: result.originalText,
        translated: result.translatedText || result.originalText, // 번역 실패 시 원문 사용
        loading: false,
        error: null,
      });
    } catch (err) {
      // 에러 발생 시에도 원문을 표시하여 앱이 중단되지 않도록 함
      setState({
        original: text,
        translated: text, // 에러 시 원문 반환
        loading: false,
        error: err instanceof Error ? err : new Error('Translation failed'),
      });
    }
  }, [text, targetLanguage, sourceLanguage]);

  // 텍스트나 언어가 변경되면 자동으로 번역
  useEffect(() => {
    translateText();
  }, [translateText]);

  return {
    translated: state.translated,
    loading: state.loading,
    error: state.error,
    retry: translateText,
  };
}
