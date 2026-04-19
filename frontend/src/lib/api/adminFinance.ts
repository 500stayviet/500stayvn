'use client';

import {
  getAdminOwnerBalances,
  postAdminRefundLedgerEntry,
  purgeAppSettlementForBooking,
} from '@/lib/api/financeServer';
import { getSettlementCandidatesServer, patchSettlementServer } from '@/lib/api/settlementServer';
import { getAllBookingsForAdmin } from '@/lib/api/bookings';
import { getRentalIncomeStatus, RentalIncomeStatus } from '@/lib/utils/rentalIncome';

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
    | 'settlement_reverted_request'
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

export interface SettlementCandidate {
  bookingId: string;
  ownerId: string;
  propertyTitle: string;
  /** 예약에 캐시된 매물 주소 */
  propertyAddress?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  amount: number;
  status: RentalIncomeStatus;
  approvalStatus?: 'approved' | 'held' | 'rejected' | null;
  approved: boolean;
  /** 서버 정산 후보와 동기 — 승인 요청 vs 대기 구분용 */
  inPendingQueue?: boolean;
}

/** 과거 로컬 정산 배열 병합용 — 서버 이전에는 사용. 이제는 무시해도 됨. */
export function normalizeSettlementApprovals(approvals: SettlementApproval[]): SettlementApproval[] {
  return Array.isArray(approvals) ? approvals : [];
}

/** @deprecated AdminSettlementApproval 은 서버만 사용. 호환용 빈 배열. */
export function getSettlementApprovals(): SettlementApproval[] {
  return [];
}

/** @deprecated AdminSettlementPendingQueue 는 서버만 사용. */
export function getSettlementPendingQueueIds(): Set<string> {
  return new Set();
}

/** @deprecated 서버 `PATCH .../settlements` 사용. */
export function moveBookingToSettlementPendingQueue(_bookingId: string): void {}

/** 로컬 큐 정리 — 서버 큐는 DB에서 관리. */
export async function reconcileSettlementPendingQueueWithBookings(): Promise<void> {}

/** 예약 삭제 시 서버 정산 승인·대기 큐 행 제거(원장 유지). */
export async function purgeSettlementStateForDeletedBooking(bookingId: string): Promise<void> {
  if (!bookingId) return;
  await purgeAppSettlementForBooking(bookingId);
}

/** 로컬 원장 없음 — UI는 `getAdminFinanceLedgerEntries` / GET `/api/admin/finance/ledger`. */
export function getLedgerEntries(): LedgerEntry[] {
  return [];
}

/** 관리자 환불 승인 — 서버 원장(감사용). */
export async function appendRefundLedgerEntry(input: {
  ownerId: string;
  amount: number;
  bookingId: string;
  /** 서버 세션으로 기록되며, 클라에서는 미사용(호출부 호환용). */
  adminId: string;
}): Promise<boolean> {
  void input.adminId;
  return postAdminRefundLedgerEntry({
    bookingId: input.bookingId,
    ownerId: input.ownerId,
    amount: input.amount,
  });
}

export async function getOwnerBalancesAsync(ownerId: string): Promise<{
  totalApprovedRevenue: number;
  pendingWithdrawal: number;
  availableBalance: number;
}> {
  return getAdminOwnerBalances(ownerId);
}

export async function getSettlementCandidates(): Promise<SettlementCandidate[]> {
  const [serverRows, bookings] = await Promise.all([
    getSettlementCandidatesServer(),
    getAllBookingsForAdmin(),
  ]);
  const byId = new Map(bookings.map((b) => [b.id ?? '', b] as const));
  const now = new Date();

  return serverRows.map((r) => {
    const b = byId.get(r.bookingId);
    const status = b
      ? getRentalIncomeStatus(
          b.checkInDate,
          b.checkOutDate,
          b.checkInTime ?? '14:00',
          b.checkOutTime ?? '12:00',
          now
        )
      : null;
    return {
      bookingId: r.bookingId,
      ownerId: r.ownerId,
      propertyTitle: r.propertyTitle,
      propertyAddress: r.propertyAddress,
      checkInDate: r.checkInDate,
      checkOutDate: r.checkOutDate,
      checkInTime: r.checkInTime ?? '14:00',
      checkOutTime: r.checkOutTime ?? '12:00',
      amount: r.amount,
      status: (status ?? 'pending') as RentalIncomeStatus,
      approvalStatus: r.approvalStatus ?? null,
      approved: r.approved,
      inPendingQueue: r.inPendingQueue,
    } as SettlementCandidate;
  });
}

/** 승인요청: 계약종료 후 · 아직 승인대기 큐에 올리지 않은 건 */
export async function getSettlementRequestCandidates(): Promise<SettlementCandidate[]> {
  const rows = await getSettlementCandidates();
  return rows.filter((r) => r.approvalStatus === null && !r.inPendingQueue);
}

/** 승인대기: 승인요청에서 큐로 넘긴 뒤 · 정산 승인 전 */
export async function getSettlementPendingApprovalCandidates(): Promise<SettlementCandidate[]> {
  const rows = await getSettlementCandidates();
  return rows.filter((r) => r.approvalStatus === null && Boolean(r.inPendingQueue));
}

/** 레거시: 서버 `PATCH /api/admin/finance/settlements` 와 동일(원장은 서버에서 기록). */
export async function holdPendingSettlement(
  candidate: SettlementCandidate,
  _adminId: string,
  reason?: string
): Promise<boolean> {
  return patchSettlementServer({
    action: 'hold_pending',
    bookingId: candidate.bookingId,
    ownerId: candidate.ownerId,
    amount: candidate.amount,
    reason,
  });
}

export async function approveSettlement(
  candidate: SettlementCandidate,
  _adminId: string
): Promise<boolean> {
  return patchSettlementServer({
    action: 'approve',
    bookingId: candidate.bookingId,
    ownerId: candidate.ownerId,
    amount: candidate.amount,
  });
}

export async function holdSettlement(bookingId: string, _adminId: string, reason?: string): Promise<boolean> {
  return patchSettlementServer({
    action: 'hold_approved',
    bookingId,
    reason,
  });
}

export async function resumeSettlement(bookingId: string, _adminId: string): Promise<boolean> {
  return patchSettlementServer({ action: 'resume_pending', bookingId });
}

export async function resumeSettlementToRequest(bookingId: string, _adminId: string): Promise<boolean> {
  return patchSettlementServer({ action: 'resume_request', bookingId });
}
