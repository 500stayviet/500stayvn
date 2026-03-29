'use client';

import { getSettlementCandidates } from '@/lib/api/adminFinance';
import { getUsers } from '@/lib/api/auth';
import { isPropertyNew, isUserNew } from '@/lib/adminNewUtils';
import type { PropertyData } from '@/types/property';

/** adminModeration.ts 와 동일 키 (순환 참조 방지 위해 직접 읽기) */
const PROPERTIES_STORAGE_KEY = 'properties';

const KEY_USER_UIDS = 'admin_ack_new_user_uids_v1';
const KEY_PROP_IDS = 'admin_ack_new_property_ids_v1';
/** 승인 대기 탭에서 확인한 bookingId (새 건이 생기면 다시 알림) */
const KEY_SETTLEMENT_PENDING_BOOKINGS = 'admin_ack_settlement_pending_booking_ids_v1';

function readPropsRaw(): PropertyData[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROPERTIES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PropertyData[]) : [];
  } catch {
    return [];
  }
}

function readIdSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeIdSet(key: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify([...ids]));
}

/** 상단 배지: 아직 '신규' 탭에서 확인하지 않은 신규 계정 수 */
export function getUnseenNewUserCount(): number {
  if (typeof window === 'undefined') return 0;
  const ack = readIdSet(KEY_USER_UIDS);
  return getUsers().filter((u) => !u.deleted && isUserNew(u) && !ack.has(u.uid)).length;
}

/** 상단 배지: 아직 '신규' 탭에서 확인하지 않은 신규 매물 수 */
export function getUnseenNewPropertyCount(): number {
  if (typeof window === 'undefined') return 0;
  const ack = readIdSet(KEY_PROP_IDS);
  return readPropsRaw().filter((p) => p.id && !p.deleted && isPropertyNew(p) && !ack.has(p.id))
    .length;
}

/** 신규 탭 진입 시 현재 신규 목록을 확인 처리 → 해당 알림 제거 */
export function acknowledgeCurrentNewUsers(): void {
  if (typeof window === 'undefined') return;
  const ack = readIdSet(KEY_USER_UIDS);
  getUsers()
    .filter((u) => !u.deleted && isUserNew(u))
    .forEach((u) => ack.add(u.uid));
  writeIdSet(KEY_USER_UIDS, ack);
}

export function acknowledgeCurrentNewProperties(): void {
  if (typeof window === 'undefined') return;
  const ack = readIdSet(KEY_PROP_IDS);
  readPropsRaw()
    .filter((p) => p.id && !p.deleted && isPropertyNew(p))
    .forEach((p) => {
      if (p.id) ack.add(p.id);
    });
  writeIdSet(KEY_PROP_IDS, ack);
}

/** 상단 배지: 아직 '승인 대기'에서 확인하지 않은 정산 건 수 */
export async function getUnseenSettlementPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const rows = await getSettlementCandidates();
  const pending = rows.filter((i) => i.approvalStatus === null);
  const ack = readIdSet(KEY_SETTLEMENT_PENDING_BOOKINGS);
  return pending.filter((p) => !ack.has(p.bookingId)).length;
}

/** 정산 · 승인 대기 탭 진입 시 현재 대기 건 확인 → 알림 제거 (새 bookingId 생기면 다시 표시) */
export async function acknowledgeCurrentSettlementPending(): Promise<void> {
  if (typeof window === 'undefined') return;
  const rows = await getSettlementCandidates();
  const pending = rows.filter((i) => i.approvalStatus === null);
  const ack = readIdSet(KEY_SETTLEMENT_PENDING_BOOKINGS);
  pending.forEach((p) => ack.add(p.bookingId));
  writeIdSet(KEY_SETTLEMENT_PENDING_BOOKINGS, ack);
}
