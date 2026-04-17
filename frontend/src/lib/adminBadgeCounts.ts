'use client';

import { getUsers } from '@/lib/api/auth';
import { getWithdrawalRequests } from '@/lib/api/adminFinance';
import {
  getUnseenNewContractCount,
  getUnseenRecentAuditCount,
  getUnseenNewKycCount,
  getUnseenNewPropertyCount,
  getUnseenNewRefundCount,
  getUnseenNewSystemLogCount,
  getUnseenNewUserCount,
  getUnseenSettlementPendingCount,
  getUnseenSettlementRequestCount,
} from '@/lib/adminAckState';

export const ADMIN_BADGES_REFRESH_EVENT = 'admin-badges-refresh';

export function refreshAdminBadges(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ADMIN_BADGES_REFRESH_EVENT));
}

/** 관리자 상단 알림 배지용 건수 (클라이언트 전용 데이터 기준) */
export async function fetchAdminBadgeCounts(
  options?: { includeExpensiveClientCounts?: boolean }
) {
  const includeExpensive = options?.includeExpensiveClientCounts ?? true;
  let settlementsPendingUnseen = 0;
  let contractsNewUnseen = 0;
  let refundsNewUnseen = 0;

  if (includeExpensive) {
    const settlementsRequestUnseen = await getUnseenSettlementRequestCount();
    const settlementsQueueUnseen = await getUnseenSettlementPendingCount();
    settlementsPendingUnseen = settlementsRequestUnseen + settlementsQueueUnseen;
    contractsNewUnseen = await getUnseenNewContractCount();
    refundsNewUnseen = await getUnseenNewRefundCount();
  }

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
  const kycNewUnseen = getUnseenNewKycCount();

  const auditRecent = getUnseenRecentAuditCount();
  const systemLogNewUnseen = getUnseenNewSystemLogCount();

  return {
    usersNewUnseen,
    propertiesNewUnseen,
    contractsNewUnseen,
    refundsNewUnseen,
    settlementsPendingUnseen,
    withdrawalsPending,
    kycPending,
    kycVerifiedReview,
    kycNewUnseen,
    auditRecent,
    systemLogNewUnseen,
  };
}

export async function fetchAdminBadgeCountsFromServer(): Promise<Partial<AdminBadgeCounts> | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/admin/badge-counts', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as Partial<AdminBadgeCounts>;
  } catch {
    return null;
  }
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
