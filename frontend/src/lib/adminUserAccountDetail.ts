'use client';

import type { BookingData } from '@/lib/api/bookings';
import {
  isContractCompletedTab,
  isContractInProgressTab,
  isContractSealedTab,
} from '@/lib/adminBookingFilters';

const MEMO_KEY = 'admin_user_detail_memos_v1';
const MAX_MEMO_LENGTH = 500;

export type AdminMemoEntry = {
  id: string;
  text: string;
  createdAt: string;
};

export type AdminUserMemos = {
  hostMemos: AdminMemoEntry[];
  guestMemos: AdminMemoEntry[];
  updatedAt?: string;
};

function genMemoId(): string {
  return `memo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeMemoText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_MEMO_LENGTH);
}

function normalizeEntries(raw: unknown): AdminMemoEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === 'object')
    .map((x) => {
      const item = x as { id?: unknown; text?: unknown; createdAt?: unknown };
      const text = typeof item.text === 'string' ? sanitizeMemoText(item.text) : '';
      if (!text) return null;
      const createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString();
      const id = typeof item.id === 'string' && item.id ? item.id : genMemoId();
      return { id, text, createdAt };
    })
    .filter((x): x is AdminMemoEntry => x != null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function normalizeUserMemo(raw: unknown): AdminUserMemos {
  if (!raw || typeof raw !== 'object') {
    return { hostMemos: [], guestMemos: [] };
  }
  const item = raw as {
    hostMemos?: unknown;
    guestMemos?: unknown;
    hostNote?: unknown;
    guestNote?: unknown;
    updatedAt?: unknown;
  };
  const hostMemos = normalizeEntries(item.hostMemos);
  const guestMemos = normalizeEntries(item.guestMemos);
  if (hostMemos.length === 0 && typeof item.hostNote === 'string' && item.hostNote.trim()) {
    hostMemos.push({
      id: genMemoId(),
      text: item.hostNote.trim(),
      createdAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    });
  }
  if (guestMemos.length === 0 && typeof item.guestNote === 'string' && item.guestNote.trim()) {
    guestMemos.push({
      id: genMemoId(),
      text: item.guestNote.trim(),
      createdAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    });
  }
  return {
    hostMemos: hostMemos.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    guestMemos: guestMemos.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
  };
}

function readAllMemos(): Record<string, AdminUserMemos> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(MEMO_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalized: Record<string, AdminUserMemos> = {};
    for (const [uid, value] of Object.entries(parsed)) {
      normalized[uid] = normalizeUserMemo(value);
    }
    return normalized;
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
  return all[uid] ?? { hostMemos: [], guestMemos: [] };
}

export function addAdminUserHostMemo(uid: string, text: string): void {
  const value = sanitizeMemoText(text);
  if (!value) return;
  const all = readAllMemos();
  const prev = all[uid] ?? { hostMemos: [], guestMemos: [] };
  all[uid] = {
    ...prev,
    hostMemos: [{ id: genMemoId(), text: value, createdAt: new Date().toISOString() }, ...prev.hostMemos],
    updatedAt: new Date().toISOString(),
  };
  writeAllMemos(all);
}

export function addAdminUserGuestMemo(uid: string, text: string): void {
  const value = sanitizeMemoText(text);
  if (!value) return;
  const all = readAllMemos();
  const prev = all[uid] ?? { hostMemos: [], guestMemos: [] };
  all[uid] = {
    ...prev,
    guestMemos: [{ id: genMemoId(), text: value, createdAt: new Date().toISOString() }, ...prev.guestMemos],
    updatedAt: new Date().toISOString(),
  };
  writeAllMemos(all);
}

export function deleteAdminUserHostMemo(uid: string, memoId: string): void {
  const all = readAllMemos();
  const prev = all[uid] ?? { hostMemos: [], guestMemos: [] };
  all[uid] = {
    ...prev,
    hostMemos: prev.hostMemos.filter((m) => m.id !== memoId),
    updatedAt: new Date().toISOString(),
  };
  writeAllMemos(all);
}

export function deleteAdminUserGuestMemo(uid: string, memoId: string): void {
  const all = readAllMemos();
  const prev = all[uid] ?? { hostMemos: [], guestMemos: [] };
  all[uid] = {
    ...prev,
    guestMemos: prev.guestMemos.filter((m) => m.id !== memoId),
    updatedAt: new Date().toISOString(),
  };
  writeAllMemos(all);
}

export function saveAdminUserHostMemo(uid: string, hostNote: string): void {
  // Backward-compatible API: overwrite host memo list with one row.
  const value = sanitizeMemoText(hostNote);
  const all = readAllMemos();
  const prev = all[uid] ?? { hostMemos: [], guestMemos: [] };
  all[uid] = {
    ...prev,
    hostMemos: value ? [{ id: genMemoId(), text: value, createdAt: new Date().toISOString() }] : [],
    updatedAt: new Date().toISOString(),
  };
  writeAllMemos(all);
}

export function saveAdminUserGuestMemo(uid: string, guestNote: string): void {
  // Backward-compatible API: overwrite guest memo list with one row.
  const value = sanitizeMemoText(guestNote);
  const all = readAllMemos();
  const prev = all[uid] ?? { hostMemos: [], guestMemos: [] };
  all[uid] = {
    ...prev,
    guestMemos: value ? [{ id: genMemoId(), text: value, createdAt: new Date().toISOString() }] : [],
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
