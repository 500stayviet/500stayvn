'use client';

import { getAllBookings } from '@/lib/api/bookings';
import {
  getRentalIncomeAmount,
  getRentalIncomeStatus,
  isEligibleForRentalIncome,
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

export function getSettlementApprovals(): SettlementApproval[] {
  return readLS<SettlementApproval>(SETTLEMENT_APPROVALS_KEY);
}

function saveSettlementApprovals(items: SettlementApproval[]) {
  writeLS(SETTLEMENT_APPROVALS_KEY, items);
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
    .filter((b) =>
      isEligibleForRentalIncome({
        paymentStatus: b.paymentStatus ?? 'pending',
        status: b.status ?? 'pending',
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        checkInTime: b.checkInTime ?? '14:00',
        checkOutTime: b.checkOutTime ?? '12:00',
        now,
      })
    )
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

/**
 * 승인 대기 건을 보류 탭으로 이동(승인 기록 없이 held만 생성). 출금 가능 반영 없음.
 */
export function holdPendingSettlement(candidate: SettlementCandidate, adminId: string, reason?: string): boolean {
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
  return true;
}

export function approveSettlement(candidate: SettlementCandidate, adminId: string): boolean {
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
  return true;
}

export function holdSettlement(bookingId: string, adminId: string, reason?: string): boolean {
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
}

/**
 * 보류 중인 정산 건을 승인 대기로 복구: 승인 기록을 제거하고 관리자가 다시 승인하도록 함.
 */
export function resumeSettlement(bookingId: string, adminId: string): boolean {
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
  return true;
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

