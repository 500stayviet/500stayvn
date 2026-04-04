'use client';

import { isContractCompletedTab } from '@/lib/adminBookingFilters';
import { getAllBookings } from '@/lib/api/bookings';
import type { BookingData } from '@/lib/api/bookings';
import {
  getRentalIncomeAmount,
  getRentalIncomeStatus,
  RentalIncomeStatus,
} from '@/lib/utils/rentalIncome';

export interface SettlementApproval {
  bookingId: string;
  ownerId: string;
  amount: number;
  approvedBy: string;
  approvedAt: string;
  status?: 'approved' | 'held' | 'rejected';
  reason?: string;
}

export interface LedgerEntry {
  id: string;
  ownerId: string;
  amount: number;
  type:
    | 'settlement_approved'
    | 'settlement_held'
    | 'settlement_resumed'
    | 'settlement_reverted_pending'
    | 'withdrawal_requested'
    | 'withdrawal_processing'
    | 'withdrawal_held'
    | 'withdrawal_resumed'
    | 'withdrawal_completed'
    | 'withdrawal_rejected_refund'
    | 'refund_approved';
  refId?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  ownerId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  ownerId: string;
  amount: number;
  bankAccountId: string;
  bankLabel: string;
  // 'approved'는 과거 데이터 호환 (processing으로 해석)
  status: 'pending' | 'approved' | 'processing' | 'held' | 'completed' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectReason?: string;
}

export interface SettlementCandidate {
  bookingId: string;
  ownerId: string;
  propertyTitle: string;
  /** 예약에 캐시된 매물 주소 */
  propertyAddress?: string;
  checkInDate: string;
  checkOutDate: string;
  amount: number;
  status: RentalIncomeStatus;
  approvalStatus?: 'approved' | 'held' | 'rejected' | null;
  approved: boolean; // approvalStatus === 'approved'
}

const SETTLEMENT_APPROVALS_KEY = 'admin_settlement_approvals_v1';
/** 승인요청 → 승인대기로 넘긴 bookingId (체크아웃·계약종료 후) */
const SETTLEMENT_PENDING_QUEUE_KEY = 'admin_settlement_pending_queue_booking_ids_v1';
const LEDGER_KEY = 'admin_finance_ledger_v1';
const BANK_ACCOUNTS_KEY = 'bank_accounts_v1';
const WITHDRAWALS_KEY = 'withdrawal_requests_v1';

function readLS<T>(key: string): T[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLS<T>(key: string, value: T[]) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

function genId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 동일 bookingId 승인 행이 중복되면 잔액 합산이 뻥튀기됨 — 한 건으로 병합 */
function pickBetterSettlementRow(a: SettlementApproval, b: SettlementApproval): SettlementApproval {
  const stA = a.status ?? 'approved';
  const stB = b.status ?? 'approved';
  const rank = (s: string) => (s === 'approved' ? 2 : s === 'held' ? 1 : 0);
  if (rank(stB) !== rank(stA)) return rank(stB) > rank(stA) ? b : a;
  return new Date(b.approvedAt).getTime() >= new Date(a.approvedAt).getTime() ? b : a;
}

export function normalizeSettlementApprovals(approvals: SettlementApproval[]): SettlementApproval[] {
  const map = new Map<string, SettlementApproval>();
  const sorted = [...approvals].sort(
    (x, y) => new Date(x.approvedAt).getTime() - new Date(y.approvedAt).getTime()
  );
  for (const raw of sorted) {
    const id = (raw.bookingId || '').trim();
    if (!id) continue;
    const cur = { ...raw, bookingId: id };
    const prev = map.get(id);
    if (!prev) {
      map.set(id, cur);
      continue;
    }
    map.set(id, pickBetterSettlementRow(prev, cur));
  }
  return [...map.values()];
}

const settlementBookingLocks = new Set<string>();

function withSettlementBookingLock<T>(bookingId: string, fn: () => T): T | null {
  const id = (bookingId || '').trim();
  if (!id) return null;
  if (settlementBookingLocks.has(id)) return null;
  settlementBookingLocks.add(id);
  try {
    return fn();
  } finally {
    settlementBookingLocks.delete(id);
  }
}

export function getSettlementPendingQueueIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SETTLEMENT_PENDING_QUEUE_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSettlementPendingQueueIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTLEMENT_PENDING_QUEUE_KEY, JSON.stringify([...ids]));
}

