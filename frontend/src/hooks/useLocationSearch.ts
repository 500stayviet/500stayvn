/**
 * 지역 검색 훅 (공통 로직)
 *
 * 메인/지도 등에서 동일한 검색 로직 사용.
 * 베트남 도시·구만 검색 (하드코딩 데이터).
 * 같은 이름의 구가 여러 도시에 있으면 "구, 도시" 형태로 구별해 표시.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { searchRegions, regionToSuggestion, RegionType } from '@/lib/data/vietnam-regions';

// ============================================================================
// 타입 정의
// ============================================================================
export interface LocationSuggestion {
  PlaceId: string;
  Text: string;
  Place?: {
    Geometry?: { Point?: number[] };
    Label?: string;
    Municipality?: string;
    District?: string;
    SubRegion?: string;
    Region?: string;
    Country?: string;
  };
  // 확장 필드
  isRegion?: boolean;
  regionType?: RegionType;
  isLandmark?: boolean;
  zoom?: number;
}

// 텍스트 정제 (행정 접두사 삭제)
const PATTERNS_TO_REMOVE = [
  /^TP\.\s*/i,
  /^Tp\s+/i,
  /^Thành\s+phố\s+/i,
  /^Thanh\s+pho\s+/i,
  /^Quận\s+/i,
  /^Quan\s+/i,
  /^Q\.\s*/i,
  /^Q\.?\s*(\d+)\s*/i,
  /^Huyện\s+/i,
  /^Huyen\s+/i,
  /^Phường\s+/i,
  /^Phuong\s+/i,
  /^P\.\s*/i,
  /^P\.?\s*(\d+)\s*/i,
  /^Xã\s+/i,
  /^Xa\s+/i,
];

export const cleanDisplayName = (text: string): string => {
  let result = text;
  for (const pattern of PATTERNS_TO_REMOVE) {
    result = result.replace(pattern, '');
  }
  return result.replace(/\s+/g, ' ').trim().replace(/^[-–,\s]+/, '').replace(/[-–,\s]+$/, '');
};

export const cleanSubAddress = (text: string, language?: string): string => {
  let result = text;
  result = result.replace(/^TP\.\s*/gi, '');
  result = result.replace(/^Tp\s+/gi, '');
  result = result.replace(/^Thành\s+phố\s+/gi, '');
  // "베트남"은 유지 (언어별 국가명 제거)
  result = result.replace(/,?\s*(Vietnam|Việt Nam|Viet Nam|베트남)\s*$/i, '');
  return result.replace(/\s+/g, ' ').trim().replace(/^,\s*/, '').replace(/,\s*$/, '').replace(/,\s*,/g, ',');
};

import { SupportedLanguage } from '@/lib/api/translation';

// ============================================================================
// useLocationSearch 훅
// ============================================================================
export function useLocationSearch(currentLanguage: SupportedLanguage) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');

  // 언어가 변경되면 기존 검색 결과 초기화 및 재검색
  useEffect(() => {
    // 이전 검색어가 있으면 재검색
    if (lastSearchRef.current) {
      const searchValue = lastSearchRef.current;
      // 약간의 지연 후 재검색 (상태 업데이트 완료 후)
      setTimeout(() => {
        performSearch(searchValue, currentLanguage);
      }, 100);
    }
  }, [currentLanguage]);

  const performSearch = async (value: string, language: string) => {
    try {
      setIsSearching(true);
      // 베트남 도시·구만 검색 (하드코딩 데이터). 같은 구명이 여러 도시에 있으면 "구, 도시"로 구별됨.
      const regionResults = searchRegions(value);
      const regionSuggestions: LocationSuggestion[] = regionResults.map(region =>
        regionToSuggestion(region, language) as LocationSuggestion
      );
      setSuggestions(regionSuggestions.slice(0, 10));
    } catch (error) {
      console.error('검색 오류:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const search = useCallback(async (value: string) => {
    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      lastSearchRef.current = '';
      return;
    }

    // 검색어 저장 (언어 변경 시 재검색용)
    lastSearchRef.current = value;

    // 디바운싱: 250ms 후 검색
    debounceTimerRef.current = setTimeout(async () => {
      await performSearch(value, currentLanguage);
    }, 250);
  }, [currentLanguage]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    lastSearchRef.current = '';
  }, []);

  return {
    suggestions,
    isSearching,
    search,
    clearSuggestions,
  };
}

// 뱃지 정보 가져오기
export function getSuggestionBadge(suggestion: LocationSuggestion, currentLanguage: SupportedLanguage) {
  if (suggestion.isRegion) {
    if (suggestion.regionType === 'city') {
      const text = {
        ko: '도시',
        vi: 'Thành phố',
        en: 'City',
        ja: '都市',
        zh: '城市'
      };
      return {
        text: text[currentLanguage] || text.en,
        color: 'bg-blue-600',
        icon: '🏙️',
      };
    } else {
      const text = {
        ko: '구/군',
        vi: 'Quận',
        en: 'District',
        ja: '区/郡',
        zh: '区/县'
      };
      return {
        text: text[currentLanguage] || text.en,
        color: 'bg-blue-500',
        icon: '📍',
      };
    }
  } else {
    const text = {
      ko: '명소',
      vi: 'Địa danh',
      en: 'Landmark',
      ja: '名所',
      zh: '景点'
    };
    return {
      text: text[currentLanguage] || text.en,
      color: 'bg-amber-500',
      icon: '⭐',
    };
  }
}
