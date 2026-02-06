/**
 * 임대수익 정산 로직 (Bookings API 기반)
 *
 * - 모든 시간 비교: 베트남 시간(Asia/Ho_Chi_Minh, UTC+07:00) 기준, 날짜+시분 포함.
 * - Full Timestamp: check_in_date + check_in_time 을 ISO 8601 형식(YYYY-MM-DDTHH:mm:00+07:00)으로 결합 후 Date 변환.
 * - 비교 시 년-월-일-시-분-초 일치 검증을 위해 .getTime()(동등하게 ISO 8601 instant) 사용. 검증/로그용으로 toISO8601ForAudit() 제공.
 * - 24시간 계산: 체크아웃 시각 + 정확히 86,400초(24h) 후와 현재 시각 비교. 상태는 저장하지 않고 조회 시점 기준 계산.
 * - 한 건당 임대수익 = 숙박 + 애완동물 (수수료 제외). 총수익/사용가능잔액 중복 합산 방지.
 */

/** 24시간 = 정확히 86,400초 = 86,400,000ms (초 단위까지 대조) */
const MS_24H = 86_400 * 1000; // 86_400_000

/**
 * 베트남 시간대(Asia/Ho_Chi_Minh, UTC+07:00) 명시하여 시각 생성.
 * 전체 일시(년-월-일-시-분-초) ISO 8601 형식: YYYY-MM-DDTHH:mm:ss+07:00
 */
function toVietnamMoment(dateStr: string, timeStr: string): Date {
  const parts = timeStr.includes(':') ? timeStr.split(':') : [timeStr, '00'];
  const h = parts[0]!.padStart(2, '0');
  const m = (parts[1] ?? '00').padStart(2, '0');
  const s = (parts[2] ?? '00').padStart(2, '0');
  const iso = `${dateStr}T${h}:${m}:${s}+07:00`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return new Date(0);
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
  return toVietnamMoment(checkOutDate, checkOutTime || '12:00');
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
  const payableAfter = new Date(checkout.getTime() + MS_24H);
  const elapsedMs = payableAfter.getTime() - checkout.getTime();
  if (elapsedMs !== MS_24H) {
    throw new Error(`Payable-after must be exactly 86,400,000ms after checkout; got ${elapsedMs}ms`);
  }
  return payableAfter;
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

  if (now.getTime() < checkIn.getTime()) {
    return null;
  }
  if (now.getTime() < checkOut.getTime()) {
    return 'pending';
  }
  if (now.getTime() < payableAfter.getTime()) {
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
 * 총수익 = (대기 + 확정 + 지급됨) 전체 누적 합계
 * 사용가능잔액 = 지급됨 상태 금액만 합계 (확정 금액은 포함하지 않음)
 */
export function aggregateRentalIncome(
  items: { amount: number; status: RentalIncomeStatus }[]
): { totalRevenue: number; availableBalance: number } {
  let totalRevenue = 0;
  let availableBalance = 0;
  for (const item of items) {
    totalRevenue += item.amount;
    if (item.status === 'payable') {
      availableBalance += item.amount;
    }
  }
  return { totalRevenue, availableBalance };
}

/**
 * 검증/감사용: 비교 시점의 ISO 8601(UTC) 문자열 반환.
 * 년-월-일-시-분-초가 모두 포함된 표준 형식으로 로그·검증 시 사용.
 */
export function toISO8601ForAudit(date: Date): string {
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
