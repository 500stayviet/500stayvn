'use client';

import { getAdminFinanceLedgerEntriesSince } from '@/lib/api/financeServer';
import { getSettlementCandidatesServer } from '@/lib/api/settlementServer';
import { getUsers, type UserData } from '@/lib/api/auth';
import { getAllBookingsForAdmin } from '@/lib/api/bookings';
import {
  adminPropertyLastActivityMs,
  adminUserLastActivityMs,
  isPropertyNew,
  isUserNew,
} from '@/lib/adminNewUtils';
import {
  isContractCompletedTab,
  isContractInProgressTab,
  isContractSealedTab,
  isRefundBeforeRental,
  isRefundDuringOrAfterRental,
} from '@/lib/adminBookingFilters';
import { ensureModerationAuditsLoaded, getModerationAudits } from '@/lib/api/adminModeration';
import { getMergedAdminLogsForView } from '@/lib/adminSystemLog';
import { isParentPropertyRecord } from '@/lib/utils/propertyUtils';
import type { PropertyData } from '@/types/property';
import { ADMIN_ACK_STATE_UPDATED } from '@/lib/adminAckConstants';
import { readPropertiesArray } from '@/lib/api/properties';

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

function readIdSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  if (!ackHydrated.has(key)) {
    ackHydrated.add(key);
    void hydrateAckSetFromServer(key);
  }
  const cached = ackCache.get(key);
  return cached ? new Set(cached) : new Set();
}

