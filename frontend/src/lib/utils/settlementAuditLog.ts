/**
 * 과거: 정산 상태 전환을 localStorage에 남김.
 * 현재: 금융·정산 감사는 서버 `AdminFinanceLedger` + 정산 API가 단일 진실 — 여기서는 기록하지 않습니다.
 */

import type { RentalIncomeStatus } from './rentalIncome';

export interface SettlementAuditEntry {
  serverTimeISO: string;
  serverTimeMs: number;
  bookingId: string;
  status: RentalIncomeStatus;
  checkInISO: string;
  checkOutISO: string;
  payableAfterISO: string;
  recordedAt: string;
}

/** no-op — 서버 원장만 사용 */
export function recordSettlementAudit(_entry: Omit<SettlementAuditEntry, 'recordedAt'>): void {}

/** 로컬 감사 로그는 사용하지 않음 */
export function getSettlementAuditLog(): SettlementAuditEntry[] {
  return [];
}
