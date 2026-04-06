import type { BookingData } from '@/lib/api/bookings';
import { getCheckInMoment, getCheckOutMoment } from '@/lib/utils/rentalIncome';

function isFiniteMoment(d: Date): boolean {
  return Number.isFinite(d.getTime());
}

/** 계약체결: 결제완료·확정, 숙박 시작 전 */
export function isContractSealedTab(b: BookingData, now: Date): boolean {
  if (b.paymentStatus !== 'paid') return false;
  if (b.status !== 'confirmed') return false;
  const checkIn = getCheckInMoment(b.checkInDate, b.checkInTime || '14:00');
  if (!isFiniteMoment(checkIn)) return false;
  return now.getTime() < checkIn.getTime();
}

/** 계약시작: 체크인 시각 이후 ~ 체크아웃 시각 전(숙박 진행 중) */
export function isContractInProgressTab(b: BookingData, now: Date): boolean {
  if (b.paymentStatus !== 'paid') return false;
  if (b.status !== 'confirmed') return false;
  const checkIn = getCheckInMoment(b.checkInDate, b.checkInTime || '14:00');
  const checkOut = getCheckOutMoment(b.checkOutDate, b.checkOutTime || '12:00');
  if (!isFiniteMoment(checkIn) || !isFiniteMoment(checkOut)) return false;
  const t = now.getTime();
  return t >= checkIn.getTime() && t < checkOut.getTime();
}

/** 계약종료: 이용완료 상태이거나 체크아웃 시각이 지난 확정 예약 */
export function isContractCompletedTab(b: BookingData, now: Date): boolean {
  if (b.status === 'cancelled') return false;
  if (b.paymentStatus !== 'paid') return false;
  if (b.status === 'completed') return true;
  if (b.status === 'confirmed') {
    const checkOut = getCheckOutMoment(b.checkOutDate, b.checkOutTime || '12:00');
    if (!isFiniteMoment(checkOut)) return false;
    return now.getTime() >= checkOut.getTime();
  }
  return false;
}

export function isRefundPending(b: BookingData): boolean {
  return (
    b.status === 'cancelled' &&
    b.paymentStatus === 'paid' &&
    !b.refundAdminApproved
  );
}

/** 계약전 환불: 취소 시점이 체크인 이전 */
export function isRefundBeforeRental(b: BookingData): boolean {
  if (!isRefundPending(b) || !b.cancelledAt) return false;
  const cancelT = new Date(b.cancelledAt).getTime();
  const checkInD = getCheckInMoment(b.checkInDate, b.checkInTime || '14:00');
  const checkIn = checkInD.getTime();
  if (!Number.isFinite(checkIn)) return false;
  return cancelT < checkIn;
}

/** 계약진행중 환불: 취소 시점이 체크인 이후(체크인~체크아웃·이후 취소 포함) */
export function isRefundDuringOrAfterRental(b: BookingData): boolean {
  if (!isRefundPending(b) || !b.cancelledAt) return false;
  const cancelT = new Date(b.cancelledAt).getTime();
  const checkInD = getCheckInMoment(b.checkInDate, b.checkInTime || '14:00');
  const checkIn = checkInD.getTime();
  if (!Number.isFinite(checkIn)) return false;
  return cancelT >= checkIn;
}
