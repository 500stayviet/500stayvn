import { prisma } from '@/lib/prisma';

/**
 * Raw SQL로만 `AdminSettlement*` 등을 바꾼 경우에도 Prisma가 `Booking` 쓰기로 감지하게 해
 * `AdminDomainEvent`(resource: `booking`)가 남고 — 관리자 SSE·상단 배지·`useAdminDomainRefresh(['booking'])`가 반응한다.
 */
export async function bumpBookingUpdatedAtForDomainSignal(bookingId: string): Promise<void> {
  try {
    await prisma.booking.updateMany({
      where: { id: bookingId },
      data: { updatedAt: new Date() },
    });
  } catch (e) {
    console.warn('[bumpBookingDomainSignal] bump booking updatedAt failed', bookingId, e);
  }
}
