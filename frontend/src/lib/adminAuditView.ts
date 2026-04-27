"use client";

import type { SupportedLanguage } from "@/lib/api/translation";
import type { LedgerEntry } from "@/lib/api/adminFinance";
import type { ModerationAuditEntry } from "@/lib/api/adminModeration";
import { getUIText, type UITextKey } from "@/utils/i18n";

export type AuditTabId = "all" | "new" | "settlement" | "withdrawal" | "refund" | "account" | "property";

export type UnifiedAuditRow = {
  id: string;
  category: AuditTabId;
  sourceKind: "ledger" | "moderation";
  ledgerType?: LedgerEntry["type"];
  modAction?: ModerationAuditEntry["action"];
  amount: number;
  ownerId: string;
  refId: string;
  createdBy: string;
  createdAt: string;
  note: string;
};

const LEDGER_LABEL_KEY: Partial<Record<LedgerEntry["type"], UITextKey>> = {
  settlement_approved: "adminAuditLedgerSettlementApproved",
  settlement_held: "adminAuditLedgerSettlementHeld",
  settlement_resumed: "adminAuditLedgerSettlementResumed",
  settlement_reverted_pending: "adminAuditLedgerSettlementRevertedPending",
  settlement_reverted_request: "adminAuditLedgerSettlementRevertedRequest",
  withdrawal_requested: "adminAuditLedgerWithdrawalRequested",
  withdrawal_processing: "adminAuditLedgerWithdrawalProcessing",
  withdrawal_held: "adminAuditLedgerWithdrawalHeld",
  withdrawal_resumed: "adminAuditLedgerWithdrawalResumed",
  withdrawal_completed: "adminAuditLedgerWithdrawalCompleted",
  withdrawal_rejected_refund: "adminAuditLedgerWithdrawalRejectedRefund",
  refund_approved: "adminAuditLedgerRefundApproved",
};

const MOD_LABEL_KEY: Record<ModerationAuditEntry["action"], UITextKey> = {
  user_blocked: "adminAuditModUserBlocked",
  user_restored: "adminAuditModUserRestored",
  property_hidden: "adminAuditModPropertyHidden",
  property_restored: "adminAuditModPropertyRestored",
  property_ad_ended_by_host: "adminAuditModPropertyAdEndedByHost",
  property_deleted_by_host: "adminAuditModPropertyDeletedByHost",
};

export const AUDIT_TAB_ORDER: AuditTabId[] = [
  "new",
  "all",
  "settlement",
  "withdrawal",
  "refund",
  "account",
  "property",
];

const AUDIT_TAB_KEY: Record<AuditTabId, UITextKey> = {
  new: "adminAuditTabNew",
  all: "adminAuditTabAll",
  settlement: "adminAuditTabSettlement",
  withdrawal: "adminAuditTabWithdrawal",
  refund: "adminAuditTabRefund",
  account: "adminAuditTabAccount",
  property: "adminAuditTabProperty",
};

export function getAuditTabLabel(id: AuditTabId, language: SupportedLanguage): string {
  return getUIText(AUDIT_TAB_KEY[id], language);
}

export function getUnifiedAuditRowLabel(row: UnifiedAuditRow, language: SupportedLanguage): string {
  if (row.sourceKind === "ledger" && row.ledgerType) {
    const k = LEDGER_LABEL_KEY[row.ledgerType];
    return k ? getUIText(k, language) : row.ledgerType;
  }
  if (row.sourceKind === "moderation" && row.modAction) {
    const k = MOD_LABEL_KEY[row.modAction];
    return k ? getUIText(k, language) : row.modAction;
  }
  return "—";
}

export function ledgerTypeToCategory(t: LedgerEntry["type"]): AuditTabId {
  if (t === "refund_approved") return "refund";
  if (t.startsWith("settlement_")) return "settlement";
  if (t.startsWith("withdrawal_")) return "withdrawal";
  return "settlement";
}

export function moderationToCategory(e: ModerationAuditEntry): AuditTabId {
  return e.targetType === "user" ? "account" : "property";
}

export function buildUnifiedAuditRows(
  ledger: LedgerEntry[],
  moderation: ModerationAuditEntry[],
): UnifiedAuditRow[] {
  const financeRows: UnifiedAuditRow[] = ledger.map((r) => ({
    id: r.id,
    category: ledgerTypeToCategory(r.type),
    sourceKind: "ledger",
    ledgerType: r.type,
    amount: r.amount,
    ownerId: r.ownerId,
    refId: r.refId || "-",
    createdBy: r.createdBy || "-",
    createdAt: r.createdAt,
    note: r.note || "",
  }));

  const modRows: UnifiedAuditRow[] = moderation.map((r) => ({
    id: r.id,
    category: moderationToCategory(r),
    sourceKind: "moderation",
    modAction: r.action,
    amount: 0,
    ownerId: r.ownerId || r.targetId,
    refId: r.targetId,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    note: r.reason || "",
  }));

  return [...financeRows, ...modRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
