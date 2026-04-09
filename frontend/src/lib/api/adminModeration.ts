'use client';

import { getUsers, refreshUsersFromServer, saveUsers, UserData } from '@/lib/api/auth';
import { readPropertiesArray, writePropertiesArray } from '@/lib/api/properties';
import { isPropertyNew, isUserNew } from '@/lib/adminNewUtils';
import { PropertyData } from '@/types/property';
import { canReadLocalFallback, canWriteLocalFallback } from '@/lib/runtime/localFallbackPolicy';

const MODERATION_AUDIT_KEY = 'admin_moderation_audit_v1';
let moderationAuditCache: ModerationAuditEntry[] | null = null;

export interface ModerationAuditEntry {
  id: string;
  action:
    | 'user_blocked'
    | 'user_restored'
    | 'property_hidden'
    | 'property_restored'
    | 'property_ad_ended_by_host'
    | 'property_deleted_by_host';
  targetType: 'user' | 'property';
  targetId: string;
  ownerId?: string;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readModerationAudits(): ModerationAuditEntry[] {
  if (moderationAuditCache) return moderationAuditCache;
  if (
    typeof window === 'undefined' ||
    typeof localStorage === 'undefined' ||
    !canReadLocalFallback()
  ) return [];
  try {
    const raw = localStorage.getItem(MODERATION_AUDIT_KEY);
    const rows = raw ? (JSON.parse(raw) as ModerationAuditEntry[]) : [];
    moderationAuditCache = rows;
    return rows;
  } catch {
    return [];
  }
}

function saveModerationAudits(rows: ModerationAuditEntry[]): void {
  if (
    typeof window === 'undefined' ||
    typeof localStorage === 'undefined' ||
    !canWriteLocalFallback()
  ) return;
  moderationAuditCache = rows;
  localStorage.setItem(MODERATION_AUDIT_KEY, JSON.stringify(rows));
}

async function refreshModerationAuditsFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const r = await fetch('/api/admin/moderation-audits', { credentials: 'include', cache: 'no-store' });
    if (!r.ok) return;
    const j = (await r.json()) as { rows?: ModerationAuditEntry[] };
    if (!Array.isArray(j.rows)) return;
    const asc = [...j.rows].reverse();
    saveModerationAudits(asc);
  } catch {
    /* ignore */
  }
}

function appendModerationAudit(
  action: ModerationAuditEntry['action'],
  targetType: ModerationAuditEntry['targetType'],
  targetId: string,
  createdBy: string,
  reason?: string,
  ownerId?: string
): void {
  const rows = readModerationAudits();
  const entry = {
    id: genId('mad'),
    action,
    targetType,
    targetId,
    ownerId,
    reason,
    createdBy,
    createdAt: new Date().toISOString(),
  };
  rows.push(entry);
  saveModerationAudits(rows);
  void fetch('/api/admin/moderation-audits', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      ownerId: entry.ownerId,
      reason: entry.reason,
    }),
  }).catch(() => {
    /* ignore */
  });
}

function readAllPropertiesRaw(): PropertyData[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  return readPropertiesArray();
}

