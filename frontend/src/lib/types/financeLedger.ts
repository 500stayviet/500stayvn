/**
 * Admin finance ledger row types (PostgreSQL AdminFinanceLedger, audit UI).
 * Server is the source of truth; no localStorage ledger.
 */
export type FinanceLedgerEntryType =
  | 'settlement_approved'
  | 'settlement_held'
  | 'settlement_resumed'
  | 'settlement_reverted_pending'
  | 'settlement_reverted_request'
  | 'withdrawal_requested'
  | 'withdrawal_processing'
  | 'withdrawal_held'
  | 'withdrawal_resumed'
  | 'withdrawal_completed'
  | 'withdrawal_rejected_refund'
  | 'refund_approved';

export type LedgerEntry = {
  id: string;
  ownerId: string;
  amount: number;
  type: FinanceLedgerEntryType;
  refId?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
};
