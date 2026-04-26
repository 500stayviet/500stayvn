/**
 * AWS Location Service API (Next.js API Route를 통한 호출)
 * 
 * GrabMaps를 사용한 주소 검색 및 지오코딩 서비스
 * CORS 문제를 해결하기 위해 Next.js API Route를 통해 서버 사이드에서 호출
 */

import { SupportedLanguage } from './translation';

const API_BASE_URL = '/api/aws-location';

/** Geometry returned by AWS Location place search */
export type AwsPlaceGeometry = {
  Point?: [number, number];
};

export type AwsPlace = {
  Country?: string;
  Address?: { Country?: string };
  Label?: string;
  PlaceId?: string;
  placeId?: string;
  Geometry?: AwsPlaceGeometry;
};

export type AwsPlaceSearchResult = {
  Place?: AwsPlace;
  Label?: string;
  Country?: string;
};

/** Suggestion row after normalizing Text/label fields */
export type AwsSuggestionItem = AwsPlaceSearchResult & {
  Text: string;
  text: string;
  label: string;
  Label?: string;
  PlaceId?: string;
  placeId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeSuggestionItem(raw: unknown): AwsSuggestionItem {
  const item = isRecord(raw) ? raw : {};
  const text =
    (typeof item.Text === 'string' ? item.Text : undefined) ||
    (typeof item.text === 'string' ? item.text : undefined) ||
    (typeof item.Label === 'string' ? item.Label : undefined) ||
    (typeof item.label === 'string' ? item.label : undefined) ||
    '';
  return {
    ...(item as AwsPlaceSearchResult),
    Text: text,
    text: text,
    label: text,
    Label: text,
  };
}

/**
 * 주소 검색 (SearchPlaceIndexForText)
 * REST API를 사용한 구현
 * 
 * @param text - 검색할 주소 텍스트
 * @param language - 언어 코드 (기본값: 'vi')
 * @param biasPosition - 지도 중심점 좌표 (BiasPosition 설정용)
 * @returns 검색 결과 배열
 */
export async function searchPlaceIndexForText(
  text: string,
  language: SupportedLanguage = 'vi'
): Promise<AwsPlaceSearchResult[]> {
  try {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const locationLanguage = getLocationServiceLanguage(language);

    const requestBody = {
      action: 'search',
      text: text.trim(),
      language: locationLanguage,
    };

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // 403 에러 등 권한 문제 시 빈 배열 반환 (UI 깨짐 방지)
      if (response.status === 403 || response.status === 401) {
        // 콘솔 에러를 디버그 레벨로 변경하여 사용자에게 보이지 않도록
        console.debug(`AWS Location Service 권한 오류 (${response.status}): 검색 기능이 일시적으로 제한됩니다.`);
        return [];
      }
      
      const errorData = await response.json();
      throw new Error(`AWS Location Service API error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
    }

    const data = (await response.json()) as { Results?: AwsPlaceSearchResult[] };
    return data.Results ?? [];
  } catch (error) {
    // 네트워크 오류 등 예외 상황 시 빈 배열 반환
    console.warn('AWS Location Service 연결 오류:', error instanceof Error ? error.message : String(error));
    return []; // 빈 배열 반환하여 UI가 깨지지 않도록
  }
}

/**
 * 주소 자동완성 (SearchPlaceIndexForSuggestions)
 * REST API를 사용한 구현
 * 
 * @param text - 검색할 주소 텍스트
 * @param language - 언어 코드 (기본값: 'vi')
 * @returns 자동완성 제안 배열
 */
export async function searchPlaceIndexForSuggestions(
  text: string,
  language: SupportedLanguage = 'vi',
  biasPosition?: { lat: number; lng: number }
): Promise<AwsSuggestionItem[]> {
  try {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const locationLanguage = getLocationServiceLanguage(language);

    const requestBody: {
      action: string;
      text: string;
      language: string;
      latitude?: number;
      longitude?: number;
    } = {
      action: 'suggestions',
      text: text.trim(),
      language: locationLanguage,
    };

    // 거리 기반 가중치: 사용자 위치를 BiasPosition으로 전달
    if (biasPosition) {
      requestBody.latitude = biasPosition.lat;
      requestBody.longitude = biasPosition.lng;
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // 500 에러 등 서버 오류 시 빈 배열 반환 (사용자 경험 개선)
      if (response.status >= 500) {
        console.debug(`AWS Location Service 서버 오류 (${response.status}): 일시적인 문제입니다. 잠시 후 다시 시도해주세요.`);
        return []; // 빈 배열 반환하여 UI가 깨지지 않도록
      }
      
      // 403/401 에러도 여기서 처리
      if (response.status === 403 || response.status === 401) {
        console.debug(`AWS Location Service 권한 오류 (${response.status}): 검색 기능이 일시적으로 제한됩니다.`);
        return [];
      }
      
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      throw new Error(`AWS Location Service API error: ${response.status} - ${errorData.error || errorData.details || errorText || 'Unknown error'}`);
    }

    const data = (await response.json()) as {
      Suggestions?: unknown[];
      Results?: unknown[];
    };
    const rawData = data.Suggestions || data.Results || [];

    return rawData.map((item: unknown) => {
      // 디버깅: 원본 API 응답 데이터 로그
      console.log('🔍 Raw Place Data:', JSON.stringify(item, null, 2));

      return normalizeSuggestionItem(item);
    });
  } catch (error) {
    // 네트워크 오류 등 예외 상황 시 빈 배열 반환
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('AWS Location Service 연결 오류:', errorMessage);
    return []; // 빈 배열 반환하여 UI가 깨지지 않도록
  }
}

/**
 * 역 지오코딩 (SearchPlaceIndexForPosition)
 * 좌표를 주소로 변환
 * REST API를 사용한 구현
 * 
 * @param latitude - 위도
 * @param longitude - 경도
 * @param language - 언어 코드 (기본값: 'vi')
 * @returns 주소 정보
 */
export async function searchPlaceIndexForPosition(
  latitude: number,
  longitude: number,
  language: SupportedLanguage = 'vi'
): Promise<AwsPlaceSearchResult[]> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'position',
        latitude,
        longitude,
        language: getLocationServiceLanguage(language),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AWS Location Service API error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
    }

    const data = (await response.json()) as { Results?: AwsPlaceSearchResult[] };
    return data.Results ?? [];
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
}

/**
 * PlaceId를 이용한 상세 조회 (GetPlace)
 * PlaceId를 이용해 상세 주소 정보를 가져옴
 * 
 * @param placeId - Place ID
 * @param language - 언어 코드 (기본값: 'vi')
 * @returns 상세 주소 정보
 */
export async function getPlaceById(
  placeId: string,
  language: SupportedLanguage = 'vi'
): Promise<AwsPlace | null> {
  try {
    if (!placeId || placeId.trim().length === 0) {
      return null;
    }

    // PlaceId를 이용해 상세 조회 (searchPlaceIndexForText를 사용)
    // PlaceId를 텍스트로 사용하거나, 또는 PlaceId를 직접 조회
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getPlace',
        placeId: placeId.trim(),
        language: getLocationServiceLanguage(language),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AWS Location Service API error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
    }

    const data = (await response.json()) as {
      Place?: AwsPlace;
      Result?: AwsPlace;
    };
    return data.Place || data.Result || null;
  } catch (error) {
    console.error('Error getting place by ID:', error);
    throw error;
  }
}

/**
 * 언어 코드 변환
 * SupportedLanguage를 AWS Location Service 언어 코드로 변환
 */
export function getLocationServiceLanguage(language: SupportedLanguage): string {
  const languageMap: Record<string, string> = {
    ko: 'ko',
    vi: 'vi',
    en: 'en',
    ja: 'ja',
    zh: 'zh-CN',
  };
  return languageMap[language] || 'vi';
}