/** 승인요청에서 확인 후 승인대기 탭으로 넘김 */
export function moveBookingToSettlementPendingQueue(bookingId: string): void {
  if (!bookingId) return;
  const s = getSettlementPendingQueueIds();
  s.add(bookingId);
  saveSettlementPendingQueueIds(s);
}

function removeBookingFromSettlementPendingQueue(bookingId: string): void {
  const s = getSettlementPendingQueueIds();
  if (!s.delete(bookingId)) return;
  saveSettlementPendingQueueIds(s);
}

/**
 * 예약이 없거나 취소된 ID는 승인 대기 큐에서 제거 (목록과 큐 불일치 방지).
 */
export async function reconcileSettlementPendingQueueWithBookings(): Promise<void> {
  const bookings = await getAllBookings();
  const byId = new Map(bookings.map((b) => [b.id ?? '', b] as const));
  const queue = getSettlementPendingQueueIds();
  let changed = false;
  for (const id of [...queue]) {
    if (!id) {
      queue.delete(id);
      changed = true;
      continue;
    }
    const b = byId.get(id);
    if (!b || b.status === 'cancelled') {
      queue.delete(id);
      changed = true;
    }
  }
  if (changed) saveSettlementPendingQueueIds(queue);
}

/** 예약 영구 삭제 시 큐·승인 요약 제거(원장은 유지). */
export function purgeSettlementStateForDeletedBooking(bookingId: string): void {
  if (!bookingId) return;
  removeBookingFromSettlementPendingQueue(bookingId);
  const approvals = readLS<SettlementApproval>(SETTLEMENT_APPROVALS_KEY);
  const before = normalizeSettlementApprovals(approvals);
  const filtered = before.filter((a) => a.bookingId !== bookingId);
  if (filtered.length !== before.length) {
    saveSettlementApprovals(filtered);
  }
}

/** 정산 목록: 계약종료(체크아웃 이후) 예약만 — 체크인 직후 유입 제외 */
function isEligibleForSettlementContractEnded(b: BookingData, now: Date): boolean {
  return isContractCompletedTab(b, now);
}

export function getSettlementApprovals(): SettlementApproval[] {
  const raw = readLS<SettlementApproval>(SETTLEMENT_APPROVALS_KEY);
  const normalized = normalizeSettlementApprovals(raw);
  const withIds = raw.filter((r) => (r.bookingId || '').trim());
  const dupOrEmpty =
    normalized.length !== raw.length ||
    new Set(withIds.map((r) => r.bookingId)).size !== withIds.length;
  if (dupOrEmpty) {
    writeLS(SETTLEMENT_APPROVALS_KEY, normalized);
  }
  return normalized;
}

function saveSettlementApprovals(items: SettlementApproval[]) {
  writeLS(SETTLEMENT_APPROVALS_KEY, normalizeSettlementApprovals(items));
}

export function getLedgerEntries(): LedgerEntry[] {
  return readLS<LedgerEntry>(LEDGER_KEY);
}

/** 관리자 환불 승인 — 원장 기록(감사용). bookings 쪽에서 동적 import로 호출 가능. */
export function appendRefundLedgerEntry(input: {
  ownerId: string;
  amount: number;
  bookingId: string;
  adminId: string;
}): void {
  const ledger = getLedgerEntries();
  ledger.push({
    id: genId('led'),
    ownerId: input.ownerId,
    amount: input.amount,
    type: 'refund_approved',
    refId: input.bookingId,
    createdBy: input.adminId,
    createdAt: new Date().toISOString(),
    note: '관리자 환불 승인(게스트)',
  });
  saveLedgerEntries(ledger);
}

