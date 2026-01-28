"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/contexts/TranslationProvider';
import { SupportedLanguage } from '@/lib/api/translation';
import { useLanguage } from '@/contexts/LanguageContext';

// 동의 상태 저장 키
const CONSENT_STORAGE_KEY = 'translation_consent_given';
const LANGUAGE_PACK_CONSENT_KEY = 'language_pack_consent_given';

// 번역 토글 상태
interface TranslationToggleState {
  // 기본 상태
  isTranslated: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // 콘텐츠
  originalText: string;
  translatedText: string | null;
  
  // 언어 정보
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  
  // 동의 상태
  hasConsent: boolean;
  hasLanguagePackConsent: boolean;
  
  // 엔진 정보
  engine: string;
}

// 훅 옵션
interface UseTranslationToggleOptions {
  // 기본 텍스트 (베트남어 원문)
  text: string;
  
  // 소스 언어 (기본값: 'vi' - 베트남어)
  sourceLanguage?: SupportedLanguage;
  
  // 타겟 언어 (기본값: 사용자 설정 언어)
  targetLanguage?: SupportedLanguage;
  
  // 자동 번역 여부 (기본값: false - 버튼 클릭 시만 번역)
  autoTranslate?: boolean;
  
  // 캐시 키 (동일 텍스트에 대한 중복 번역 방지)
  cacheKey?: string;
}

// 동의 모달 콜백
interface ConsentCallbacks {
  onConsentGiven?: () => void;
  onConsentDenied?: () => void;
  onLanguagePackConsentGiven?: () => void;
  onLanguagePackConsentDenied?: () => void;
}

