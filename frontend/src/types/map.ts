import { RegionType } from '@/lib/data/vietnam-regions';
import type { LandmarkCategory } from '@/lib/data/vietnam-landmarks';

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
  isRegion?: boolean;
  regionType?: RegionType;
  zoom?: number;
  isLandmark?: boolean;
  /** 명소 소속 구 ID (지도 필터·FlyTo 연동) */
  districtId?: string;
  /** 명소 카테고리 (핀 색상/모양) */
  landmarkCategory?: LandmarkCategory;
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