function writeIdSet(key: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  const next = new Set(ids);
  ackCache.set(key, next);
  window.dispatchEvent(new CustomEvent(ADMIN_ACK_STATE_UPDATED));
  void (async () => {
    await pushAckSetToServer(key, [...next]);
    await hydrateAckSetFromServer(key);
    window.dispatchEvent(new CustomEvent(ADMIN_ACK_STATE_UPDATED));
  })();
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
    window.dispatchEvent(new CustomEvent(ADMIN_ACK_STATE_UPDATED));
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

let propertyAckDetailCache: { map: Map<string, Date>; fetchedAt: number } | null = null;
const PROPERTY_ACK_DETAIL_TTL_MS = 45_000;

export function invalidatePropertyAckDetailCache(): void {
  propertyAckDetailCache = null;
}

/** 서버에 저장된 매물 신규 확인 시각(관리자별). 짧은 TTL 캐시로 `/api/admin/ack-state` 호출을 줄입니다. */
export async function fetchPropertyAcknowledgedAtMap(force = false): Promise<Map<string, Date>> {
  if (typeof window === 'undefined') return new Map();
  if (
    !force &&
    propertyAckDetailCache &&
    Date.now() - propertyAckDetailCache.fetchedAt < PROPERTY_ACK_DETAIL_TTL_MS
  ) {
    return new Map(propertyAckDetailCache.map);
  }
  try {
    const res = await fetch('/api/admin/ack-state?category=properties.new&detail=1', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return new Map();
    const data = (await res.json()) as {
      entries?: Array<{ targetId?: string; acknowledgedAt?: string }>;
    };
    const m = new Map<string, Date>();
    if (!Array.isArray(data.entries)) return m;
    for (const e of data.entries) {
      if (!e.targetId || !e.acknowledgedAt) continue;
      const d = new Date(e.acknowledgedAt);
      if (Number.isFinite(d.getTime())) m.set(e.targetId, d);
    }
    propertyAckDetailCache = { map: m, fetchedAt: Date.now() };
    return new Map(m);
  } catch {
    return new Map();
  }
}

/** 매물 행·상세 진입 시 해당 매물만 확인 처리(알림 제거). */
export function acknowledgeNewProperty(propertyId: string): void {
  if (typeof window === 'undefined' || !propertyId) return;
  const ack = readIdSet(KEY_PROP_IDS);
  ack.add(propertyId);
  invalidatePropertyAckDetailCache();
  writeIdSet(KEY_PROP_IDS, ack);
}

/**
 * 신규 탭 알림: 미확인(또는 확인 후 매물이 다시 수정됨).
 * `ackAtById`가 있으면 서버 확인 시각과 마지막 수정 시각을 비교한다.
 */
export function isAdminPropertyNewUnseen(
  p: PropertyData,
  ackAtById: Map<string, Date> | null = null
): boolean {
  if (typeof window === 'undefined' || !p.id || p.deleted) return false;
  if (!isParentPropertyRecord(p)) return false;
  const activity = adminPropertyLastActivityMs(p);
  if (activity <= 0) return false;
  if (ackAtById != null) {
    const acked = ackAtById.get(p.id);
    if (!acked) return true;
    if (activity > acked.getTime()) {
      return true;
    }
    return false;
  }
  if (!isPropertyNew(p)) return false;
  return !readIdSet(KEY_PROP_IDS).has(p.id);
}

export function countUnseenNewProperties(ackAtById: Map<string, Date> | null): number {
  if (typeof window === 'undefined') return 0;
  return readPropertiesArray().filter(
    (p) =>
      p.id &&
      !p.deleted &&
      isParentPropertyRecord(p) &&
      isAdminPropertyNewUnseen(p, ackAtById)
  ).length;
}

let userAckDetailCache: { map: Map<string, Date>; fetchedAt: number } | null = null;
const USER_ACK_DETAIL_TTL_MS = 45_000;

export function invalidateUserAckDetailCache(): void {
  userAckDetailCache = null;
}

function dropAckKeys(keys: string[]): void {
  for (const k of keys) {
    ackCache.delete(k);
    ackHydrated.delete(k);
  }
}

/**
 * SSE `AdminDomainEvent` 수신 시, 해당 리소스와 직접 연관된 in-memory ack 캐시만 비웁니다.
 * 다음 `readIdSet`에서 서버 hydrate로 다시 맞춥니다.
 */
export function invalidateAdminAckCachesForResource(resource: string | undefined): void {
  if (typeof window === 'undefined' || !resource) return;
  switch (resource) {
    case 'booking':
      dropAckKeys([
        KEY_SETTLEMENT_PENDING_BOOKINGS,
        KEY_SETTLEMENT_REQUEST_BOOKINGS,
        KEY_CONTRACT_NEW_BOOKING_IDS,
        KEY_REFUND_NEW_BOOKING_IDS,
      ]);
      break;
    case 'user':
      invalidateUserAckDetailCache();
      dropAckKeys([KEY_USER_UIDS, KEY_KYC_NEW_UIDS]);
      break;
    case 'property':
      invalidatePropertyAckDetailCache();
      dropAckKeys([KEY_PROP_IDS]);
      break;
    case 'audit':
      dropAckKeys([KEY_AUDIT_RECENT_KEYS]);
      break;
    case 'system_log':
      dropAckKeys([KEY_SYSTEM_LOG_NEW_IDS]);
      break;
    case 'payment':
      dropAckKeys([
        KEY_SETTLEMENT_PENDING_BOOKINGS,
        KEY_SETTLEMENT_REQUEST_BOOKINGS,
        KEY_CONTRACT_NEW_BOOKING_IDS,
        KEY_REFUND_NEW_BOOKING_IDS,
      ]);
      break;
    case 'adminFinanceLedger':
      dropAckKeys([
        KEY_AUDIT_RECENT_KEYS,
        KEY_SETTLEMENT_PENDING_BOOKINGS,
        KEY_SETTLEMENT_REQUEST_BOOKINGS,
        KEY_CONTRACT_NEW_BOOKING_IDS,
        KEY_REFUND_NEW_BOOKING_IDS,
      ]);
      break;
    case 'admin_bank_account':
      dropAckKeys([
        KEY_SETTLEMENT_PENDING_BOOKINGS,
        KEY_SETTLEMENT_REQUEST_BOOKINGS,
      ]);
      break;
    case 'adminWithdrawalRequest':
      dropAckKeys([
        KEY_SETTLEMENT_PENDING_BOOKINGS,
        KEY_SETTLEMENT_REQUEST_BOOKINGS,
      ]);
      break;
    default:
      return;
  }
  window.dispatchEvent(new CustomEvent(ADMIN_ACK_STATE_UPDATED));
}

/** 서버에 저장된 계정 신규 확인 시각(관리자별). */
export async function fetchUserAcknowledgedAtMap(force = false): Promise<Map<string, Date>> {
  if (typeof window === 'undefined') return new Map();
  if (
    !force &&
    userAckDetailCache &&
    Date.now() - userAckDetailCache.fetchedAt < USER_ACK_DETAIL_TTL_MS
  ) {
    return new Map(userAckDetailCache.map);
  }
  try {
    const res = await fetch('/api/admin/ack-state?category=users.new&detail=1', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return new Map();
    const data = (await res.json()) as {
      entries?: Array<{ targetId?: string; acknowledgedAt?: string }>;
    };
    const m = new Map<string, Date>();
    if (!Array.isArray(data.entries)) return m;
    for (const e of data.entries) {
      if (!e.targetId || !e.acknowledgedAt) continue;
      const d = new Date(e.acknowledgedAt);
      if (Number.isFinite(d.getTime())) m.set(e.targetId, d);
    }
    userAckDetailCache = { map: m, fetchedAt: Date.now() };
    return new Map(m);
  } catch {
    return new Map();
  }
}

/** 계정 행·상세 진입 시 해당 uid만 확인 처리. */
export function acknowledgeNewUser(uid: string): void {
  if (typeof window === 'undefined' || !uid) return;
  const ack = readIdSet(KEY_USER_UIDS);
  ack.add(uid);
  invalidateUserAckDetailCache();
  writeIdSet(KEY_USER_UIDS, ack);
}

/**
 * 신규 탭 알림: 미확인(또는 확인 후 계정 정보가 다시 갱신됨).
 */
export function isAdminUserNewUnseen(
  u: Pick<UserData, 'uid' | 'createdAt' | 'updatedAt' | 'deleted'>,
  ackAtById: Map<string, Date> | null = null
): boolean {
  if (typeof window === 'undefined' || !u.uid || u.deleted) return false;
  if (!isUserNew(u)) return false;
  const activity = adminUserLastActivityMs(u);
  if (ackAtById != null) {
    const acked = ackAtById.get(u.uid);
    if (!acked) return true;
    return activity > acked.getTime();
  }
  return !readIdSet(KEY_USER_UIDS).has(u.uid);
}

export function countUnseenNewUsers(ackAtById: Map<string, Date> | null): number {
  if (typeof window === 'undefined') return 0;
  return getUsers().filter(
    (u) => !u.deleted && isUserNew(u) && isAdminUserNewUnseen(u, ackAtById)
  ).length;
}

/** 상단 배지: 아직 '신규' 탭에서 확인하지 않은 신규 계정 수(서버 ack를 메모리 캐시로 반영 — 상세 탭은 `fetchUserAcknowledgedAtMap`) */
export function getUnseenNewUserCount(): number {
  return countUnseenNewUsers(null);
}

/** 상단 배지: 아직 '신규' 탭에서 확인하지 않은 신규 매물 수(서버 ack를 메모리 캐시로 반영 — 상세는 `fetchPropertyAcknowledgedAtMap`) */
export function getUnseenNewPropertyCount(): number {
  return countUnseenNewProperties(null);
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

async function recentAuditKeysIn24hAsync(): Promise<string[]> {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const sinceIso = new Date(dayAgo).toISOString();
  let ledgerKeys: string[] = [];
  try {
    const ledger = await getAdminFinanceLedgerEntriesSince(sinceIso);
    ledgerKeys = ledger.map((e) => `ledger:${e.id}`);
  } catch {
    ledgerKeys = [];
  }
  await ensureModerationAuditsLoaded();
  const out: string[] = [...ledgerKeys];
  for (const e of getModerationAudits()) {
    const t = new Date(e.createdAt).getTime();
    if (t >= dayAgo) out.push(`mod:${e.id}`);
  }
  return out;
}

/** 상단 배지: 아직 신규(24h) 탭에서 확인하지 않은 감사 로그 건수 */
export async function getUnseenRecentAuditCountAsync(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const keys = await recentAuditKeysIn24hAsync();
  const ack = readIdSet(KEY_AUDIT_RECENT_KEYS);
  return keys.filter((k) => !ack.has(k)).length;
}

/** 감사 신규(24h) 탭 진입 시 현재 로그 확인 처리 */
export async function acknowledgeCurrentRecentAudit(): Promise<void> {
  if (typeof window === 'undefined') return;
  const ack = readIdSet(KEY_AUDIT_RECENT_KEYS);
  const keys = await recentAuditKeysIn24hAsync();
  keys.forEach((k) => ack.add(k));
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
