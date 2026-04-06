import { NextResponse } from 'next/server';
import {
  getRentalIncomeStatus,
  getCheckInMoment,
  getCheckOutMoment,
  getPayableAfterMoment,
  toISO8601ForAudit,
  isValidBookingDateString,
  isValidBookingTimeString,
  normalizeBookingTimeForParsing,
} from '@/lib/utils/rentalIncome';
import type { RentalIncomeStatus } from '@/lib/utils/rentalIncome';

/**
 * 서버 측 이중 검증 (Double Verification)
 * - 프론트에서 계산된 시간/상태는 참고용. 실제 검증은 이 API에서 서버 현재 시각으로 재실행.
 * - DB 상태를 변경하는 백엔드 API는 내부에서 이 검증 또는 동일 로직을 다시 수행해야 함.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      checkInDate,
      checkOutDate,
      checkInTime = '14:00',
      checkOutTime = '12:00',
    } = body as {
      checkInDate: string;
      checkOutDate: string;
      checkInTime?: string;
      checkOutTime?: string;
    };

    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'checkInDate and checkOutDate required' },
        { status: 400 }
      );
    }

    const cinTime = normalizeBookingTimeForParsing(checkInTime, '14:00');
    const coutTime = normalizeBookingTimeForParsing(checkOutTime, '12:00');
    if (!isValidBookingDateString(checkInDate) || !isValidBookingDateString(checkOutDate)) {
      return NextResponse.json(
        { error: 'Invalid date: use YYYY-MM-DD calendar-valid dates' },
        { status: 400 }
      );
    }
    if (!isValidBookingTimeString(cinTime) || !isValidBookingTimeString(coutTime)) {
      return NextResponse.json(
        { error: 'Invalid time: use HH, HH:mm, or HH:mm:ss (24h)' },
        { status: 400 }
      );
    }

    const serverNow = new Date();
    const status = getRentalIncomeStatus(
      checkInDate,
      checkOutDate,
      cinTime,
      coutTime,
      serverNow
    ) as RentalIncomeStatus | null;

    const checkIn = getCheckInMoment(checkInDate, cinTime);
    const checkOut = getCheckOutMoment(checkOutDate, coutTime);
    const payableAfter = getPayableAfterMoment(checkOutDate, coutTime);

    return NextResponse.json({
      status,
      serverTimeISO: toISO8601ForAudit(serverNow),
      serverTimeMs: serverNow.getTime(),
      checkInISO: toISO8601ForAudit(checkIn),
      checkOutISO: toISO8601ForAudit(checkOut),
      payableAfterISO: toISO8601ForAudit(payableAfter),
    });
  } catch (e) {
    console.error('[settlement/verify]', e);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
