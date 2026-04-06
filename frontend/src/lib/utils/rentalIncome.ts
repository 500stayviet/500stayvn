/**
 * 임대수익 정산 로직 (Bookings API 기반)
 *
 * - 모든 시간 비교: 베트남 시간(Asia/Ho_Chi_Minh, UTC+07:00) 기준, 날짜+시분 포함.
 * - Full Timestamp: check_in_date + check_in_time 을 ISO 8601 형식(YYYY-MM-DDTHH:mm:00+07:00)으로 결합 후 Date 변환.
 * - 비교 시 년-월-일-시-분-초 일치 검증을 위해 .getTime()(동등하게 ISO 8601 instant) 사용. 검증/로그용으로 toISO8601ForAudit() 제공.
 * - 24시간 계산: 감사/검증용(getRentalIncomeStatus, payable). 호스트 출금가능액에는 사용하지 않음(관리자 승인만 반영).
 * - 한 건당 임대수익 = 숙박 + 애완동물 (수수료 제외). 총수익/사용가능잔액 중복 합산 방지.
 */

/** 24시간 = 정확히 86,400초 = 86,400,000ms (초 단위까지 대조) */
const MS_24H = 86_400 * 1000; // 86_400_000

const BOOKING_YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * 예약 날짜 문자열이 YYYY-MM-DD 형식이며 실제 달력상 유효한지 검사합니다.
 */
