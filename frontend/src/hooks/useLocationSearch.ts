/**
 * 지역/명소 검색 훅 (공통 로직)
 * 
 * GrabMapComponent와 HeroSection에서 동일한 검색 로직 사용
 * 
 * 3단계 우선순위:
 * 1순위: 도시 (City) - Ho Chi Minh, Hanoi, Da Nang
 * 2순위: 구/군 (District) - District 1, Binh Thanh
 * 3순위: 대표 명소 (Landmark) - Ben Thanh Market, Landmark 81
 * 
 * 아파트, 호텔, 상점, 은행 등 모든 POI 제외
 */

import { useState, useRef, useCallback } from 'react';
import { searchRegions, regionToSuggestion, RegionType, VietnamRegion } from '@/lib/data/vietnam-regions';
import { searchPlaceIndexForText } from '@/lib/api/aws-location';

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

// ============================================================================
// 대표 관광지/랜드마크 화이트리스트 (export하여 다른 컴포넌트에서도 사용)
// ============================================================================
export const FAMOUS_LANDMARKS: { name: string; nameKo?: string; nameVi?: string; priority: number }[] = [
  // 호치민 (HCMC)
  { name: 'landmark 81', nameKo: '랜드마크 81', nameVi: 'Landmark 81', priority: 500 },
  { name: 'bitexco', nameKo: '비텍스코 타워', nameVi: 'Bitexco Financial Tower', priority: 495 },
  { name: 'ben thanh market', nameKo: '벤탄 시장', nameVi: 'Chợ Bến Thành', priority: 490 },
  { name: 'notre dame cathedral', nameKo: '노트르담 대성당', nameVi: 'Nhà thờ Đức Bà', priority: 485 },
  { name: 'war remnants museum', nameKo: '전쟁박물관', nameVi: 'Bảo tàng Chứng tích Chiến tranh', priority: 480 },
  { name: 'independence palace', nameKo: '통일궁', nameVi: 'Dinh Độc Lập', priority: 475 },
  { name: 'reunification palace', nameKo: '통일궁', nameVi: 'Dinh Thống Nhất', priority: 475 },
  { name: 'saigon opera house', nameKo: '사이공 오페라하우스', nameVi: 'Nhà hát Thành phố', priority: 470 },
  { name: 'cu chi tunnels', nameKo: '꾸찌 터널', nameVi: 'Địa đạo Củ Chi', priority: 465 },
  { name: 'central post office', nameKo: '중앙우체국', nameVi: 'Bưu điện Trung tâm', priority: 460 },
  
  // 하노이 (Hanoi)
  { name: 'hoan kiem lake', nameKo: '호안끼엠 호수', nameVi: 'Hồ Hoàn Kiếm', priority: 500 },
  { name: 'ho guom', nameKo: '호안끼엠 호수', nameVi: 'Hồ Gươm', priority: 500 },
  { name: 'old quarter', nameKo: '올드쿼터', nameVi: 'Phố cổ Hà Nội', priority: 495 },
  { name: 'temple of literature', nameKo: '문묘', nameVi: 'Văn Miếu', priority: 490 },
  { name: 'ho chi minh mausoleum', nameKo: '호치민 묘소', nameVi: 'Lăng Chủ tịch Hồ Chí Minh', priority: 485 },
  { name: 'one pillar pagoda', nameKo: '일주사', nameVi: 'Chùa Một Cột', priority: 480 },
  { name: 'thang long citadel', nameKo: '탕롱 황성', nameVi: 'Hoàng thành Thăng Long', priority: 475 },
  { name: 'hanoi opera house', nameKo: '하노이 오페라하우스', nameVi: 'Nhà hát Lớn Hà Nội', priority: 470 },
  { name: 'hoa lo prison', nameKo: '호아로 수용소', nameVi: 'Nhà tù Hỏa Lò', priority: 465 },
  { name: 'st joseph cathedral', nameKo: '성요셉 대성당', nameVi: 'Nhà thờ Lớn Hà Nội', priority: 460 },
  { name: 'dong xuan market', nameKo: '동쑤언 시장', nameVi: 'Chợ Đồng Xuân', priority: 455 },
  { name: 'west lake', nameKo: '서호', nameVi: 'Hồ Tây', priority: 450 },
  
  // 다낭/호이안
  { name: 'ba na hills', nameKo: '바나힐', nameVi: 'Bà Nà Hills', priority: 500 },
  { name: 'golden bridge', nameKo: '골든 브릿지', nameVi: 'Cầu Vàng', priority: 495 },
  { name: 'dragon bridge', nameKo: '드래곤 브릿지', nameVi: 'Cầu Rồng', priority: 490 },
  { name: 'my khe beach', nameKo: '미케 비치', nameVi: 'Bãi biển Mỹ Khê', priority: 485 },
  { name: 'marble mountains', nameKo: '마블 마운틴', nameVi: 'Ngũ Hành Sơn', priority: 480 },
  { name: 'hoi an ancient town', nameKo: '호이안 고대도시', nameVi: 'Phố cổ Hội An', priority: 495 },
  { name: 'japanese covered bridge', nameKo: '일본다리', nameVi: 'Chùa Cầu', priority: 475 },
  { name: 'an bang beach', nameKo: '안방 비치', nameVi: 'Bãi biển An Bàng', priority: 470 },
  
  // 기타
  { name: 'ha long bay', nameKo: '하롱베이', nameVi: 'Vịnh Hạ Long', priority: 500 },
  { name: 'sapa', nameKo: '사파', nameVi: 'Sa Pa', priority: 495 },
  { name: 'fansipan', nameKo: '판시판', nameVi: 'Fansipan', priority: 490 },
  { name: 'mekong delta', nameKo: '메콩 델타', nameVi: 'Đồng bằng sông Cửu Long', priority: 485 },
  { name: 'phong nha cave', nameKo: '퐁냐 동굴', nameVi: 'Động Phong Nha', priority: 480 },
  { name: 'mui ne', nameKo: '무이네', nameVi: 'Mũi Né', priority: 475 },
];

