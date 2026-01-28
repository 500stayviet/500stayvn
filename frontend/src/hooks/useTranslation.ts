import { useState, useEffect, useCallback, useRef } from 'react';
import { translate, SupportedLanguage } from '@/lib/api/translation';

interface TranslationState {
  original: string;
  translated: string;
  loading: boolean;
  error: Error | null;
}

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

  // 이전 값 추적 (무한 루프 방지)
  const prevValuesRef = useRef({
    text: '',
    targetLanguage: '' as SupportedLanguage,
    sourceLanguage: undefined as SupportedLanguage | undefined,
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

    // 이미 로딩 중이면 중복 실행 방지
    if (state.loading) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await translate(text, targetLanguage, sourceLanguage);
      setState({
        original: result.originalText,
        translated: result.translatedText || result.originalText,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        original: text,
        translated: text,
        loading: false,
        error: err instanceof Error ? err : new Error('Translation failed'),
      });
    }
  }, [text, targetLanguage, sourceLanguage, state.loading]);

  // 텍스트나 언어가 변경되면 자동으로 번역 (무한 루프 방지)
  useEffect(() => {
    const prevValues = prevValuesRef.current;
    
    // 값이 변경되었을 때만 번역 실행
    const hasChanged = 
      prevValues.text !== text ||
      prevValues.targetLanguage !== targetLanguage ||
      prevValues.sourceLanguage !== sourceLanguage;

    if (hasChanged && text.trim()) {
      // 값 업데이트
      prevValuesRef.current = { text, targetLanguage, sourceLanguage };
      
      // 약간의 지연 후 번역 실행 (빠른 연속 변경 방지)
      const timer = setTimeout(() => {
        translateText();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [text, targetLanguage, sourceLanguage, translateText]);

  return {
    translated: state.translated,
    loading: state.loading,
    error: state.error,
    retry: translateText,
  };
}
