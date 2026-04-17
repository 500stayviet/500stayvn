'use client';

import {
  getLedgerEntries,
} from '@/lib/api/adminFinance';
import { getSettlementCandidatesServer } from '@/lib/api/settlementServer';
import { getUsers } from '@/lib/api/auth';
import { getAllBookingsForAdmin } from '@/lib/api/bookings';
import { isPropertyNew, isUserNew } from '@/lib/adminNewUtils';
import {
  isContractCompletedTab,
  isContractInProgressTab,
  isContractSealedTab,
  isRefundBeforeRental,
  isRefundDuringOrAfterRental,
} from '@/lib/adminBookingFilters';
import { getModerationAudits } from '@/lib/api/adminModeration';
import { getMergedAdminLogsForView } from '@/lib/adminSystemLog';
import { isParentPropertyRecord } from '@/lib/utils/propertyUtils';
import type { PropertyData } from '@/types/property';
import { canReadLocalFallback } from '@/lib/runtime/localFallbackPolicy';

/** adminModeration.ts 와 동일 키 (순환 참조 방지 위해 직접 읽기) */
const PROPERTIES_STORAGE_KEY = 'properties';

const KEY_USER_UIDS = 'admin_ack_new_user_uids_v1';
const KEY_PROP_IDS = 'admin_ack_new_property_ids_v1';
/** 승인 대기 탭에서 확인한 bookingId (새 건이 생기면 다시 알림) */
const KEY_SETTLEMENT_PENDING_BOOKINGS = 'admin_ack_settlement_pending_booking_ids_v1';
/** 승인 요청 탭에서 확인한 bookingId */
const KEY_SETTLEMENT_REQUEST_BOOKINGS = 'admin_ack_settlement_request_booking_ids_v1';
/** 감사 신규(24h) 탭에서 확인한 로그 키 */
const KEY_AUDIT_RECENT_KEYS = 'admin_ack_audit_recent_keys_v1';
/** KYC 신규(24h) 탭에서 확인한 사용자 uid */
const KEY_KYC_NEW_UIDS = 'admin_ack_kyc_new_uids_v1';
/** 계약 신규(24h) 탭에서 확인한 bookingId */
const KEY_CONTRACT_NEW_BOOKING_IDS = 'admin_ack_contract_new_booking_ids_v1';
/** 환불 신규(24h) 탭에서 확인한 bookingId */
const KEY_REFUND_NEW_BOOKING_IDS = 'admin_ack_refund_new_booking_ids_v1';
/** 시스템 로그 신규(24h) 탭에서 확인한 로그 id */
const KEY_SYSTEM_LOG_NEW_IDS = 'admin_ack_system_log_new_ids_v1';

type AckCategory =
  | 'users.new'
  | 'properties.new'
  | 'settlement.pending'
  | 'settlement.request'
  | 'audit.recent'
  | 'kyc.new'
  | 'contracts.new'
  | 'refunds.new'
  | 'system-log.new';

const KEY_TO_CATEGORY: Record<string, AckCategory> = {
  [KEY_USER_UIDS]: 'users.new',
  [KEY_PROP_IDS]: 'properties.new',
  [KEY_SETTLEMENT_PENDING_BOOKINGS]: 'settlement.pending',
  [KEY_SETTLEMENT_REQUEST_BOOKINGS]: 'settlement.request',
  [KEY_AUDIT_RECENT_KEYS]: 'audit.recent',
  [KEY_KYC_NEW_UIDS]: 'kyc.new',
  [KEY_CONTRACT_NEW_BOOKING_IDS]: 'contracts.new',
  [KEY_REFUND_NEW_BOOKING_IDS]: 'refunds.new',
  [KEY_SYSTEM_LOG_NEW_IDS]: 'system-log.new',
};

const ackCache = new Map<string, Set<string>>();
const ackHydrated = new Set<string>();

function readPropsRaw(): PropertyData[] {
  if (
    typeof window === 'undefined' ||
    typeof localStorage === 'undefined' ||
    !canReadLocalFallback()
  ) return [];
  try {
    const raw = localStorage.getItem(PROPERTIES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PropertyData[]) : [];
  } catch {
    return [];
  }
}

function readIdSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  const cached = ackCache.get(key);
  if (cached) return new Set(cached);
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    const set = new Set(Array.isArray(arr) ? arr : []);
    ackCache.set(key, set);
    if (!ackHydrated.has(key)) {
      ackHydrated.add(key);
      void hydrateAckSetFromServer(key);
    }
    return new Set(set);
  } catch {
    return new Set();
  }
}

