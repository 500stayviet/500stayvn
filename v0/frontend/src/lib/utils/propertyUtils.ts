import { PropertyData } from '@/types/property';
import { toISODateString, parseDate } from './dateUtils';
import { getDistrictIdForCoord } from '@/lib/data/vietnam-regions';
import { ALL_REGIONS, VIETNAM_CITIES } from '@/lib/data/vietnam-regions';

/**
 * 매물 예약 날짜 범위 인터페이스
 */
export interface PropertyDateRange {
  checkIn: Date;
  checkOut: Date;
}

/**
 * 가격 포맷팅 (예: 15.5M VND 또는 $1,200)
 */
export const formatPrice = (price: number, unit: string): string => {
  if (unit === 'vnd') {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M VND`;
    }
    return `${price.toLocaleString('vi-VN')} VND`;
  }
  return `$${price.toLocaleString()}`;
};

/**
 * 가격 포맷팅 (상세 형식: 예: 15,500,000 VND)
 */
export const formatFullPrice = (price: number, unit: string): string => {
  if (unit === 'vnd') {
    return `${price.toLocaleString('vi-VN')} VND`;
  }
  return `$${price.toLocaleString()}`;
};

/**
 * 주소에서 도시명 추출
 */
export const getCityName = (address?: string): string => {
  if (!address) return '';
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 1].trim() : address;
};

/**
 * 매물에 예약 가능한 기간이 7일 이상 남아있는지 확인하는 헬퍼 함수
 * (my-properties/page.tsx에서 이동)
 */
export const hasAvailableBookingPeriod = (property: any, bookedRanges: PropertyDateRange[]): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const propCheckIn = toISODateString(property.checkInDate);
  const propCheckOut = toISODateString(property.checkOutDate);

  // 매물의 임대 시작일이 오늘보다 이전이면 오늘부터 시작으로 간주
  const todayStr = toISODateString(today);
  const effectiveCheckIn = propCheckIn && propCheckIn > todayStr ? propCheckIn : todayStr;

  // 매물 임대 종료일이 없거나 이미 지났으면 광고 불가
  if (!propCheckOut || propCheckOut <= effectiveCheckIn) {
    return false;
  }

  // 예약된 날짜들을 정렬 (ISO 문자열 기준)
  const sortedBookedRanges = [...bookedRanges]
    .map(r => ({ checkIn: toISODateString(r.checkIn), checkOut: toISODateString(r.checkOut) }))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  let currentCheckDate = effectiveCheckIn;
  const minBookingDays = 7; // 최소 임대 가능 기간 (7일)

  while (currentCheckDate < propCheckOut) {
    let isBookedOnCurrentDate = false;
    for (const range of sortedBookedRanges) {
      // ISO 문자열 비교로 중복 확인
      if (currentCheckDate >= range.checkIn && currentCheckDate < range.checkOut) {
        isBookedOnCurrentDate = true;
        currentCheckDate = range.checkOut;
        break;
      }
    }

    if (!isBookedOnCurrentDate) {
      let consecutiveAvailableDays = 0;
      let tempDate = new Date(currentCheckDate);
      
      while (toISODateString(tempDate) < propCheckOut && consecutiveAvailableDays < minBookingDays) {
        const tempDateStr = toISODateString(tempDate);
        let isTempDateBooked = false;
        for (const range of sortedBookedRanges) {
          if (tempDateStr >= range.checkIn && tempDateStr < range.checkOut) {
            isTempDateBooked = true;
            break;
          }
        }
        if (!isTempDateBooked) {
          consecutiveAvailableDays++;
          tempDate.setDate(tempDate.getDate() + 1);
        } else {
          break;
        }
      }
      if (consecutiveAvailableDays >= minBookingDays) return true;
      currentCheckDate = toISODateString(tempDate);
    } else {
      // 다음 날짜로 이동
      const nextDate = new Date(currentCheckDate);
      nextDate.setDate(nextDate.getDate() + 1);
      currentCheckDate = toISODateString(nextDate);
    }
  }
  return false;
};

/**
 * 매물이 광고 중인 상태인지 확인하는 헬퍼 함수
 */
export const isAdvertisingProperty = (property: PropertyData) => {
  const normalizedStatus = property.status ?? 'active';
  return normalizedStatus === 'active';
};

/**
 * 전체 임대 기간에서 이미 예약된 기간을 제외한 "실제 예약 가능한 구간" 배열 계산
 * Stay-over: 예약 구간의 체크아웃일 당일은 비어있음(다음 예약 가능 시작일).
 *
 * @param rentalStart - 임대 희망 시작일 (ISO 문자열)
 * @param rentalEnd - 임대 희망 종료일 (ISO 문자열)
 * @param bookedRanges - 이미 예약된 기간 배열 (checkIn/checkOut은 Date 또는 ISO 문자열)
 * @returns 예약 가능한 구간 배열 [{ start, end }, ...] (ISO 문자열)
 */
export function getAvailableDateSegments(
  rentalStart: string | Date | undefined,
  rentalEnd: string | Date | undefined,
  bookedRanges: PropertyDateRange[]
): { start: string; end: string }[] {
  const startStr = toISODateString(rentalStart);
  const endStr = toISODateString(rentalEnd);
  if (!startStr || !endStr || startStr >= endStr) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toISODateString(today);
  const effectiveStart = startStr > todayStr ? startStr : todayStr;
  if (effectiveStart >= endStr) return [];

  const sortedBooked = [...bookedRanges]
    .map((r) => ({
      checkIn: toISODateString(r.checkIn),
      checkOut: toISODateString(r.checkOut),
    }))
    .filter((r): r is { checkIn: string; checkOut: string } => !!(r.checkIn && r.checkOut))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const segments: { start: string; end: string }[] = [];
  let cursor = effectiveStart;

  for (const range of sortedBooked) {
    const rIn = range.checkIn;
    const rOut = range.checkOut;
    if (rOut <= cursor || rIn >= endStr) continue;
    if (rIn > cursor) {
      const segmentEnd = rIn < endStr ? rIn : endStr;
      segments.push({ start: cursor, end: segmentEnd });
    }
    if (rOut > cursor) cursor = rOut;
  }

  if (cursor < endStr) {
    segments.push({ start: cursor, end: endStr });
  }

  return segments.filter((s) => s.start < s.end);
}

/** 최소 7일 이상인 구간만 반환 (임차인에게 표시용: 실제 예약 가능한 구간만) */
export function getBookableDateSegments(
  rentalStart: string | Date | undefined,
  rentalEnd: string | Date | undefined,
  bookedRanges: PropertyDateRange[]
): { start: string; end: string }[] {
  const segments = getAvailableDateSegments(rentalStart, rentalEnd, bookedRanges);
  const minDays = 7;
  return segments.filter((seg) => {
    const ms = new Date(seg.end).getTime() - new Date(seg.start).getTime();
    const days = ms / (1000 * 60 * 60 * 24);
    return days >= minDays;
  });
}

/** 매물 종류 라벨 (ko/vi/en/ja/zh) */
const PROPERTY_TYPE_LABELS: Record<string, Record<string, string>> = {
  studio: { ko: '스튜디오', vi: 'Studio', en: 'Studio', ja: 'スタジオ', zh: '一室' },
  one_room: { ko: '원룸', vi: '1 phòng', en: '1 Room', ja: 'ワンルーム', zh: '一室' },
  two_room: { ko: '2룸', vi: '2 phòng', en: '2 Rooms', ja: '2ルーム', zh: '两室' },
  three_plus: { ko: '3+룸', vi: '3+ phòng', en: '3+ Rooms', ja: '3+ルーム', zh: '三室以上' },
  detached: { ko: '독채', vi: 'Nhà riêng', en: 'Detached', ja: '戸建て', zh: '独栋' },
};

export function getPropertyTypeLabel(
  propertyType: string | undefined,
  lang: string
): string {
  if (!propertyType) return '';
  const labels = PROPERTY_TYPE_LABELS[propertyType];
  if (!labels) return propertyType;
  return labels[lang] || labels.en || propertyType;
}

/** 좌표로 도시·구 표시 이름 반환 (vietnam-regions 기반) */
export function getCityDistrictFromCoords(
  lat: number | undefined,
  lng: number | undefined,
  lang: string
): { cityName: string; districtName: string } {
  if (lat == null || lng == null) return { cityName: '', districtName: '' };
  try {
    const districtId = getDistrictIdForCoord(lat, lng);
    if (!districtId) return { cityName: '', districtName: '' };
    const district = ALL_REGIONS.find((r) => r.id === districtId);
    if (!district) return { cityName: '', districtName: '' };
    const langMap = (r: { nameKo?: string; nameVi?: string; name?: string; nameJa?: string; nameZh?: string }) =>
      ({ ko: r.nameKo, vi: r.nameVi, en: r.name, ja: r.nameJa ?? r.name, zh: r.nameZh ?? r.name })[lang] ?? district.name;
    const districtName = langMap(district);
    const cityId = (district as { parentCity?: string }).parentCity;
    if (!cityId) return { cityName: '', districtName: districtName || '' };
    const city = VIETNAM_CITIES.find((c) => c.id === cityId);
    const cityName = city ? langMap(city) : '';
    return { cityName, districtName };
  } catch {
    return { cityName: '', districtName: '' };
  }
}
