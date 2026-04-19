'use client';

export const ADMIN_BADGES_REFRESH_EVENT = 'admin-badges-refresh';

export function refreshAdminBadges(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ADMIN_BADGES_REFRESH_EVENT));
}

export type AdminBadgeCounts = {
  usersNewUnseen: number;
  propertiesNewUnseen: number;
  contractsNewUnseen: number;
  refundsNewUnseen: number;
  settlementsPendingUnseen: number;
  withdrawalsPending: number;
  kycPending: number;
  kycVerifiedReview: number;
  kycNewUnseen: number;
  auditRecent: number;
  systemLogNewUnseen: number;
};

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

function parseAdminBadgeCounts(raw: unknown): AdminBadgeCounts | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if ('error' in o && o.error != null) return null;
  return {
    usersNewUnseen: num(o.usersNewUnseen),
    propertiesNewUnseen: num(o.propertiesNewUnseen),
    contractsNewUnseen: num(o.contractsNewUnseen),
    refundsNewUnseen: num(o.refundsNewUnseen),
    settlementsPendingUnseen: num(o.settlementsPendingUnseen),
    withdrawalsPending: num(o.withdrawalsPending),
    kycPending: num(o.kycPending),
    kycVerifiedReview: num(o.kycVerifiedReview),
    kycNewUnseen: num(o.kycNewUnseen),
    auditRecent: num(o.auditRecent),
    systemLogNewUnseen: num(o.systemLogNewUnseen),
  };
}

/** 관리자 상단 배지 — `/api/admin/badge-counts`만 사용 */
export async function fetchAdminBadgeCounts(): Promise<AdminBadgeCounts | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/admin/badge-counts', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const raw = await res.json();
    return parseAdminBadgeCounts(raw);
  } catch {
    return null;
  }
}

/** href → 표시할 배지 숫자 (0이면 숨김) */
export function badgeCountForNav(href: string, c: AdminBadgeCounts): number {
  switch (href) {
    case '/admin':
      return 0;
    case '/admin/users':
      return c.usersNewUnseen;
    case '/admin/properties':
      return c.propertiesNewUnseen;
    case '/admin/contracts':
      return c.contractsNewUnseen;
    case '/admin/refunds':
      return c.refundsNewUnseen;
    case '/admin/settlements':
      return c.settlementsPendingUnseen;
    case '/admin/withdrawals':
      return c.withdrawalsPending;
    case '/admin/audit':
      return c.auditRecent;
    case '/admin/kyc':
      return c.kycNewUnseen;
    case '/admin/system-log':
      return c.systemLogNewUnseen;
    default:
      return 0;
  }
}
