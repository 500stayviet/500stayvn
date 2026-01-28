import axios from "axios";

export type SupportedLanguage = "en" | "ko" | "vi" | "ja" | "zh";

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

// Gemini API 설정
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// 언어 코드 매핑 (Gemini API용)
const LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  en: "English",
  ko: "Korean",
  vi: "Vietnamese",
  ja: "Japanese",
  zh: "Chinese",
};

// 번역 캐시 (메모리 캐시, 실제 구현에서는 DB나 Redis 사용 권장)
const translationCache = new Map<string, TranslationResponse>();

// 캐시 키 생성
function getCacheKey(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage,
): string {
  return `${text}|${sourceLanguage || "auto"}|${targetLanguage}`;
}

// 안전한 언어 이름 가져오기
function getLanguageName(language: SupportedLanguage | undefined): string {
  if (!language) return "auto-detect";
  return LANGUAGE_MAP[language] || "auto-detect";
}

/**
 * Gemini AI를 사용한 번역 함수
 * 사용자가 번역 버튼을 클릭할 때만 호출되도록 설계
 */
export async function translate(
  text: string,
  targetLanguage: SupportedLanguage,
  sourceLanguage?: SupportedLanguage,
): Promise<TranslationResponse> {
  // 빈 텍스트 검증
  if (!text || !text.trim()) {
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: sourceLanguage || "vi",
      targetLanguage,
    };
  }

  // API 키 확인
  if (!GEMINI_API_KEY) {
    console.warn(
      "Gemini API 키가 설정되지 않았습니다. 번역 기능이 제한됩니다.",
    );
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: sourceLanguage || "vi",
      targetLanguage,
    };
  }

  // 캐시 확인
  const cacheKey = getCacheKey(text, targetLanguage, sourceLanguage);
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Gemini API 프롬프트 구성
    const sourceLangName = getLanguageName(sourceLanguage);
    const targetLangName = LANGUAGE_MAP[targetLanguage];

    const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. 
    Only return the translated text, nothing else.
    
    Text: "${text}"
    
    Translation:`;

    // Gemini API 호출
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      },
      {
        timeout: 15000, // 15초 타임아웃
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    // 응답 파싱
    const translatedText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    const result: TranslationResponse = {
      originalText: text,
      translatedText: translatedText,
      sourceLanguage: sourceLanguage || "vi",
      targetLanguage,
      confidence: 0.9, // Gemini는 confidence score를 제공하지 않으므로 기본값
    };

    // 캐시 저장 (최대 100개 항목 유지)
    if (translationCache.size >= 100) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey) {
        translationCache.delete(firstKey);
      }
    }
    translationCache.set(cacheKey, result);

    return result;
  } catch (error) {
    // 에러 처리
    console.error("Gemini API 번역 오류:", error);

    // 네트워크 에러나 타임아웃 시 원문 반환
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
        return {
          originalText: text,
          translatedText: text,
          sourceLanguage: sourceLanguage || "vi",
          targetLanguage,
        };
      }
    }

    // 기타 오류도 원문 반환
    return {
      originalText: text,
      translatedText: text,
      sourceLanguage: sourceLanguage || "vi",
      targetLanguage,
    };
  }
}

