import { SupportedLanguage } from '../api/translation';

/**
 * Date Utilities (날짜 관련 유틸리티)
 */

/**
 * 날짜를 ISO 표준(YYYY-MM-DD) 문자열로 변환 (시간대 시차 문제 방지)
 * 
 * 중요: .toISOString()은 UTC로 변환하여 날짜가 하루 전으로 보일 수 있으므로 사용하지 않음.
 * 대신 로컬 시간(한국/베트남) 기준의 연, 월, 일을 직접 추출하여 YYYY-MM-DD 생성.
 */
export function toISODateString(date: Date | string | undefined): string {
  if (!date) return '';
  
  // 1. 이미 YYYY-MM-DD 형식이면 그대로 반환
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  // 2. 브라우저의 로컬 시간 기준으로 연/월/일 추출
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ISO 문자열 또는 Date 객체를 Date로 변환하는 헬퍼 함수
 */
export const parseDate = (dateInput: string | Date | undefined | null): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'string') {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
};

/**
 * 즉시 입주 가능 여부 확인
 */
export const isAvailableNow = (checkInDate?: string | Date): boolean => {
  if (!checkInDate) return false;
  const checkIn = parseDate(checkInDate);
  if (!checkIn) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkIn.setHours(0, 0, 0, 0);
  return checkIn <= today;
};

/**
 * 날짜 포맷팅 (배지용: 체크인 ~ 체크아웃 또는 시작일부터)
 */
export const formatDateForBadge = (
  checkInDate: string | Date | undefined, 
  lang: SupportedLanguage,
  checkOutDate?: string | Date | undefined
): string => {
  const checkIn = parseDate(checkInDate);
  if (!checkIn) return '';
  
  const checkOut = checkOutDate ? parseDate(checkOutDate) : null;
  
  const checkInMonth = checkIn.getMonth() + 1;
  const checkInDay = checkIn.getDate();
  
  if (checkOut) {
    const checkOutMonth = checkOut.getMonth() + 1;
    const checkOutDay = checkOut.getDate();
    
    if (lang === 'ko') {
      return `${checkInMonth}월 ${checkInDay}일 ~ ${checkOutMonth}월 ${checkOutDay}일`;
    } else if (lang === 'vi') {
      return `${checkInDay}/${checkInMonth} ~ ${checkOutDay}/${checkOutMonth}`;
    } else if (lang === 'ja') {
      return `${checkInMonth}月${checkInDay}日 ~ ${checkOutMonth}月${checkOutDay}日`;
    } else if (lang === 'zh') {
      return `${checkInMonth}月${checkInDay}日 ~ ${checkOutMonth}月${checkOutDay}日`;
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[checkInMonth - 1]} ${checkInDay} ~ ${monthNames[checkOutMonth - 1]} ${checkOutDay}`;
    }
  }
  
  if (lang === 'ko') {
    return `${checkInMonth}월 ${checkInDay}일부터`;
  } else if (lang === 'vi') {
    return `Từ ${checkInDay}/${checkInMonth}`;
  } else if (lang === 'ja') {
    return `${checkInMonth}月${checkInDay}日から`;
  } else if (lang === 'zh') {
    return `从${checkInMonth}月${checkInDay}日开始`;
  } else {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `From ${monthNames[checkInMonth - 1]} ${checkInDay}`;
  }
};

/**
 * 날짜 포맷팅 (표준: 예: 2024. 1. 21)
 */
export const formatDate = (dateInput: string | Date | undefined, lang: SupportedLanguage): string => {
  const date = parseDate(dateInput);
  if (!date) return '';
  return date.toLocaleDateString(
    lang === 'ko' ? 'ko-KR' : lang === 'vi' ? 'vi-VN' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );
};
