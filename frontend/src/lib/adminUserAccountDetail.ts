'use client';

import type { BookingData } from '@/lib/api/bookings';
import {
  isContractCompletedTab,
  isContractInProgressTab,
  isContractSealedTab,
} from '@/lib/adminBookingFilters';

const MEMO_KEY = 'admin_user_detail_memos_v1';

export type AdminUserMemos = {
  hostNote: string;
  guestNote: string;
  updatedAt?: string;
};

function readAllMemos(): Record<string, AdminUserMemos> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(MEMO_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AdminUserMemos>) : {};
  } catch {
    return {};
  }
}

function writeAllMemos(data: Record<string, AdminUserMemos>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MEMO_KEY, JSON.stringify(data));
}

export function getAdminUserMemos(uid: string): AdminUserMemos {
  const all = readAllMemos();
  return all[uid] ?? { hostNote: '', guestNote: '' };
}

export function saveAdminUserHostMemo(uid: string, hostNote: string): void {
  const all = readAllMemos();
  const prev = all[uid] ?? { hostNote: '', guestNote: '' };
  all[uid] = {
    ...prev,
    hostNote,
    updatedAt: new Date().toISOString(),
  };
  writeAllMemos(all);
}

export function saveAdminUserGuestMemo(uid: string, guestNote: string): void {
  const all = readAllMemos();
  const prev = all[uid] ?? { hostNote: '', guestNote: '' };
  all[uid] = {
    ...prev,
    guestNote,
    updatedAt: new Date().toISOString(),
  };
  writeAllMemos(all);
}

export type HostBookingStats = {
  total: number;
  inProgress: number;
  completed: number;
  cancelled: number;
};

export type GuestBookingStats = {
  currentReservations: number;
  depositPending: number;
  contractCompleted: number;
  cancelled: number;
};

export function computeHostBookingStats(
  bookings: BookingData[],
  ownerId: string,
  now: Date
): HostBookingStats {
  const mine = bookings.filter((b) => b.ownerId === ownerId);
  let inProgress = 0;
  let completed = 0;
  let cancelled = 0;
  for (const b of mine) {
    if (b.status === 'cancelled') {
      cancelled += 1;
      continue;
    }
    if (b.status === 'completed' || isContractCompletedTab(b, now)) {
      completed += 1;
      continue;
    }
    if (
      b.paymentStatus === 'paid' &&
      b.status === 'confirmed' &&
      (isContractSealedTab(b, now) || isContractInProgressTab(b, now))
    ) {
      inProgress += 1;
    }
  }
  return {
    total: mine.length,
    inProgress,
    completed,
    cancelled,
  };
}

export function computeGuestBookingStats(
  bookings: BookingData[],
  guestId: string,
  now: Date
): GuestBookingStats {
  const mine = bookings.filter((b) => b.guestId === guestId);
  let currentReservations = 0;
  let depositPending = 0;
  let contractCompleted = 0;
  let cancelled = 0;
  for (const b of mine) {
    if (b.status === 'cancelled') {
      cancelled += 1;
      continue;
    }
    if (b.paymentStatus === 'pending') {
      depositPending += 1;
      continue;
    }
    if (b.status === 'completed' || isContractCompletedTab(b, now)) {
      contractCompleted += 1;
      continue;
    }
    if (
      b.paymentStatus === 'paid' &&
      b.status === 'confirmed' &&
      (isContractSealedTab(b, now) || isContractInProgressTab(b, now))
    ) {
      currentReservations += 1;
    }
  }
  return {
    currentReservations,
    depositPending,
    contractCompleted,
    cancelled,
  };
}

export type GuestRefundRow = {
  bookingId: string;
  propertyTitle: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  priceUnit: string;
  paymentStatus: string;
  refundAdminApproved?: boolean;
  cancelledAt?: string;
};

export function getGuestRefundRelatedBookings(
  bookings: BookingData[],
  guestId: string
): GuestRefundRow[] {
  return bookings
    .filter((b) => b.guestId === guestId)
    .filter(
      (b) =>
        b.paymentStatus === 'refunded' ||
        (b.status === 'cancelled' && b.paymentStatus === 'paid')
    )
    .map((b) => ({
      bookingId: b.id ?? '—',
      propertyTitle: b.propertyTitle ?? '—',
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      totalPrice: b.totalPrice,
      priceUnit: b.priceUnit,
      paymentStatus: b.paymentStatus,
      refundAdminApproved: b.refundAdminApproved,
      cancelledAt: b.cancelledAt,
    }))
    .sort((a, b) => (b.cancelledAt || '').localeCompare(a.cancelledAt || ''));
}
