'use client';

import type { LedgerEntry } from '@/lib/api/adminFinance';
import type { ModerationAuditEntry } from '@/lib/api/adminModeration';

export type AuditTabId = 'all' | 'settlement' | 'withdrawal' | 'refund' | 'account' | 'property';

export type UnifiedAuditRow = {
  id: string;
  category: AuditTabId;
  actionLabel: string;
  amount: number;
  ownerId: string;
  refId: string;
  createdBy: string;
  createdAt: string;
  note: string;
};

const LEDGER_LABEL: Partial<Record<LedgerEntry['type'], string>> = {
  settlement_approved: '정산 승인',
  settlement_held: '정산 보류',
  settlement_resumed: '정산 재개(승인 유지)',
  settlement_reverted_pending: '정산 복구 → 승인 대기',
  withdrawal_requested: '출금 요청',
  withdrawal_processing: '출금 승인(처리 중)',
  withdrawal_held: '출금 보류',
  withdrawal_resumed: '출금 재개',
  withdrawal_completed: '출금 완료',
  withdrawal_rejected_refund: '출금 반려·환원',
  refund_approved: '환불 승인',
};

const MOD_LABEL: Record<ModerationAuditEntry['action'], string> = {
  user_blocked: '계정 차단',
  user_restored: '계정 복구',
  property_hidden: '매물 숨김',
  property_restored: '매물 복구',
};

export function ledgerTypeToCategory(t: LedgerEntry['type']): AuditTabId {
  if (t === 'refund_approved') return 'refund';
  if (t.startsWith('settlement_')) return 'settlement';
  if (t.startsWith('withdrawal_')) return 'withdrawal';
  return 'settlement';
}

export function moderationToCategory(e: ModerationAuditEntry): AuditTabId {
  return e.targetType === 'user' ? 'account' : 'property';
}

export function buildUnifiedAuditRows(
  ledger: LedgerEntry[],
  moderation: ModerationAuditEntry[]
): UnifiedAuditRow[] {
  const financeRows: UnifiedAuditRow[] = ledger.map((r) => ({
    id: r.id,
    category: ledgerTypeToCategory(r.type),
    actionLabel: LEDGER_LABEL[r.type] || r.type,
    amount: r.amount,
    ownerId: r.ownerId,
    refId: r.refId || '-',
    createdBy: r.createdBy || '-',
    createdAt: r.createdAt,
    note: r.note || '',
  }));

  const modRows: UnifiedAuditRow[] = moderation.map((r) => ({
    id: r.id,
    category: moderationToCategory(r),
    actionLabel: MOD_LABEL[r.action] || r.action,
    amount: 0,
    ownerId: r.ownerId || r.targetId,
    refId: r.targetId,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    note: r.reason || '',
  }));

  return [...financeRows, ...modRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const AUDIT_TABS: { id: AuditTabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'settlement', label: '정산' },
  { id: 'withdrawal', label: '출금' },
  { id: 'refund', label: '환불' },
  { id: 'account', label: '계정' },
  { id: 'property', label: '매물' },
];