function saveAllPropertiesRaw(rows: PropertyData[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  writePropertiesArray(rows);
}

export function getModerationAudits(): ModerationAuditEntry[] {
  void refreshModerationAuditsFromServer();
  return readModerationAudits().slice().reverse();
}

export type AdminUserFilter = 'all' | 'new' | 'active' | 'blocked';

export function getAdminUsers(search = '', status: AdminUserFilter = 'all'): UserData[] {
  const keyword = search.trim().toLowerCase();
  return getUsers()
    .filter((u) => {
      if (u.deleted) return false;
      if (status === 'new' && !isUserNew(u)) return false;
      if (status === 'blocked' && !u.blocked) return false;
      if (status === 'active' && u.blocked) return false;
      if (!keyword) return true;
      return (
        u.uid.toLowerCase().includes(keyword) ||
        (u.email || '').toLowerCase().includes(keyword) ||
        (u.displayName || '').toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => {
      const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bt - at;
    });
}

export async function setUserBlocked(
  uid: string,
  blocked: boolean,
  adminId: string,
  reason?: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/app/users/${encodeURIComponent(uid)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocked,
        blockedAt: blocked ? new Date().toISOString() : null,
        blockedReason: blocked ? (reason ?? null) : null,
      }),
    });
    if (res.ok) {
      await refreshUsersFromServer();
    } else if (res.status === 503) {
      const users = getUsers().map((u) => ({ ...u }));
      const index = users.findIndex((u) => u.uid === uid);
      if (index === -1) return false;
      users[index] = {
        ...users[index],
        blocked,
        blockedAt: blocked ? new Date().toISOString() : undefined,
        blockedReason: blocked ? reason : undefined,
        updatedAt: new Date().toISOString(),
      };
      saveUsers(users);
    } else {
      return false;
    }
  } catch {
    return false;
  }

  // 계정 차단 시 해당 사용자의 매물을 자동 숨김 처리 (데이터는 유지)
  if (blocked) {
    const props = readAllPropertiesRaw();
    let changed = 0;
    const now = new Date().toISOString();
    for (let i = 0; i < props.length; i++) {
      if (props[i].ownerId !== uid) continue;
      if (props[i].hidden) continue;
      props[i] = {
        ...props[i],
        hidden: true,
        updatedAt: now,
        history: [
          ...(props[i].history || []),
          {
            action: 'ADMIN_HIDE_BY_OWNER_BLOCK',
            timestamp: now,
            details: `Auto hidden due to owner block(${adminId})${reason ? `: ${reason}` : ''}`,
          },
        ],
      };
      changed += 1;
      appendModerationAudit('property_hidden', 'property', props[i].id || '-', adminId, reason, uid);
    }
    if (changed > 0) saveAllPropertiesRaw(props);
  }

  appendModerationAudit(
    blocked ? 'user_blocked' : 'user_restored',
    'user',
    uid,
    adminId,
    reason
  );
  return true;
}

export type AdminPropertyFilter = 'all' | 'new' | 'listed' | 'paused' | 'hidden';

/** @deprecated 동기 목록 — UI는 loadAdminInventoryPage( properties.ts ) 사용 권장 */
export function getAdminProperties(
  search = '',
  status: AdminPropertyFilter = 'all'
): PropertyData[] {
  const keyword = search.trim().toLowerCase();
  const ownerEmailByUid = new Map<string, string>();
  if (keyword) {
    getUsers().forEach((u) => {
      if (u.uid && !u.deleted) ownerEmailByUid.set(u.uid, (u.email || '').toLowerCase());
    });
  }
  return readAllPropertiesRaw()
    .filter((p) => {
      if (p.deleted) return false;
      if (String(p.id || '').includes('_child_')) return false;
      if (status === 'new' && !isPropertyNew(p)) return false;
      if (status === 'hidden' && !p.hidden) return false;
      if (status === 'listed' && (p.hidden || p.status !== 'active')) return false;
      if (status === 'paused' && (p.hidden || p.status !== 'INACTIVE_SHORT_TERM')) return false;
      if (!keyword) return true;
      const oid = (p.ownerId || '').toLowerCase();
      if (oid.includes(keyword)) return true;
      const em = ownerEmailByUid.get(p.ownerId || '');
      if (em && em.includes(keyword)) return true;
      if ((p.id || '').toLowerCase().includes(keyword)) return true;
      if ((p.title || '').toLowerCase().includes(keyword)) return true;
      if ((p.address || '').toLowerCase().includes(keyword)) return true;
      return false;
    })
    .sort((a, b) => {
      const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bt - at;
    });
}

export function setPropertyHidden(
  propertyId: string,
  hidden: boolean,
  adminId: string,
  reason?: string
): boolean {
  const rows = readAllPropertiesRaw();
  const index = rows.findIndex((p) => p.id === propertyId);
  if (index === -1) return false;

  // 호스트가 차단 상태이면 관리자도 숨김 해제를 할 수 없도록 강제
  if (!hidden) {
    const ownerId = rows[index].ownerId;
    if (ownerId) {
      const owner = getUsers().find((u) => u.uid === ownerId && !u.deleted);
      if (owner?.blocked) {
        return false;
      }
    }
  }

  const history = rows[index].history || [];
  rows[index] = {
    ...rows[index],
    hidden,
    updatedAt: new Date().toISOString(),
    history: [
      ...history,
      {
        action: hidden ? 'ADMIN_HIDE' : 'ADMIN_RESTORE',
        timestamp: new Date().toISOString(),
        details: hidden
          ? `Hidden by admin(${adminId})${reason ? `: ${reason}` : ''}`
          : `Restored by admin(${adminId})`,
      },
    ],
  };
  saveAllPropertiesRaw(rows);

  appendModerationAudit(
    hidden ? 'property_hidden' : 'property_restored',
    'property',
    propertyId,
    adminId,
    reason,
    rows[index].ownerId
  );
  return true;
}

