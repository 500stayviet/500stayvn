'use client';

import {
  messageFromAppApiFailureJson,
  unwrapAppApiData,
} from '@/lib/api/appApiEnvelope';
import { withAppActor } from '@/lib/api/withAppActor';

export type ServerBankAccount = {
  id: string;
  ownerId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
  createdAt: string;
};

export type ServerWithdrawalRequest = {
  id: string;
  ownerId: string;
  amount: number;
  bankAccountId: string;
  bankLabel: string;
  status: 'pending' | 'processing' | 'held' | 'completed' | 'rejected' | 'approved';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectReason?: string;
};

export type ServerFinanceLedgerEntry = {
  id: string;
  ownerId: string;
  amount: number;
  type: string;
  refId?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
};

export type ServerOwnerBalances = {
  totalApprovedRevenue: number;
  pendingWithdrawal: number;
  availableBalance: number;
};

export async function getAppBankAccounts(): Promise<ServerBankAccount[]> {
  const res = await fetch('/api/app/finance/bank-accounts', withAppActor({ cache: 'no-store' }));
  if (!res.ok) return [];
  const json = unwrapAppApiData<{ accounts?: ServerBankAccount[] }>(await res.json());
  return Array.isArray(json.accounts) ? json.accounts : [];
}

export async function addAppBankAccount(input: {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isPrimary: boolean;
}): Promise<boolean> {
  const res = await fetch(
    '/api/app/finance/bank-accounts',
    withAppActor({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  );
  if (!res.ok) return false;
  unwrapAppApiData<{ id?: string }>(await res.json());
  return true;
}

export async function setAppPrimaryBankAccount(id: string): Promise<boolean> {
  const res = await fetch(
    `/api/app/finance/bank-accounts/${encodeURIComponent(id)}`,
    withAppActor({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrimary: true }),
    })
  );
  if (!res.ok) return false;
  unwrapAppApiData<Record<string, unknown>>(await res.json());
  return true;
}

export async function removeAppBankAccount(id: string): Promise<boolean> {
  const res = await fetch(
    `/api/app/finance/bank-accounts/${encodeURIComponent(id)}`,
    withAppActor({ method: 'DELETE' })
  );
  if (!res.ok) return false;
  unwrapAppApiData<Record<string, unknown>>(await res.json());
  return true;
}

export async function getAppWithdrawalRequests(): Promise<ServerWithdrawalRequest[]> {
  const res = await fetch('/api/app/finance/withdrawals', withAppActor({ cache: 'no-store' }));
  if (!res.ok) return [];
  const json = unwrapAppApiData<{ withdrawals?: ServerWithdrawalRequest[] }>(await res.json());
  return Array.isArray(json.withdrawals) ? json.withdrawals : [];
}

export async function createAppWithdrawalRequest(input: {
  amount: number;
  bankAccountId: string;
}): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(
    '/api/app/finance/withdrawals',
    withAppActor({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  );
  if (res.ok) {
    unwrapAppApiData<{ id?: string }>(await res.json());
    return { ok: true };
  }
  try {
    const raw = await res.json();
    return {
      ok: false,
      message: messageFromAppApiFailureJson(raw) ?? 'request_failed',
    };
  } catch {
    return { ok: false, message: 'request_failed' };
  }
}

export async function getAdminWithdrawalRequests(): Promise<ServerWithdrawalRequest[]> {
  const res = await fetch('/api/admin/finance/withdrawals', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { withdrawals?: ServerWithdrawalRequest[] };
  return Array.isArray(json.withdrawals) ? json.withdrawals : [];
}

export async function actAdminWithdrawal(
  id: string,
  action: 'approve' | 'reject' | 'hold' | 'resume' | 'complete',
  reason?: string
): Promise<boolean> {
  const res = await fetch('/api/admin/finance/withdrawals', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action, reason }),
  });
  return res.ok;
}

export async function getAdminFinanceLedgerEntries(): Promise<ServerFinanceLedgerEntry[]> {
  const res = await fetch('/api/admin/finance/ledger', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { entries?: ServerFinanceLedgerEntry[] };
  return Array.isArray(json.entries) ? json.entries : [];
}

/** `since`(ISO) 이후 원장만 — 감사·배지 등 가벼운 조회용 */
export async function getAdminFinanceLedgerEntriesSince(sinceIso: string): Promise<ServerFinanceLedgerEntry[]> {
  const q = new URLSearchParams({ since: sinceIso });
  const res = await fetch(`/api/admin/finance/ledger?${q}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { entries?: ServerFinanceLedgerEntry[] };
  return Array.isArray(json.entries) ? json.entries : [];
}

export async function postAdminFinanceLedgerEntry(input: {
  ownerId: string;
  amount: number;
  type: string;
  refId?: string;
  note?: string;
}): Promise<boolean> {
  const res = await fetch('/api/admin/finance/ledger', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.ok;
}

/** 환불 승인 원장 — 서버에서 idempotent(bookingId). */
export async function postAdminRefundLedgerEntry(input: {
  bookingId: string;
  ownerId: string;
  amount: number;
}): Promise<boolean> {
  const res = await fetch('/api/admin/finance/refund-ledger', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId: input.bookingId,
      ownerId: input.ownerId,
      amount: input.amount,
    }),
  });
  return res.ok;
}

export async function getAppOwnerBalances(): Promise<ServerOwnerBalances> {
  const res = await fetch('/api/app/finance/balance', withAppActor({ cache: 'no-store' }));
  if (!res.ok) return { totalApprovedRevenue: 0, pendingWithdrawal: 0, availableBalance: 0 };
  return unwrapAppApiData<ServerOwnerBalances>(await res.json());
}

export type AppSettlementOverlayRow = {
  bookingId: string;
  approvalStatus: string | null;
  inPendingQueue: boolean;
};

export async function getAppSettlementOverlay(): Promise<AppSettlementOverlayRow[]> {
  const res = await fetch('/api/app/finance/settlement-overlay', withAppActor({ cache: 'no-store' }));
  if (!res.ok) return [];
  const json = unwrapAppApiData<{ overlays?: AppSettlementOverlayRow[] }>(await res.json());
  return Array.isArray(json.overlays) ? json.overlays : [];
}

export async function purgeAppSettlementForBooking(bookingId: string): Promise<boolean> {
  const res = await fetch(
    '/api/app/finance/settlement-purge',
    withAppActor({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    })
  );
  if (!res.ok) return false;
  unwrapAppApiData<Record<string, unknown>>(await res.json());
  return true;
}

export async function getAdminOwnerBalances(ownerId: string): Promise<ServerOwnerBalances> {
  const res = await fetch(`/api/admin/finance/balances?ownerId=${encodeURIComponent(ownerId)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return { totalApprovedRevenue: 0, pendingWithdrawal: 0, availableBalance: 0 };
  return (await res.json()) as ServerOwnerBalances;
}
