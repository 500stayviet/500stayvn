/**
 * 비로그인(공개 카탈로그)용 매물 마스킹 정책 — 베트남 현지 파트너 운영 시 참고
 * ------------------------------------------------------------------
 * - 주소: 시·군·구 단계까지만 노출. `vietnam-regions` 기반 좌표→행정구역 변환이 실패하거나
 *   비어 있으면 **주소 전체 비노출**(빈 문자열) — 안전 우선 폴백.
 * - 상세 주소: `unitNumber` 제거, 원문 `address` 필드는 공개용 대체 문자열만 담음.
 * - 좌표: 소수점 **셋째 자리**에서 반올림해 정밀 위치 추적 완화.
 * - 임대인 식별·연락: `ownerId` 제거. (DB `User.phoneNumber` 등은 매물 API 응답에 포함하지 않음)
 * - 외부 캘린더 URL·히스토리 등 내부 운영 정보: 공개 응답에서 제거.
 */

import type { SupportedLanguage } from '@/lib/api/translation';
import type { PropertyData } from '@/types/property';
import { getCityDistrictFromCoords } from '@/lib/utils/propertyUtils';
import { getUIText } from '@/utils/i18n';

const PUBLIC_ADDRESS_LANG = 'vi' as const;

/** 설명 필드에 노출된 전화 형태 최소 제거(완벽한 PII 방지는 아님) */
function scrubPhoneLikeSegments(text: string, lang: SupportedLanguage): string {
  if (!text) return text;
  const mask = getUIText('publicDescriptionContactMasked', lang);
  return text
    .replace(/\+84\s*[\d\s.-]{8,16}/g, mask)
    .replace(/\b0\d{9,10}\b/g, mask);
}

function roundCoord(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1000) / 1000;
}

/**
 * 공개 카탈로그용 DTO. 원본 `PropertyData`는 변형하지 않고 새 객체를 반환합니다.
 */
export function toPublicProperty(p: PropertyData): PropertyData {
  const lat = p.coordinates?.lat;
  const lng = p.coordinates?.lng;
  const { cityName, districtName } = getCityDistrictFromCoords(lat, lng, PUBLIC_ADDRESS_LANG);
  const regionLabel = [cityName, districtName].filter(Boolean).join(' ').trim();
  /** 구조화 실패 시 주소 비노출 */
  const publicAddress = regionLabel.length > 0 ? regionLabel : '';

  return {
    ...p,
    original_description: scrubPhoneLikeSegments(p.original_description ?? '', PUBLIC_ADDRESS_LANG),
    translated_description: scrubPhoneLikeSegments(p.translated_description ?? '', PUBLIC_ADDRESS_LANG),
    address: publicAddress,
    unitNumber: undefined,
    ownerId: undefined,
    coordinates: {
      lat: roundCoord(lat ?? 0),
      lng: roundCoord(lng ?? 0),
    },
    history: undefined,
    icalPlatform: undefined,
    icalCalendarName: undefined,
    icalUrl: undefined,
  };
}

export function mapPropertiesToPublicDTO(list: PropertyData[]): PropertyData[] {
  return list.map((x) => toPublicProperty(JSON.parse(JSON.stringify(x)) as PropertyData));
}
