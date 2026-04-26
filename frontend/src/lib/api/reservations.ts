/**
 * Reservations — Booking 원장에서 파생되는 뷰
 *
 * 단일 원장: 서버 DB + `bookings.ts` 메모리 캐시.
 * `NEXT_PUBLIC_LOCAL_FALLBACK_MODE=off` 에서도 `reservations` LS 키는 사용하지 않습니다.
 * 호스트 예약 목록·가용 기간 등은 `getAllBookings` 하이드레이션 이후 `readBookingsArray`와 동일 데이터를 봅니다.
 */

import { toISODateString } from '@/lib/utils/dateUtils';
import type { BookingData } from './bookings';
import {
  readBookingsArray,
  getAllBookings,
  writeBookingsArray,
  deleteBooking,
  syncBookingsNow,
} from './bookings';

/**
 * 예약 데이터 구조 (호스트 대시보드 등)
 */
export interface ReservationData {
  id?: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  checkInDate: string | Date;
  checkOutDate: string | Date;
  createdAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  notes?: string;
}

/** DB 예약 한 건을 호스트 UI용 Reservation 형태로만 변환 (원장 복제 아님) */
export function bookingToReservation(b: BookingData): ReservationData {
  return {
    id: b.id,
    propertyId: b.propertyId,
    tenantId: b.guestId,
    ownerId: b.ownerId,
    status: b.status,
    checkInDate: toISODateString(b.checkInDate) || String(b.checkInDate),
    checkOutDate: toISODateString(b.checkOutDate) || String(b.checkOutDate),
    createdAt: b.createdAt,
    confirmedAt: b.confirmedAt,
    completedAt: b.completedAt,
    cancelledAt: b.cancelledAt,
    tenantName: b.guestName,
    tenantEmail: b.guestEmail,
    tenantPhone: b.guestPhone,
    notes: b.guestMessage,
  };
}

/**
 * 동기 스냅샷: `readBookingsArray`와 동일 시점의 메모리(또는 readwrite 시 LS 시드)를 매핑합니다.
 * off 모드에서는 반드시 선행 `getAllBookings` / `ensureBookingsLoadedForApp` 후 호출하는 것이 안전합니다.
 */
export function readReservationsArray(): ReservationData[] {
  if (typeof window === 'undefined') return [];
  return readBookingsArray().map(bookingToReservation);
}

/**
 * 레거시 호환: 원장은 bookings만 갱신합니다. UI 이벤트만 발생시킵니다.
 */
export function saveReservationsSnapshot(all?: ReservationData[]): void {
  void all;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reservationsUpdated'));
  }
}

/**
 * 모든 예약 조회 (비동기: 서버 하이드레이션 포함)
 */
export async function getAllReservations(): Promise<ReservationData[]> {
  if (typeof window === 'undefined') return [];
  try {
    const bookings = await getAllBookings();
    return bookings.map(bookingToReservation);
  } catch (error) {
    console.error('Error getting reservations:', error);
    return [];
  }
}

/**
 * 임대인의 예약 목록 조회
 */
export async function getReservationsByOwner(
  ownerId: string,
  filterType: 'active' | 'completed' | 'all' = 'active'
): Promise<ReservationData[]> {
  try {
    const allReservations = await getAllReservations();

    let filtered = allReservations.filter((r) => r.ownerId === ownerId);

    if (filterType === 'active') {
      filtered = filtered.filter(
        (r) => r.status === 'pending' || r.status === 'confirmed'
      );
    } else if (filterType === 'completed') {
      filtered = filtered.filter(
        (r) => r.status === 'completed' || r.status === 'cancelled'
      );
    }

    return filtered.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting reservations by owner:', error);
    return [];
  }
}

/**
 * @deprecated 예약 생성은 `createBooking`만 사용하세요.
 */
export async function createReservation(
  reservation: Omit<ReservationData, 'id' | 'createdAt'>
): Promise<ReservationData> {
  void reservation;
  throw new Error(
    'createReservation is deprecated; use createBooking from @/lib/api/bookings'
  );
}

/**
 * 예약 상태 업데이트 (`reservationId` === booking.id).
 * 내부에서 `writeBookingsArray` + `syncBookingsNow` 로 서버 DB와 동일 경로로 반영합니다.
 */
export async function updateReservationStatus(
  reservationId: string,
  status: ReservationData['status']
): Promise<ReservationData | null> {
  if (typeof window === 'undefined') return null;

  const bookings = await getAllBookings();
  const index = bookings.findIndex((b) => b.id === reservationId);

  if (index === -1) return null;

  const now = new Date().toISOString();
  const prev = bookings[index];
  const next: BookingData = {
    ...prev,
    status,
    updatedAt: now,
  };

  if (status === 'confirmed' && !next.confirmedAt) {
    next.confirmedAt = now;
  } else if (status === 'completed' && !next.completedAt) {
    next.completedAt = now;
  } else if (status === 'cancelled' && !next.cancelledAt) {
    next.cancelledAt = now;
  }

  bookings[index] = next;
  writeBookingsArray(bookings);
  await syncBookingsNow(bookings);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reservationsUpdated'));
  }

  return bookingToReservation(next);
}

/**
 * 예약 삭제 (영구 삭제) — booking id와 동일
 */
export async function deleteReservation(reservationId: string): Promise<void> {
  await deleteBooking(reservationId);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reservationsUpdated'));
  }
}

/**
 * 예약 조회 (ID로)
 */
export async function getReservationById(
  reservationId: string
): Promise<ReservationData | null> {
  try {
    const allReservations = await getAllReservations();
    return allReservations.find((r) => r.id === reservationId) || null;
  } catch (error) {
    console.error('Error getting reservation by id:', error);
    return null;
  }
}
