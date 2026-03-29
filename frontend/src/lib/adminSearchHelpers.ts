'use client';

import { getUsers } from '@/lib/api/auth';
import type { BookingData } from '@/lib/api/bookings';
import type { SettlementCandidate, WithdrawalRequest } from '@/lib/api/adminFinance';

/** ownerId → 이메일 (관리자 검색용) */
export function getOwnerEmailMap(): Map<string, string> {
  const m = new Map<string, string>();
  getUsers().forEach((u) => {
    if (u.uid && !u.deleted) m.set(u.uid, (u.email || '').trim());
  });
  return m;
}

/** UID·이메일을 먼저 매칭, 그다음 매물·예약 관련 필드 */
export function filterSettlementsBySearch(
  list: SettlementCandidate[],
  query: string,
  emailMap: Map<string, string>
): SettlementCandidate[] {
  const k = query.trim().toLowerCase();
  if (!k) return list;
  return list.filter((row) => {
    const uid = (row.ownerId || '').toLowerCase();
    const email = (emailMap.get(row.ownerId) || '').toLowerCase();
    if (uid.includes(k) || email.includes(k)) return true;
    if ((row.propertyTitle || '').toLowerCase().includes(k)) return true;
    if ((row.propertyAddress || '').toLowerCase().includes(k)) return true;
    if ((row.bookingId || '').toLowerCase().includes(k)) return true;
    if (`${row.checkInDate} ${row.checkOutDate}`.toLowerCase().includes(k)) return true;
    if (String(row.amount).includes(k)) return true;
    return false;
  });
}

export function filterWithdrawalsBySearch(
  list: WithdrawalRequest[],
  query: string,
  emailMap: Map<string, string>
): WithdrawalRequest[] {
  const k = query.trim().toLowerCase();
  if (!k) return list;
  return list.filter((r) => {
    const uid = (r.ownerId || '').toLowerCase();
    const email = (emailMap.get(r.ownerId) || '').toLowerCase();
    if (uid.includes(k) || email.includes(k)) return true;
    if ((r.bankLabel || '').toLowerCase().includes(k)) return true;
    if ((r.id || '').toLowerCase().includes(k)) return true;
    if (String(r.amount).includes(k)) return true;
    return false;
  });
}

export function filterBookingsBySearch(
  list: BookingData[],
  query: string,
  emailMap: Map<string, string>
): BookingData[] {
  const k = query.trim().toLowerCase();
  if (!k) return list;
  return list.filter((b) => {
    const uid = (b.ownerId || '').toLowerCase();
    const email = (emailMap.get(b.ownerId) || '').toLowerCase();
    if (uid.includes(k) || email.includes(k)) return true;
    if ((b.id || '').toLowerCase().includes(k)) return true;
    if ((b.propertyTitle || '').toLowerCase().includes(k)) return true;
    if ((b.propertyAddress || '').toLowerCase().includes(k)) return true;
    if (`${b.checkInDate} ${b.checkOutDate}`.toLowerCase().includes(k)) return true;
    if (String(b.totalPrice).includes(k)) return true;
    return false;
  });
}