export const useTranslationToggle = (
  options: UseTranslationToggleOptions,
  callbacks?: ConsentCallbacks
) => {
  const { text, sourceLanguage = 'vi', targetLanguage: propTargetLanguage, autoTranslate = false, cacheKey } = options;
  
  // 컨텍스트 훅
  const translationContext = useTranslation();
  const { currentLanguage } = useLanguage();
  
  // 타겟 언어 결정: prop > 사용자 설정 언어 > 한국어
  const targetLanguage = propTargetLanguage || currentLanguage || 'ko';
  
  // 상태
  const [state, setState] = useState<TranslationToggleState>({
    isTranslated: false,
    isLoading: false,
    error: null,
    originalText: text,
    translatedText: null,
    sourceLanguage,
    targetLanguage,
    hasConsent: false,
    hasLanguagePackConsent: false,
    engine: translationContext.engine,
  });
  
  // 캐시
  const translationCache = useRef<Map<string, string>>(new Map());
  
  // 동의 상태 로드
  useEffect(() => {
    const loadConsent = () => {
      if (typeof window === 'undefined') return;
      
      const consent = localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
      const languagePackConsent = localStorage.getItem(LANGUAGE_PACK_CONSENT_KEY) === 'true';
      
      setState(prev => ({
        ...prev,
        hasConsent: consent,
        hasLanguagePackConsent: languagePackConsent,
      }));
    };
    
    loadConsent();
  }, []);
  
  // 텍스트 변경 감지
  useEffect(() => {
    setState(prev => ({
      ...prev,
      originalText: text,
      sourceLanguage,
      targetLanguage,
    }));
    
    // 캐시된 번역이 있으면 초기화
    if (cacheKey && translationCache.current.has(cacheKey)) {
      const cachedTranslation = translationCache.current.get(cacheKey);
      setState(prev => ({
        ...prev,
        translatedText: cachedTranslation || null,
      }));
    } else {
      setState(prev => ({
        ...prev,
        translatedText: null,
      }));
    }
  }, [text, sourceLanguage, targetLanguage, cacheKey]);
  
  // 자동 번역
  useEffect(() => {
    if (autoTranslate && state.hasConsent && state.hasLanguagePackConsent && text.trim()) {
      handleTranslate();
    }
  }, [autoTranslate, state.hasConsent, state.hasLanguagePackConsent, text]);
  
  // 동의 저장
  const saveConsent = useCallback((consent: boolean, isLanguagePack = false) => {
    if (typeof window === 'undefined') return;
    
    const key = isLanguagePack ? LANGUAGE_PACK_CONSENT_KEY : CONSENT_STORAGE_KEY;
    localStorage.setItem(key, consent.toString());
    
    setState(prev => ({
      ...prev,
      hasConsent: isLanguagePack ? prev.hasConsent : consent,
      hasLanguagePackConsent: isLanguagePack ? consent : prev.hasLanguagePackConsent,
    }));
    
    if (consent) {
      if (isLanguagePack) {
        callbacks?.onLanguagePackConsentGiven?.();
      } else {
        callbacks?.onConsentGiven?.();
      }
    } else {
      if (isLanguagePack) {
        callbacks?.onLanguagePackConsentDenied?.();
      } else {
        callbacks?.onConsentDenied?.();
      }
    }
    
    return consent;
  }, [callbacks]);
  
  // 번역 실행
  const handleTranslate = useCallback(async () => {
    // 빈 텍스트 체크
    if (!text.trim()) {
      setState(prev => ({
        ...prev,
        translatedText: text,
        isLoading: false,
      }));
      return;
    }
    
    // 이미 번역된 텍스트가 있으면 사용
    if (state.translatedText) {
      setState(prev => ({
        ...prev,
        isTranslated: true,
      }));
      return;
    }
    
    // 캐시 확인
    const cacheKeyToUse = cacheKey || `${text}|${sourceLanguage}|${targetLanguage}`;
    if (translationCache.current.has(cacheKeyToUse)) {
      const cached = translationCache.current.get(cacheKeyToUse);
      setState(prev => ({
        ...prev,
        isTranslated: true,
        translatedText: cached || null,
        isLoading: false,
      }));
      return;
    }
    
    // 동의 체크
    if (!state.hasConsent) {
      // 동의 모달을 표시해야 함 (컴포넌트에서 처리)
      return;
    }
    
    // 네이티브 환경에서 언어 팩 동의 체크
    if (translationContext.environment !== 'web' && !state.hasLanguagePackConsent) {
      // 언어 팩 다운로드 동의 모달 표시 (컴포넌트에서 처리)
      return;
    }
    
    // 번역 실행
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await translationContext.translate({
        text,
        sourceLanguage,
        targetLanguage,
      });
      
      // 캐시 저장
      translationCache.current.set(cacheKeyToUse, response.translatedText);
      
      // 상태 업데이트
      setState(prev => ({
        ...prev,
        isTranslated: true,
        translatedText: response.translatedText,
        isLoading: false,
        engine: response.engine,
      }));
    } catch (error) {
      console.error('Translation failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Translation failed'),
        isLoading: false,
        isTranslated: false,
      }));
    }
  }, [
    text,
    sourceLanguage,
    targetLanguage,
    cacheKey,
    state.hasConsent,
    state.hasLanguagePackConsent,
    state.translatedText,
    translationContext,
  ]);
  
  // 토글 함수
  const toggleTranslation = useCallback(async () => {
    // 현재 번역 상태가 아니면 번역 실행
    if (!state.isTranslated) {
      await handleTranslate();
    } else {
      // 이미 번역된 상태면 원문으로 토글
      setState(prev => ({
        ...prev,
        isTranslated: false,
      }));
    }
  }, [state.isTranslated, handleTranslate]);
  
  // 현재 표시할 텍스트
  const displayText = state.isTranslated && state.translatedText 
    ? state.translatedText 
    : state.originalText;
  
  // 번역 버튼 텍스트 (하드코딩)
  const buttonText = state.isLoading 
    ? (currentLanguage === 'ko' ? '번역 중...' : 
       currentLanguage === 'vi' ? 'Đang dịch...' : 
       currentLanguage === 'en' ? 'Translating...' : 
       currentLanguage === 'ja' ? '翻訳中...' : 
       '翻译中...') // zh
    : state.isTranslated 
      ? (currentLanguage === 'ko' ? '원문 보기' : 
         currentLanguage === 'vi' ? 'Xem bản gốc' : 
         currentLanguage === 'en' ? 'View Original' : 
         currentLanguage === 'ja' ? '原文を見る' : 
         '查看原文') // zh
      : (currentLanguage === 'ko' ? '번역하기' : 
         currentLanguage === 'vi' ? 'Xem bản dịch' : 
         currentLanguage === 'en' ? 'Translate' : 
         currentLanguage === 'ja' ? '翻訳する' : 
         '翻译'); // zh
  
  // 번역 가능 여부 (텍스트가 있고 소스/타겟 언어가 다를 때)
  const canTranslate = Boolean(
    text.trim() && 
    sourceLanguage !== targetLanguage &&
    translationContext.isInitialized
  );
  
  // 동의 모달 표시 필요 여부
  const showConsentModal = !state.hasConsent && canTranslate;
  const showLanguagePackModal = 
    translationContext.environment !== 'web' && 
    !state.hasLanguagePackConsent && 
    canTranslate;
  
  return {
    // 상태
    ...state,
    displayText,
    buttonText,
    canTranslate,
    
    // 모달 상태
    showConsentModal,
    showLanguagePackModal,
    
    // 함수
    toggleTranslation,
    handleTranslate,
    saveConsent,
    
    // 유틸리티
    isNative: translationContext.environment !== 'web',
    isWeb: translationContext.environment === 'web',
    environment: translationContext.environment,
  };
};

// 동의 모달 훅
export const useTranslationConsent = () => {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showLanguagePackModal, setShowLanguagePackModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const requestConsent = useCallback((action: () => void, isLanguagePack = false) => {
    setPendingAction(() => action);
    
    if (isLanguagePack) {
      setShowLanguagePackModal(true);
    } else {
      setShowConsentModal(true);
    }
  }, []);
  
  const handleConsent = useCallback((consent: boolean, isLanguagePack = false) => {
    if (isLanguagePack) {
      setShowLanguagePackModal(false);
    } else {
      setShowConsentModal(false);
    }
    
    if (consent && pendingAction) {
      pendingAction();
    }
    
    setPendingAction(null);
    return consent;
  }, [pendingAction]);
  
  return {
    showConsentModal,
    showLanguagePackModal,
    requestConsent,
    handleConsent,
  };
};