function saveLedgerEntries(items: LedgerEntry[]) {
  writeLS(LEDGER_KEY, items);
}

export function getBankAccounts(ownerId?: string): BankAccount[] {
  const all = readLS<BankAccount>(BANK_ACCOUNTS_KEY);
  return ownerId ? all.filter((a) => a.ownerId === ownerId) : all;
}

export function addBankAccount(
  ownerId: string,
  input: Omit<BankAccount, 'id' | 'ownerId' | 'createdAt'>
): BankAccount {
  const all = readLS<BankAccount>(BANK_ACCOUNTS_KEY);
  const account: BankAccount = {
    id: genId('bank'),
    ownerId,
    createdAt: new Date().toISOString(),
    ...input,
  };

  // 첫 계좌면 기본계좌로 승격
  if (!all.some((a) => a.ownerId === ownerId)) {
    account.isPrimary = true;
  }

  if (account.isPrimary) {
    for (const a of all) {
      if (a.ownerId === ownerId) a.isPrimary = false;
    }
  }
  all.push(account);
  writeLS(BANK_ACCOUNTS_KEY, all);
  return account;
}

export function setPrimaryBankAccount(ownerId: string, accountId: string) {
  const all = readLS<BankAccount>(BANK_ACCOUNTS_KEY);
  for (const a of all) {
    if (a.ownerId === ownerId) {
      a.isPrimary = a.id === accountId;
    }
  }
  writeLS(BANK_ACCOUNTS_KEY, all);
}

export function removeBankAccount(ownerId: string, accountId: string) {
  const all = readLS<BankAccount>(BANK_ACCOUNTS_KEY).filter(
    (a) => !(a.ownerId === ownerId && a.id === accountId)
  );
  const ownerAccounts = all.filter((a) => a.ownerId === ownerId);
  if (ownerAccounts.length > 0 && !ownerAccounts.some((a) => a.isPrimary)) {
    ownerAccounts[0].isPrimary = true;
  }
  writeLS(BANK_ACCOUNTS_KEY, all);
}

export function getWithdrawalRequests(ownerId?: string): WithdrawalRequest[] {
  const all = readLS<WithdrawalRequest>(WITHDRAWALS_KEY);
  return ownerId ? all.filter((w) => w.ownerId === ownerId) : all;
}

function saveWithdrawalRequests(items: WithdrawalRequest[]) {
  writeLS(WITHDRAWALS_KEY, items);
}

export function getOwnerBalances(ownerId: string): {
  totalApprovedRevenue: number;
  pendingWithdrawal: number;
  availableBalance: number;
} {
  const approvals = getSettlementApprovals().filter((a) => a.ownerId === ownerId);
  let totalApprovedRevenue = 0;
  for (const a of approvals) {
    const st = a.status ?? 'approved';
    if (st === 'approved') totalApprovedRevenue += a.amount;
  }

  const withdrawals = getWithdrawalRequests(ownerId);
  // 화면 라벨용(처리중/보류중) 금액
  const pendingWithdrawal = withdrawals.reduce((sum, w) => {
    if (w.status === 'rejected' || w.status === 'completed') return sum;
    return sum + w.amount;
  }, 0);

  // 출금가능금액 계산용(완료된 출금도 되돌릴 수 없으므로 차감 유지)
  const lockedWithdrawal = withdrawals.reduce((sum, w) => {
    if (w.status === 'rejected') return sum;
    return sum + w.amount;
  }, 0);

  const availableBalance = Math.max(0, totalApprovedRevenue - lockedWithdrawal);
  return { totalApprovedRevenue, pendingWithdrawal, availableBalance };
}