// 대표 명소 우선순위 확인 (export)
export const getLandmarkPriority = (text: string): number => {
  const textLower = text.toLowerCase();
  for (const landmark of FAMOUS_LANDMARKS) {
    if (textLower.includes(landmark.name)) {
      return landmark.priority;
    }
  }
  return 0;
};

// 검색어 일치도 점수 계산 (export)
export const getSearchMatchScore = (text: string, searchQuery: string): number => {
  const textLower = text.toLowerCase();
  const queryLower = searchQuery.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  const allWordsMatch = queryWords.every(word => textLower.includes(word));
  
  if (textLower.startsWith(queryLower)) return 2000;
  if (allWordsMatch) {
    if (textLower.includes(queryLower)) return 1500;
    return 1200;
  }
  if (queryWords.length > 0 && textLower.startsWith(queryWords[0])) return 800;
  
  const words = textLower.split(/\s+/);
  if (words.some(word => word.startsWith(queryLower))) return 500;
  
  const matchedWords = queryWords.filter(word => textLower.includes(word));
  if (matchedWords.length > 0) {
    return matchedWords.length * 50;
  }
  
  return 0;
};

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

export const cleanSubAddress = (text: string): string => {
  let result = text;
  result = result.replace(/^TP\.\s*/gi, '');
  result = result.replace(/^Tp\s+/gi, '');
  result = result.replace(/^Thành\s+phố\s+/gi, '');
  result = result.replace(/,?\s*(Vietnam|Việt Nam|Viet Nam)\s*$/i, '');
  return result.replace(/\s+/g, ' ').trim().replace(/^,\s*/, '').replace(/,\s*$/, '').replace(/,\s*,/g, ',');
};

// ============================================================================
// useLocationSearch 훅
// ============================================================================
export function useLocationSearch(currentLanguage: string) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (value: string) => {
    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    // 디바운싱: 250ms 후 검색
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        
        // 1순위/2순위: 행정구역 검색 (도시/구)
        const regionResults = searchRegions(value);
        const regionSuggestions: LocationSuggestion[] = regionResults.map(region => 
          regionToSuggestion(region, currentLanguage) as LocationSuggestion
        );
        
        const cityResults = regionSuggestions.filter(r => r.regionType === 'city');
        const districtResults = regionSuggestions.filter(r => r.regionType === 'district');
        
        // 3순위: 대표 명소 검색 (화이트리스트 기반)
        let landmarkResults: LocationSuggestion[] = [];
        
        try {
          const apiLanguage = currentLanguage === 'vi' ? 'vi' : 'en';
          const textResults = await searchPlaceIndexForText(value, apiLanguage);
          
          const apiSuggestions = textResults.map((result: any) => ({
            PlaceId: result.Place?.PlaceId || result.PlaceId || '',
            Text: result.Place?.Label || result.Text || value,
            Place: result.Place,
          }));
          
          // 행정구역 이름 Set (중복 제거용)
          const regionNames = new Set(
            regionResults.flatMap(r => [
              r.name.toLowerCase(),
              r.nameVi.toLowerCase(),
              r.nameKo.toLowerCase(),
              ...r.keywords.map(k => k.toLowerCase()),
            ])
          );
          
          // 대표 명소만 필터링
          landmarkResults = apiSuggestions
            .map(suggestion => {
              const text = suggestion.Text || '';
              const textLower = text.toLowerCase();
              
              // 화이트리스트에 있는 대표 명소만 허용
              const landmarkPriority = getLandmarkPriority(text);
              if (landmarkPriority === 0) {
                return null;
              }
              
              // 행정구역 중복 제거
              for (const name of regionNames) {
                if (textLower === name || textLower.startsWith(name + ',')) {
                  return null;
                }
              }
              
              const searchMatchScore = getSearchMatchScore(text, value);
              const finalScore = searchMatchScore + landmarkPriority;
              
              return {
                suggestion: {
                  ...suggestion,
                  isLandmark: true,
                } as LocationSuggestion,
                score: finalScore,
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null && item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(item => item.suggestion);
          
        } catch (apiError) {
          console.warn('AWS API 검색 실패:', apiError);
        }
        
        // 최종 결과 병합
        const combinedResults = [
          ...cityResults,
          ...districtResults,
          ...landmarkResults,
        ].slice(0, 10);
        
        setSuggestions(combinedResults);
      } catch (error) {
        console.error('검색 오류:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  }, [currentLanguage]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isSearching,
    search,
    clearSuggestions,
  };
}

// 뱃지 정보 가져오기
export function getSuggestionBadge(suggestion: LocationSuggestion, currentLanguage: string) {
  if (suggestion.isRegion) {
    if (suggestion.regionType === 'city') {
      return {
        text: currentLanguage === 'ko' ? '도시' : currentLanguage === 'vi' ? 'Thành phố' : 'City',
        color: 'bg-blue-600',
        icon: '🏙️',
      };
    } else {
      return {
        text: currentLanguage === 'ko' ? '구/군' : currentLanguage === 'vi' ? 'Quận' : 'District',
        color: 'bg-blue-500',
        icon: '📍',
      };
    }
  } else {
    return {
      text: currentLanguage === 'ko' ? '명소' : currentLanguage === 'vi' ? 'Địa danh' : 'Landmark',
      color: 'bg-amber-500',
      icon: '⭐',
    };
  }
}