function writeIdSet(key: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  const next = new Set(ids);
  ackCache.set(key, next);
  localStorage.setItem(key, JSON.stringify([...next]));
  void pushAckSetToServer(key, [...next]);
}

async function hydrateAckSetFromServer(key: string): Promise<void> {
  const category = KEY_TO_CATEGORY[key];
  if (!category || typeof window === 'undefined') return;
  try {
    const res = await fetch(`/api/admin/ack-state?category=${encodeURIComponent(category)}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return;
    const data = (await res.json()) as { ids?: string[] };
    const list = Array.isArray(data.ids) ? data.ids : [];
    const set = new Set(list.filter(Boolean));
    ackCache.set(key, set);
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

async function pushAckSetToServer(key: string, ids: string[]): Promise<void> {
  const category = KEY_TO_CATEGORY[key];
  if (!category || typeof window === 'undefined' || ids.length === 0) return;
  try {
    await fetch('/api/admin/ack-state', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, ids }),
    });
  } catch {
    /* ignore */
  }
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
  return readPropsRaw().filter(
    (p) => p.id && !p.deleted && isParentPropertyRecord(p) && isPropertyNew(p) && !ack.has(p.id)
  ).length;
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
    .filter((p) => p.id && !p.deleted && isParentPropertyRecord(p) && isPropertyNew(p))
    .forEach((p) => {
      if (p.id) ack.add(p.id);
    });
  writeIdSet(KEY_PROP_IDS, ack);
}

/** 상단 배지: 아직 '승인 요청'에서 확인하지 않은 건 수 */
export async function getUnseenSettlementRequestCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const rows = (await getSettlementCandidatesServer()).filter(
    (r) => r.approvalStatus === null && !r.inPendingQueue
  );
  const ack = readIdSet(KEY_SETTLEMENT_REQUEST_BOOKINGS);
  return rows.filter((p) => !ack.has(p.bookingId)).length;
}

/** 상단 배지: 아직 '승인 대기'에서 확인하지 않은 정산 건 수 */
export async function getUnseenSettlementPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const rows = (await getSettlementCandidatesServer()).filter(
    (r) => r.approvalStatus === null && r.inPendingQueue
  );
  const ack = readIdSet(KEY_SETTLEMENT_PENDING_BOOKINGS);
  return rows.filter((p) => !ack.has(p.bookingId)).length;
}

/** 정산 · 승인 요청 탭 진입 시 확인 처리 */
export async function acknowledgeCurrentSettlementRequest(): Promise<void> {
  if (typeof window === 'undefined') return;
  const rows = (await getSettlementCandidatesServer()).filter(
    (r) => r.approvalStatus === null && !r.inPendingQueue
  );
  const ack = readIdSet(KEY_SETTLEMENT_REQUEST_BOOKINGS);
  rows.forEach((p) => ack.add(p.bookingId));
  writeIdSet(KEY_SETTLEMENT_REQUEST_BOOKINGS, ack);
}

/** 정산 · 승인 대기 탭 진입 시 현재 대기 건 확인 → 알림 제거 (새 bookingId 생기면 다시 표시) */
export async function acknowledgeCurrentSettlementPending(): Promise<void> {
  if (typeof window === 'undefined') return;
  const rows = (await getSettlementCandidatesServer()).filter(
    (r) => r.approvalStatus === null && r.inPendingQueue
  );
  const ack = readIdSet(KEY_SETTLEMENT_PENDING_BOOKINGS);
  rows.forEach((p) => ack.add(p.bookingId));
  writeIdSet(KEY_SETTLEMENT_PENDING_BOOKINGS, ack);
}

function recentAuditKeysIn24h(): string[] {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const out: string[] = [];
  for (const e of getLedgerEntries()) {
    const t = new Date(e.createdAt).getTime();
    if (t >= dayAgo) out.push(`ledger:${e.id}`);
  }
  for (const e of getModerationAudits()) {
    const t = new Date(e.createdAt).getTime();
    if (t >= dayAgo) out.push(`mod:${e.id}`);
  }
  return out;
}

/** 상단 배지: 아직 신규(24h) 탭에서 확인하지 않은 감사 로그 건수 */
export function getUnseenRecentAuditCount(): number {
  if (typeof window === 'undefined') return 0;
  const ack = readIdSet(KEY_AUDIT_RECENT_KEYS);
  return recentAuditKeysIn24h().filter((k) => !ack.has(k)).length;
}

/** 감사 신규(24h) 탭 진입 시 현재 로그 확인 처리 */
export function acknowledgeCurrentRecentAudit(): void {
  if (typeof window === 'undefined') return;
  const ack = readIdSet(KEY_AUDIT_RECENT_KEYS);
  recentAuditKeysIn24h().forEach((k) => ack.add(k));
  writeIdSet(KEY_AUDIT_RECENT_KEYS, ack);
}

function isKycRelevantStatus(s: unknown): boolean {
  return s === 'pending' || s === 'verified' || s === 'rejected';
}

/** 상단 배지: 아직 KYC 신규 탭에서 확인하지 않은 신규(24h) KYC 사용자 수 */
export function getUnseenNewKycCount(): number {
  if (typeof window === 'undefined') return 0;
  const ack = readIdSet(KEY_KYC_NEW_UIDS);
  return getUsers().filter((u) => !u.deleted && isUserNew(u) && isKycRelevantStatus(u.verification_status) && !ack.has(u.uid)).length;
}

/** KYC 신규 탭 진입 시 현재 신규 KYC 사용자 확인 처리 */
export function acknowledgeCurrentNewKyc(): void {
  if (typeof window === 'undefined') return;
  const ack = readIdSet(KEY_KYC_NEW_UIDS);
  getUsers()
    .filter((u) => !u.deleted && isUserNew(u) && isKycRelevantStatus(u.verification_status))
    .forEach((u) => ack.add(u.uid));
  writeIdSet(KEY_KYC_NEW_UIDS, ack);
}

function isRecent(ts: unknown): boolean {
  const t = new Date(String(ts || '')).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < 24 * 60 * 60 * 1000;
}

async function getCurrentNewContractBookingIds(): Promise<string[]> {
  const rows = await getAllBookingsForAdmin();
  const now = new Date();
  return rows
    .filter((b) => isContractSealedTab(b, now) || isContractInProgressTab(b, now) || isContractCompletedTab(b, now))
    .filter((b) => isRecent(b.updatedAt || b.createdAt))
    .map((b) => b.id)
    .filter((id): id is string => !!id);
}

async function getCurrentNewRefundBookingIds(): Promise<string[]> {
  const rows = await getAllBookingsForAdmin();
  return rows
    .filter((b) => isRefundBeforeRental(b) || isRefundDuringOrAfterRental(b))
    .filter((b) => isRecent(b.updatedAt || b.cancelledAt || b.createdAt))
    .map((b) => b.id)
    .filter((id): id is string => !!id);
}

export async function getUnseenNewContractCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const ack = readIdSet(KEY_CONTRACT_NEW_BOOKING_IDS);
  const ids = await getCurrentNewContractBookingIds();
  return ids.filter((id) => !ack.has(id)).length;
}

export async function acknowledgeCurrentNewContracts(): Promise<void> {
  if (typeof window === 'undefined') return;
  const ack = readIdSet(KEY_CONTRACT_NEW_BOOKING_IDS);
  const ids = await getCurrentNewContractBookingIds();
  ids.forEach((id) => ack.add(id));
  writeIdSet(KEY_CONTRACT_NEW_BOOKING_IDS, ack);
}

export async function getUnseenNewRefundCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const ack = readIdSet(KEY_REFUND_NEW_BOOKING_IDS);
  const ids = await getCurrentNewRefundBookingIds();
  return ids.filter((id) => !ack.has(id)).length;
}

export async function acknowledgeCurrentNewRefunds(): Promise<void> {
  if (typeof window === 'undefined') return;
  const ack = readIdSet(KEY_REFUND_NEW_BOOKING_IDS);
  const ids = await getCurrentNewRefundBookingIds();
  ids.forEach((id) => ack.add(id));
  writeIdSet(KEY_REFUND_NEW_BOOKING_IDS, ack);
}

function getCurrentNewSystemLogIds(): string[] {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return getMergedAdminLogsForView()
    .filter((e) => Number.isFinite(e.ts) && e.ts >= dayAgo)
    .map((e) => e.id)
    .filter(Boolean);
}

export function getUnseenNewSystemLogCount(): number {
  if (typeof window === 'undefined') return 0;
  const ack = readIdSet(KEY_SYSTEM_LOG_NEW_IDS);
  return getCurrentNewSystemLogIds().filter((id) => !ack.has(id)).length;
}

export function acknowledgeCurrentNewSystemLogs(): void {
  if (typeof window === 'undefined') return;
  const ack = readIdSet(KEY_SYSTEM_LOG_NEW_IDS);
  getCurrentNewSystemLogIds().forEach((id) => ack.add(id));
  writeIdSet(KEY_SYSTEM_LOG_NEW_IDS, ack);
}