export async function getSettlementCandidates(): Promise<SettlementCandidate[]> {
  const bookings = await getAllBookings();
  const approvals = getSettlementApprovals();
  const now = new Date();

  return bookings
    .filter((b) => isEligibleForSettlementContractEnded(b as BookingData, now))
    .map((b) => {
      const approval = approvals.find((a) => a.bookingId === b.id);
      const approvalStatus = approval ? (approval.status ?? 'approved') : null;
      const status = getRentalIncomeStatus(
        b.checkInDate,
        b.checkOutDate,
        b.checkInTime ?? '14:00',
        b.checkOutTime ?? '12:00',
        now
      );
      return {
        bookingId: b.id ?? '',
        ownerId: b.ownerId,
        propertyTitle: b.propertyTitle ?? '',
        propertyAddress: b.propertyAddress,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        amount: getRentalIncomeAmount(b),
        status: status ?? 'pending',
        approvalStatus,
        approved: approvalStatus === 'approved',
      } as SettlementCandidate;
    })
    .filter((r) => r.bookingId);
}

/** 승인요청: 계약종료 후 · 아직 승인대기 큐에 올리지 않은 건 */
export async function getSettlementRequestCandidates(): Promise<SettlementCandidate[]> {
  const rows = await getSettlementCandidates();
  const queue = getSettlementPendingQueueIds();
  return rows.filter((r) => r.approvalStatus === null && !queue.has(r.bookingId));
}

/** 승인대기: 승인요청에서 큐로 넘긴 뒤 · 정산 승인 전 */
export async function getSettlementPendingApprovalCandidates(): Promise<SettlementCandidate[]> {
  const rows = await getSettlementCandidates();
  const queue = getSettlementPendingQueueIds();
  return rows.filter((r) => r.approvalStatus === null && queue.has(r.bookingId));
}

/**
 * 승인 대기 건을 보류 탭으로 이동(승인 기록 없이 held만 생성). 출금 가능 반영 없음.
 */
export function holdPendingSettlement(candidate: SettlementCandidate, adminId: string, reason?: string): boolean {
  const result = withSettlementBookingLock(candidate.bookingId, () => {
    const approvals = getSettlementApprovals();
    if (approvals.some((a) => a.bookingId === candidate.bookingId)) return false;

    const approval: SettlementApproval = {
      bookingId: candidate.bookingId,
      ownerId: candidate.ownerId,
      amount: candidate.amount,
      approvedBy: adminId,
      approvedAt: new Date().toISOString(),
      status: 'held',
      reason: reason || '관리자 보류(승인 전)',
    };
    approvals.push(approval);
    saveSettlementApprovals(approvals);

    const ledger = getLedgerEntries();
    ledger.push({
      id: genId('led'),
      ownerId: candidate.ownerId,
      amount: 0,
      type: 'settlement_held',
      refId: candidate.bookingId,
      createdBy: adminId,
      createdAt: new Date().toISOString(),
      note: reason || '정산 보류(승인 대기 건)',
    });
    saveLedgerEntries(ledger);
    removeBookingFromSettlementPendingQueue(candidate.bookingId);
    return true;
  });
  return result ?? false;
}

export function approveSettlement(candidate: SettlementCandidate, adminId: string): boolean {
  const result = withSettlementBookingLock(candidate.bookingId, () => {
    const approvals = getSettlementApprovals();
    if (approvals.some((a) => a.bookingId === candidate.bookingId)) return false;

    const approval: SettlementApproval = {
      bookingId: candidate.bookingId,
      ownerId: candidate.ownerId,
      amount: candidate.amount,
      approvedBy: adminId,
      approvedAt: new Date().toISOString(),
      status: 'approved',
    };
    approvals.push(approval);
    saveSettlementApprovals(approvals);

    const ledger = getLedgerEntries();
    ledger.push({
      id: genId('led'),
      ownerId: candidate.ownerId,
      amount: candidate.amount,
      type: 'settlement_approved',
      refId: candidate.bookingId,
      createdBy: adminId,
      createdAt: new Date().toISOString(),
      note: 'Settlement approved by admin',
    });
    saveLedgerEntries(ledger);
    removeBookingFromSettlementPendingQueue(candidate.bookingId);
    return true;
  });
  return result ?? false;
}

