/**
 * AWS Location Service API (Next.js API Route를 통한 호출)
 * 
 * GrabMaps를 사용한 주소 검색 및 지오코딩 서비스
 * CORS 문제를 해결하기 위해 Next.js API Route를 통해 서버 사이드에서 호출
 */

import { SupportedLanguage } from './translation';

const API_BASE_URL = '/api/aws-location';

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
): Promise<any[]> {
  try {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const requestBody: any = {
      action: 'search',
      text: text.trim(),
      language,
    };

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AWS Location Service API error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.Results || [];
  } catch (error) {
    console.error('Error searching place index:', error);
    throw error;
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
): Promise<any[]> {
  try {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const requestBody: any = {
      action: 'suggestions',
      text: text.trim(),
      language,
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
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      throw new Error(`AWS Location Service API error: ${response.status} - ${errorData.error || errorData.details || errorText || 'Unknown error'}`);
    }

    const data = await response.json();
    const rawData = data.Suggestions || data.Results || [];
    
    return rawData.map((item: any) => {
      // 디버깅: 원본 API 응답 데이터 로그
      console.log('🔍 Raw Place Data:', JSON.stringify(item, null, 2));
      
      const text = item.Text || item.text || item.Label || item.label || '';
      return {
        ...item,
        Text: text,
        text: text,
        label: text,
      };
    });
  } catch (error) {
    console.error('Error getting place suggestions:', error);
    throw error;
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
): Promise<any[]> {
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
        language,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AWS Location Service API error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.Results || [];
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
): Promise<any | null> {
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
        language,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`AWS Location Service API error: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
    }

    const data = await response.json();
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
