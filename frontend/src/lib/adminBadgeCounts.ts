'use client';

import { getUsers } from '@/lib/api/auth';
import { getLedgerEntries, getWithdrawalRequests } from '@/lib/api/adminFinance';
import { getModerationAudits } from '@/lib/api/adminModeration';
import {
  getUnseenNewPropertyCount,
  getUnseenNewUserCount,
  getUnseenSettlementPendingCount,
} from '@/lib/adminAckState';

export const ADMIN_BADGES_REFRESH_EVENT = 'admin-badges-refresh';

export function refreshAdminBadges(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ADMIN_BADGES_REFRESH_EVENT));
}

/** 관리자 상단 알림 배지용 건수 (클라이언트 전용 데이터 기준) */
export async function fetchAdminBadgeCounts() {
  const now = Date.now();

  const settlementsPendingUnseen = await getUnseenSettlementPendingCount();

  const wr = getWithdrawalRequests();
  const withdrawalsPending = wr.filter((r) => {
    const st = r.status === 'approved' ? 'processing' : r.status;
    return st === 'pending';
  }).length;

  const usersNewUnseen = getUnseenNewUserCount();
  const propertiesNewUnseen = getUnseenNewPropertyCount();

  const users = getUsers();
  const kycPending = users.filter((u) => !u.deleted && u.verification_status === 'pending').length;
  const kycVerifiedReview = users.filter((u) => !u.deleted && u.verification_status === 'verified').length;

  const dayAgo = now - 24 * 60 * 60 * 1000;
  const finance = getLedgerEntries();
  const mod = getModerationAudits();
  const auditRecent = [...finance, ...mod].filter((e) => {
    const t = new Date(e.createdAt).getTime();
    return t >= dayAgo;
  }).length;

  return {
    usersNewUnseen,
    propertiesNewUnseen,
    settlementsPendingUnseen,
    withdrawalsPending,
    kycPending,
    kycVerifiedReview,
    auditRecent,
  };
}

export type AdminBadgeCounts = Awaited<ReturnType<typeof fetchAdminBadgeCounts>>;

/** href → 표시할 배지 숫자 (0이면 숨김) */
export function badgeCountForNav(href: string, c: AdminBadgeCounts): number {
  switch (href) {
    case '/admin':
      return 0;
    case '/admin/users':
      return c.usersNewUnseen;
    case '/admin/properties':
      return c.propertiesNewUnseen;
    case '/admin/settlements':
      return c.settlementsPendingUnseen;
    case '/admin/withdrawals':
      return c.withdrawalsPending;
    case '/admin/audit':
      return c.auditRecent;
    case '/admin/kyc':
      return Math.min(99, c.kycPending + c.kycVerifiedReview);
    default:
      return 0;
  }
}