export function holdSettlement(bookingId: string, adminId: string, reason?: string): boolean {
  const result = withSettlementBookingLock(bookingId, () => {
    const approvals = getSettlementApprovals();
    const index = approvals.findIndex((a) => a.bookingId === bookingId);
    if (index === -1) return false;
    const currentStatus = approvals[index].status ?? 'approved';
    if (currentStatus !== 'approved') return false; // completed 비슷한 개념 없음: approved/held만 토글

    approvals[index] = {
      ...approvals[index],
      status: 'held',
      reason: reason || '관리자 보류',
    };
    saveSettlementApprovals(approvals);

    const ledger = getLedgerEntries();
    ledger.push({
      id: genId('led'),
      ownerId: approvals[index].ownerId,
      amount: 0,
      type: 'settlement_held',
      refId: bookingId,
      createdBy: adminId,
      createdAt: new Date().toISOString(),
      note: reason || '정산 보류(승인 완료 건)',
    });
    saveLedgerEntries(ledger);
    return true;
  });
  return result ?? false;
}

/**
 * 보류 중인 정산 건을 승인 대기로 복구: 승인 기록을 제거하고 관리자가 다시 승인하도록 함.
 */
export function resumeSettlement(bookingId: string, adminId: string): boolean {
  const result = withSettlementBookingLock(bookingId, () => {
    const approvals = getSettlementApprovals();
    const index = approvals.findIndex((a) => a.bookingId === bookingId);
    if (index === -1) return false;
    const currentStatus = approvals[index].status ?? 'approved';
    if (currentStatus !== 'held') return false;

    const row = approvals[index];
    approvals.splice(index, 1);
    saveSettlementApprovals(approvals);

    const ledger = getLedgerEntries();
    ledger.push({
      id: genId('led'),
      ownerId: row.ownerId,
      amount: 0,
      type: 'settlement_reverted_pending',
      refId: bookingId,
      createdBy: adminId,
      createdAt: new Date().toISOString(),
      note: `보류 해제 → 승인 대기로 복구 (해당 건 금액 ${row.amount.toLocaleString()} ₫ 재승인 필요)`,
    });
    saveLedgerEntries(ledger);
    moveBookingToSettlementPendingQueue(bookingId);
    return true;
  });
  return result ?? false;
}

export function createWithdrawalRequest(
  ownerId: string,
  amount: number,
  bankAccountId: string
): { ok: boolean; message?: string; request?: WithdrawalRequest } {
  const accounts = getBankAccounts(ownerId);
  const account = accounts.find((a) => a.id === bankAccountId);
  if (!account) return { ok: false, message: 'Bank account not found' };

  const balances = getOwnerBalances(ownerId);
  if (amount <= 0) return { ok: false, message: 'Invalid amount' };
  if (amount > balances.availableBalance) return { ok: false, message: 'Insufficient available balance' };

  const req: WithdrawalRequest = {
    id: genId('wd'),
    ownerId,
    amount,
    bankAccountId,
    bankLabel: `${account.bankName} - ${account.accountNumber}`,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  const requests = getWithdrawalRequests();
  requests.push(req);
  saveWithdrawalRequests(requests);

  const ledger = getLedgerEntries();
  ledger.push({
    id: genId('led'),
    ownerId,
    amount: -amount,
    type: 'withdrawal_requested',
    refId: req.id,
    createdAt: new Date().toISOString(),
    note: 'Withdrawal requested',
  });
  saveLedgerEntries(ledger);

  return { ok: true, request: req };
}

export function approveWithdrawal(requestId: string, adminId: string): boolean {
  const requests = getWithdrawalRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1 || requests[index].status !== 'pending') return false;
  requests[index] = {
    ...requests[index],
    status: 'processing',
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId,
  };
  saveWithdrawalRequests(requests);

  const ledger = getLedgerEntries();
  ledger.push({
    id: genId('led'),
    ownerId: requests[index].ownerId,
    amount: 0,
    type: 'withdrawal_processing',
    refId: requestId,
    createdBy: adminId,
    createdAt: new Date().toISOString(),
    note: 'Withdrawal approved',
  });
  saveLedgerEntries(ledger);
  return true;
}

