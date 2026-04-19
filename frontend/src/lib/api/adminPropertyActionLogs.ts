'use client';

import {
  emitUserFacingSyncError,
  fetchWithRetry,
  isClientAuthErrorStatus,
  USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
} from '@/lib/runtime/networkResilience';
import { withAppActor } from '@/lib/api/withAppActor';

export type PropertyActionType = 'DELETED' | 'CANCELLED';

export type AdminPropertyActionLogRow = {
  id: string;
  propertyId: string;
  actionType: PropertyActionType;
  reason: string | null;
  adminId: string | null;
  snapshotJson: unknown;
  reservationId: string | null;
  ownerId: string | null;
  createdAt: Date | string;
};

let actionLogsCache: AdminPropertyActionLogRow[] | null = null;
let actionLogsLoadInFlight: Promise<void> | null = null;

export function invalidateAdminPropertyActionLogsCache(): void {
  actionLogsCache = null;
}

function normalizeRow(raw: unknown): AdminPropertyActionLogRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id : '';
  const propertyId = typeof r.propertyId === 'string' ? r.propertyId : '';
  const actionType = r.actionType as PropertyActionType;
  if (!id || !propertyId || (actionType !== 'DELETED' && actionType !== 'CANCELLED')) return null;
  return {
    id,
    propertyId,
    actionType,
    reason: typeof r.reason === 'string' ? r.reason : r.reason == null ? null : String(r.reason),
    adminId: typeof r.adminId === 'string' ? r.adminId : r.adminId == null ? null : String(r.adminId),
    snapshotJson: r.snapshotJson,
    reservationId: typeof r.reservationId === 'string' ? r.reservationId : null,
    ownerId: typeof r.ownerId === 'string' ? r.ownerId : null,
    createdAt: (r.createdAt as string | Date) ?? '',
  };
}

async function fetchAdminPropertyActionLogsFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetchWithRetry(
      '/api/admin/property-action-logs?limit=2000',
      { credentials: 'include', cache: 'no-store' },
      { retries: 1, baseDelayMs: 300 }
    );
    if (!res.ok) {
      if (isClientAuthErrorStatus(res.status)) {
        emitUserFacingSyncError({
          area: 'properties',
          action: 'property_action_logs',
          message: USER_FACING_CLIENT_AUTH_ERROR_MESSAGE,
        });
      }
      return;
    }
    const j = (await res.json()) as { rows?: unknown[] };
    const rows = Array.isArray(j.rows) ? j.rows : [];
    actionLogsCache = rows.map(normalizeRow).filter((x): x is AdminPropertyActionLogRow => x != null);
  } catch {
    /* ignore */
  }
}

/** 관리자: 매물 삭제·취소 로그를 서버에서 불러와 메모리 캐시에 넣습니다. */
export async function ensureAdminPropertyActionLogsLoaded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (actionLogsLoadInFlight) return actionLogsLoadInFlight;
  actionLogsLoadInFlight = fetchAdminPropertyActionLogsFromServer().finally(() => {
    actionLogsLoadInFlight = null;
  });
  return actionLogsLoadInFlight;
}

export function getAdminPropertyActionLogsCached(): AdminPropertyActionLogRow[] {
  return actionLogsCache ?? [];
}

export type PostAppPropertyActionLogInput = {
  propertyId: string;
  actionType: PropertyActionType;
  reason?: string;
  reservationId?: string;
  ownerId?: string;
  snapshot?: unknown;
};

/** 앱 사용자(호스트) — 본인 소유 매물에 대한 로그만 기록 */
export async function postAppPropertyActionLog(input: PostAppPropertyActionLogInput): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetchWithRetry(
      '/api/app/property-action-logs',
      withAppActor({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: input.propertyId,
          actionType: input.actionType,
          reason: input.reason,
          reservationId: input.reservationId,
          ownerId: input.ownerId,
          snapshot: input.snapshot,
        }),
      }),
      { retries: 1, baseDelayMs: 400 }
    );
    if (res.ok) invalidateAdminPropertyActionLogsCache();
    return res.ok;
  } catch {
    return false;
  }
}

/** 관리자 세션으로 직접 행 추가(수동 보정 등) */
export async function postAdminPropertyActionLog(input: PostAppPropertyActionLogInput): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetchWithRetry(
      '/api/admin/property-action-logs',
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: input.propertyId,
          actionType: input.actionType,
          reason: input.reason,
          reservationId: input.reservationId,
          ownerId: input.ownerId,
          snapshot: input.snapshot,
        }),
      },
      { retries: 1, baseDelayMs: 400 }
    );
    if (res.ok) invalidateAdminPropertyActionLogsCache();
    return res.ok;
  } catch {
    return false;
  }
}
