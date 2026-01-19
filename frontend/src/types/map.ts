import { RegionType } from '@/lib/data/vietnam-regions';

export interface Suggestion {
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
  // 행정 구역 데이터 확장 필드
  isRegion?: boolean;
  regionType?: RegionType;
  zoom?: number;
  // 명소 태그 (landmark만 허용)
  isLandmark?: boolean;
}

export type ResultType = 'region' | 'poi' | 'address';

export const getResultType = (suggestion: Suggestion): ResultType => {
  // 행정 구역 (1순위: 도시, 2순위: 구)
  if (suggestion.isRegion || suggestion.PlaceId?.startsWith('region-')) {
    return 'region';
  }
  
  // 대표 명소 (3순위)
  if (suggestion.isLandmark) {
    return 'poi';
  }
  
  // 기타
  return 'address';
};