export function rejectWithdrawal(requestId: string, adminId: string, reason?: string): boolean {
  const requests = getWithdrawalRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return false;
  const currentStatus = requests[index].status;
  if (currentStatus === 'completed') return false; // 완료 이후는 되돌릴 수 없음(앱 정책)
  if (currentStatus === 'rejected') return false;
  requests[index] = {
    ...requests[index],
    status: 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId,
    rejectReason: reason,
  };
  saveWithdrawalRequests(requests);

  // 요청 시 차감했던 금액 복원
  const ledger = getLedgerEntries();
  ledger.push({
    id: genId('led'),
    ownerId: requests[index].ownerId,
    amount: requests[index].amount,
    type: 'withdrawal_rejected_refund',
    refId: requestId,
    createdBy: adminId,
    createdAt: new Date().toISOString(),
    note: reason || 'Withdrawal rejected; refunded to available balance',
  });
  saveLedgerEntries(ledger);
  return true;
}

export function holdWithdrawal(requestId: string, adminId: string, reason?: string): boolean {
  const requests = getWithdrawalRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return false;
  const st = requests[index].status;
  if (st === 'completed' || st === 'rejected') return false;
  if (st === 'held') return false;

  requests[index] = {
    ...requests[index],
    status: 'held',
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId,
    rejectReason: reason || requests[index].rejectReason,
  };
  saveWithdrawalRequests(requests);

  const ledger = getLedgerEntries();
  ledger.push({
    id: genId('led'),
    ownerId: requests[index].ownerId,
    amount: 0,
    type: 'withdrawal_held',
    refId: requestId,
    createdBy: adminId,
    createdAt: new Date().toISOString(),
    note: reason || 'Withdrawal held',
  });
  saveLedgerEntries(ledger);
  return true;
}

export function resumeWithdrawal(requestId: string, adminId: string): boolean {
  const requests = getWithdrawalRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return false;
  const st = requests[index].status;
  if (st !== 'held') return false;

  requests[index] = {
    ...requests[index],
    status: 'processing',
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId,
    rejectReason: undefined,
  };
  saveWithdrawalRequests(requests);

  const ledger = getLedgerEntries();
  ledger.push({
    id: genId('led'),
    ownerId: requests[index].ownerId,
    amount: 0,
    type: 'withdrawal_resumed',
    refId: requestId,
    createdBy: adminId,
    createdAt: new Date().toISOString(),
    note: 'Withdrawal resumed',
  });
  saveLedgerEntries(ledger);
  return true;
}

export function completeWithdrawal(requestId: string, adminId: string): boolean {
  const requests = getWithdrawalRequests();
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) return false;
  const st = requests[index].status;
  const normalized = st === 'approved' ? 'processing' : st;
  if (normalized !== 'processing') return false; // processing 이후엔 completed로만 전환

  requests[index] = {
    ...requests[index],
    status: 'completed',
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId,
  };
  saveWithdrawalRequests(requests);

  const ledger = getLedgerEntries();
  ledger.push({
    id: genId('led'),
    ownerId: requests[index].ownerId,
    amount: 0,
    type: 'withdrawal_completed',
    refId: requestId,
    createdBy: adminId,
    createdAt: new Date().toISOString(),
    note: 'Withdrawal completed',
  });
  saveLedgerEntries(ledger);
  return true;
}

