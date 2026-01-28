"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage } from '@/lib/api/translation';

// 환경 감지 타입
export type Environment = 'web' | 'ios' | 'android';

// 번역 엔진 타입
export type TranslationEngine = 'gemini' | 'apple' | 'mlkit';

// 번역 요청 인터페이스
export interface TranslationRequest {
  text: string;
  sourceLanguage?: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

// 번역 응답 인터페이스
export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  engine: TranslationEngine;
  confidence?: number;
}

// TranslationProvider 컨텍스트 타입
interface TranslationContextType {
  // 환경 정보
  environment: Environment;
  engine: TranslationEngine;
  
  // 번역 함수
  translate: (request: TranslationRequest) => Promise<TranslationResponse>;
  
  // 환경 감지 함수
  detectEnvironment: () => Environment;
  
  // 엔진 선택 함수
  selectEngine: (env: Environment) => TranslationEngine;
  
  // 상태
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
}

// 기본 값
const defaultContext: TranslationContextType = {
  environment: 'web',
  engine: 'gemini',
  translate: async () => {
    throw new Error('TranslationProvider not initialized');
  },
  detectEnvironment: () => 'web',
  selectEngine: () => 'gemini',
  isInitialized: false,
  isLoading: false,
  error: null,
};

// 컨텍스트 생성
const TranslationContext = createContext<TranslationContextType>(defaultContext);

// 환경 감지 유틸리티
export const detectEnvironment = (): Environment => {
  // User-Agent 기반 환경 감지
  if (typeof window === 'undefined') return 'web';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // iOS WebView 감지
  const isIOSWebView = /(iphone|ipod|ipad).*applewebkit/.test(userAgent) && 
                      !/safari/.test(userAgent);
  
  // Android WebView 감지
  const isAndroidWebView = /android.*version\/\d+(\.\d+)*.*chrome\/\d+/.test(userAgent) &&
                          /wv/.test(userAgent);
  
  // React Native WebView 감지 (일반적인 패턴)
  const isReactNativeWebView = /react-native/.test(userAgent) || 
                              (typeof window !== 'undefined' && window.ReactNativeWebView !== undefined);
  
  // 네이티브 브릿지 확인 (사용자 정의 브릿지)
  const hasNativeBridge = typeof window.callNativeTranslation === 'function';
  
  if (isIOSWebView || (hasNativeBridge && /iphone|ipad|ipod/.test(userAgent))) {
    return 'ios';
  }
  
  if (isAndroidWebView || (hasNativeBridge && /android/.test(userAgent))) {
    return 'android';
  }
  
  if (isReactNativeWebView || hasNativeBridge) {
    // React Native 환경에서는 추가 정보 필요
    // 실제 구현에서는 네이티브 측에서 플랫폼 정보를 주입해야 함
    return 'web'; // 기본값
  }
  
  return 'web';
};

// 엔진 선택 함수
export const selectEngine = (environment: Environment): TranslationEngine => {
  switch (environment) {
    case 'ios':
      return 'apple';
    case 'android':
      return 'mlkit';
    case 'web':
    default:
      return 'gemini';
  }
};

// 네이티브 번역 브릿지 타입 정의
declare global {
  interface Window {
    callNativeTranslation?: (
      text: string,
      targetLang: string,
      sourceLang?: string
    ) => Promise<string>;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

// 네이티브 번역 호출 함수
const callNativeTranslation = async (
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage,
  engine: TranslationEngine = 'gemini'
): Promise<string> => {
  // 웹 환경에서는 Gemini API 사용
  if (engine === 'gemini') {
    const { translate } = await import('@/lib/api/translation');
    const result = await translate(text, targetLanguage, sourceLanguage);
    return result.translatedText;
  }
  
  // 네이티브 브릿지 호출
  if (typeof window.callNativeTranslation === 'function') {
    try {
      const translatedText = await window.callNativeTranslation(
        text,
        targetLanguage,
        sourceLanguage
      );
      return translatedText;
    } catch (error) {
      console.error('Native translation failed:', error);
      throw error;
    }
  }
  
  // React Native WebView 통신
  if (window.ReactNativeWebView) {
    return new Promise((resolve, reject) => {
      const requestId = Date.now().toString();
      
      // 요청 메시지 생성
      const request = {
        type: 'TRANSLATION_REQUEST',
        id: requestId,
        payload: {
          text,
          targetLanguage,
          sourceLanguage,
          engine,
        },
      };
      
      // 응답 핸들러
      const handleResponse = (event: MessageEvent) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          if (data.type === 'TRANSLATION_RESPONSE' && data.id === requestId) {
            window.removeEventListener('message', handleResponse);
            
            if (data.error) {
              reject(new Error(data.error));
            } else {
              resolve(data.payload.translatedText);
            }
          }
        } catch (error) {
          // 무시
        }
      };
      
      window.addEventListener('message', handleResponse);
      
      // 네이티브로 메시지 전송
      window.ReactNativeWebView.postMessage(JSON.stringify(request));
      
      // 타임아웃 설정 (10초)
      setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        reject(new Error('Translation timeout'));
      }, 10000);
    });
  }
  
  // 네이티브 브릿지가 없으면 Gemini로 폴백
  console.warn('Native bridge not available, falling back to Gemini');
  const { translate } = await import('@/lib/api/translation');
  const result = await translate(text, targetLanguage, sourceLanguage);
  return result.translatedText;
};

// TranslationProvider 컴포넌트
interface TranslationProviderProps {
  children: ReactNode;
  defaultEnvironment?: Environment;
  defaultEngine?: TranslationEngine;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  defaultEnvironment,
  defaultEngine,
}) => {
  const [environment, setEnvironment] = useState<Environment>('web');
  const [engine, setEngine] = useState<TranslationEngine>('gemini');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 초기화
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        
        // 환경 감지
        const detectedEnv = defaultEnvironment || detectEnvironment();
        setEnvironment(detectedEnv);
        
        // 엔진 선택
        const selectedEngine = defaultEngine || selectEngine(detectedEnv);
        setEngine(selectedEngine);
        
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Initialization failed'));
        console.error('TranslationProvider initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [defaultEnvironment, defaultEngine]);

  // 번역 함수
  const translate = async (request: TranslationRequest): Promise<TranslationResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { text, targetLanguage, sourceLanguage } = request;
      
      // 번역 실행
      const translatedText = await callNativeTranslation(
        text,
        targetLanguage,
        sourceLanguage,
        engine
      );
      
      const response: TranslationResponse = {
        originalText: text,
        translatedText,
        sourceLanguage: sourceLanguage || 'vi', // 기본값 베트남어
        targetLanguage,
        engine,
        confidence: 0.9, // 기본 confidence
      };
      
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Translation failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 컨텍스트 값
  const contextValue: TranslationContextType = {
    environment,
    engine,
    translate,
    detectEnvironment,
    selectEngine,
    isInitialized,
    isLoading,
    error,
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

// 커스텀 훅
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  
  return context;
};

// 환경 감지 훅
export const useEnvironment = () => {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useEnvironment must be used within TranslationProvider');
  }
  
  return {
    environment: context.environment,
    engine: context.engine,
    isNative: context.environment !== 'web',
    isWeb: context.environment === 'web',
  };
};