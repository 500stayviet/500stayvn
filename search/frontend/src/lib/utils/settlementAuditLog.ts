/**
 * 수익 정산 감사 로그 (Audit Log)
 * - 상태(대기→확정→지급됨) 결정 시점의 서버 기준 타임스탬프를 기록
 * - 분쟁 시 증거로 사용. localStorage에 보관(최대 항목 수 제한)
 */

import type { RentalIncomeStatus } from './rentalIncome';

const STORAGE_KEY = 'settlement_audit_log';
const MAX_ENTRIES = 500;

export interface SettlementAuditEntry {
  /** 서버 기준 타임스탬프 (ISO 8601) */
  serverTimeISO: string;
  /** 서버 기준 Unix ms */
  serverTimeMs: number;
  bookingId: string;
  /** 결정된 상태 */
  status: RentalIncomeStatus;
  checkInISO: string;
  checkOutISO: string;
  payableAfterISO: string;
  /** 로그 기록 시점(클라이언트) - 참고용 */
  recordedAt: string;
}

function loadLog(): SettlementAuditEntry[] {
  if (typeof window === 'undefined' || !localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SettlementAuditEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLog(log: SettlementAuditEntry[]) {
  if (typeof window === 'undefined' || !localStorage) return;
  try {
    const trimmed = log.slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

/**
 * 상태 결정 시 서버 기준 타임스탬프를 감사 로그에 기록.
 * (대기→확정→지급됨) 결정 시점의 증거로 사용.
 */
export function recordSettlementAudit(entry: Omit<SettlementAuditEntry, 'recordedAt'>): void {
  const full: SettlementAuditEntry = {
    ...entry,
    recordedAt: new Date().toISOString(),
  };
  const log = loadLog();
  log.push(full);
  saveLog(log);
}

/**
 * 최근 감사 로그 조회 (참고용)
 */
export function getSettlementAuditLog(limit: number = 100): SettlementAuditEntry[] {
  const log = loadLog();
  return log.slice(-limit).reverse();
}