export function isValidBookingDateString(dateStr: string): boolean {
  const m = BOOKING_YMD_RE.exec(dateStr.trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return false;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/**
 * 체크인/아웃 시각 문자열(HH 또는 HH:mm 또는 HH:mm:ss)이 유효한지 검사합니다.
 */
export function isValidBookingTimeString(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  const segments = s.split(':');
  if (segments.length > 3) return false;
  const h = Number(segments[0]);
  const min = segments.length >= 2 ? Number(segments[1]) : 0;
  const sec = segments.length >= 3 ? Number(segments[2]) : 0;
  if (!Number.isInteger(h) || h < 0 || h > 23) return false;
  if (!Number.isInteger(min) || min < 0 || min > 59) return false;
  if (!Number.isInteger(sec) || sec < 0 || sec > 59) return false;
  return true;
}

/**
 * 공백만 있거나 비어 있으면 기본 시각을 씁니다.
 */
export function normalizeBookingTimeForParsing(
  raw: string | undefined,
  defaultTime: string
): string {
  const t = (raw ?? '').trim();
  return t || defaultTime;
}

/**
 * 베트남 시간대(Asia/Ho_Chi_Minh, UTC+07:00) 명시하여 시각 생성.
 * 전체 일시(년-월-일-시-분-초) ISO 8601 형식: YYYY-MM-DDTHH:mm:ss+07:00
 * 날짜·시각이 검증에 실패하면 Invalid Date를 반환합니다.
 */
function toVietnamMoment(dateStr: string, timeStr: string): Date {
  if (!isValidBookingDateString(dateStr)) {
    return new Date(NaN);
  }
  const t = timeStr.trim();
  if (!isValidBookingTimeString(t)) {
    return new Date(NaN);
  }
  const parts = t.includes(':') ? t.split(':') : [t, '00'];
  const h = parts[0]!.padStart(2, '0');
  const m = (parts[1] ?? '00').padStart(2, '0');
  const s = (parts[2] ?? '00').padStart(2, '0');
  const iso = `${dateStr.trim()}T${h}:${m}:${s}+07:00`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return new Date(NaN);
  }
  return d;
}

/**
 * 체크인 시각 (베트남): 해당일 + checkInTime
 */
export function getCheckInMoment(
  checkInDate: string,
  checkInTime: string
): Date {
  return toVietnamMoment(checkInDate, checkInTime || '14:00');
}

/**
 * 체크아웃 시각 (베트남): 해당일 + checkOutTime
 */
export function getCheckOutMoment(
  checkOutDate: string,
  checkOutTime: string
): Date {
  const t = normalizeBookingTimeForParsing(checkOutTime, '12:00');
  return toVietnamMoment(checkOutDate.trim(), t);
}

/**
 * 체크아웃 + 정확히 86,400,000ms(24시간) 후 시각.
 * 비교 시 이 시점과 현재 서버 시각을 초 단위까지 대조하여 지급됨 전환.
 */
export function getPayableAfterMoment(
  checkOutDate: string,
  checkOutTime: string
): Date {
  const checkout = getCheckOutMoment(checkOutDate, checkOutTime);
  const t0 = checkout.getTime();
  if (!Number.isFinite(t0)) {
    return new Date(NaN);
  }
  const t1 = t0 + MS_24H;
  if (!Number.isFinite(t1)) {
    return new Date(NaN);
  }
  return new Date(t1);
}

/**
 * 임대수익 상태 (조회 시점 기준, 저장 없음)
 * - pending: 체크인 시각 경과 ~ 체크아웃 시각 전
 * - confirmed: 체크아웃 시각 경과 ~ 체크아웃+24h 전
 * - payable: 체크아웃+24h 경과
 * - null: 체크인 전 → 수익 목록에 미포함
 */
export type RentalIncomeStatus = 'pending' | 'confirmed' | 'payable';

export function getRentalIncomeStatus(
  checkInDate: string,
  checkOutDate: string,
  checkInTime: string,
  checkOutTime: string,
  now: Date = new Date()
): RentalIncomeStatus | null {
  const checkIn = getCheckInMoment(checkInDate, checkInTime || '14:00');
  const checkOut = getCheckOutMoment(checkOutDate, checkOutTime || '12:00');
  const payableAfter = getPayableAfterMoment(checkOutDate, checkOutTime || '12:00');

  const tNow = now.getTime();
  const tIn = checkIn.getTime();
  const tOut = checkOut.getTime();
  const tPay = payableAfter.getTime();
  if (
    !Number.isFinite(tNow) ||
    !Number.isFinite(tIn) ||
    !Number.isFinite(tOut) ||
    !Number.isFinite(tPay)
  ) {
    return null;
  }

  if (tNow < tIn) {
    return null;
  }
  if (tNow < tOut) {
    return 'pending';
  }
  if (tNow < tPay) {
    return 'confirmed';
  }
  return 'payable';
}

/**
 * 한 건당 임대수익 금액: 숙박 + 애완동물 (수수료 제외)
 * accommodationTotal + petTotal 미존재 시 totalPrice - serviceFee 로 폴백
 */
export function getRentalIncomeAmount(booking: {
  accommodationTotal?: number;
  petTotal?: number;
  totalPrice: number;
  serviceFee?: number;
}): number {
  const accommodation = booking.accommodationTotal ?? 0;
  const pet = booking.petTotal ?? 0;
  if (accommodation > 0 || pet > 0) {
    return accommodation + pet;
  }
  const fee = booking.serviceFee ?? 0;
  return Math.max(0, booking.totalPrice - fee);
}

/**
 * 수익 목록에 포함할지 여부: 결제 완료 + (확정 또는 완료) + 체크인 시각 경과
 */
export function isEligibleForRentalIncome(booking: {
  paymentStatus: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  now?: Date;
}): boolean {
  if (booking.paymentStatus !== 'paid') return false;
  if (booking.status !== 'confirmed' && booking.status !== 'completed') return false;
  const status = getRentalIncomeStatus(
    booking.checkInDate,
    booking.checkOutDate,
    booking.checkInTime || '14:00',
    booking.checkOutTime || '12:00',
    booking.now ?? new Date()
  );
  return status !== null;
}

/**
 * 총수익 = 목록에 표시된 건의 임대수익 합(참고용).
 * 출금가능액은 체크아웃+24h 자동이 아니라 관리자 승인·출금(getOwnerBalances)에서만 산정함.
 */
export function aggregateRentalIncome(
  items: { amount: number }[]
): { totalRevenue: number; availableBalance: number } {
  let totalRevenue = 0;
  for (const item of items) {
    totalRevenue += item.amount;
  }
  return { totalRevenue, availableBalance: 0 };
}

/**
 * 검증/감사용: 비교 시점의 ISO 8601(UTC) 문자열 반환.
 * 년-월-일-시-분-초가 모두 포함된 표준 형식으로 로그·검증 시 사용.
 */
export function toISO8601ForAudit(date: Date): string {
  if (!Number.isFinite(date.getTime())) {
    return 'invalid-timestamp';
  }
  return date.toISOString();
}

/**
 * 감사용: 주어진 예약·현재 시각에 대한 체크인/체크아웃/지급가능시각·상태를 ISO 8601 포함해 반환.
 */
export function getRentalIncomeAuditInfo(
  checkInDate: string,
  checkOutDate: string,
  checkInTime: string,
  checkOutTime: string,
  now: Date
): {
  checkInISO: string;
  checkOutISO: string;
  payableAfterISO: string;
  nowISO: string;
  status: RentalIncomeStatus | null;
} {
  const checkIn = getCheckInMoment(checkInDate, checkInTime || '14:00');
  const checkOut = getCheckOutMoment(checkOutDate, checkOutTime || '12:00');
  const payableAfter = getPayableAfterMoment(checkOutDate, checkOutTime || '12:00');
  const status = getRentalIncomeStatus(checkInDate, checkOutDate, checkInTime, checkOutTime, now);
  return {
    checkInISO: toISO8601ForAudit(checkIn),
    checkOutISO: toISO8601ForAudit(checkOut),
    payableAfterISO: toISO8601ForAudit(payableAfter),
    nowISO: toISO8601ForAudit(now),
    status,
  };
}
