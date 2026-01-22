import { PropertyData } from '@/lib/api/properties';
import { toISODateString, parseDate } from './dateUtils';

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
