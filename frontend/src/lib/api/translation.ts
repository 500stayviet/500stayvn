import axios from 'axios';
import { FIREBASE_FUNCTIONS } from '../firebase-config';

export type SupportedLanguage = 'en' | 'ko' | 'vi';

export interface TranslationRequest {
  text: string;
  sourceLanguage?: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  confidence?: number;
}

export interface BatchTranslationRequest {
  texts: string[];
  sourceLanguage?: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

export interface BatchTranslationResponse {
  translations: TranslationResponse[];
}

export async function translate(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<TranslationResponse> {
  // 빈 텍스트 검증
  if (!text || !text.trim()) {
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: sourceLanguage || 'vi',
      targetLanguage,
    };
  }

  if (!FIREBASE_FUNCTIONS.translate || !FIREBASE_FUNCTIONS.translate.startsWith('http')) {
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: sourceLanguage || 'vi',
      targetLanguage,
    };
  }

  try {
    const response = await axios.post<TranslationResponse>(
      FIREBASE_FUNCTIONS.translate,
      {
        text,
        sourceLanguage,
        targetLanguage,
      },
      {
        timeout: 10000, // 10초 타임아웃
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    // 네트워크 에러나 타임아웃 시 원문 반환 (앱이 중단되지 않도록)
    if (axios.isAxiosError(error)) {
      // 네트워크 에러나 서버 오류는 조용히 처리 (앱이 정상 작동하도록)
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || (error.response && error.response.status >= 500)) {
        // 원문 반환 (콘솔 오류 없이)
        return {
          originalText: text,
          translatedText: text,
          sourceLanguage: sourceLanguage || 'vi',
          targetLanguage,
        };
      }
      // 기타 API 오류도 원문 반환 (앱 중단 방지)
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: sourceLanguage || 'vi',
        targetLanguage,
      };
    }
    // 예상치 못한 오류는 원문 반환
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: sourceLanguage || 'vi',
      targetLanguage,
    };
  }
}

export async function translateBatch(
  texts: string[],
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage
): Promise<BatchTranslationResponse> {
  try {
    const response = await axios.post<BatchTranslationResponse>(
      FIREBASE_FUNCTIONS.translateBatch,
      {
        texts,
        sourceLanguage,
        targetLanguage,
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Batch translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  try {
    const response = await axios.post<{ language: SupportedLanguage }>(
      FIREBASE_FUNCTIONS.detectLanguage,
      { text }
    );
    return response.data.language;
  } catch (error) {
    throw new Error(
      `Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getSupportedLanguages(): Promise<SupportedLanguage[]> {
  try {
    const response = await axios.get<{ languages: SupportedLanguage[] }>(
      FIREBASE_FUNCTIONS.getSupportedLanguages
    );
    return response.data.languages;
  } catch (error) {
    throw new Error(
      `Get supported languages failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
