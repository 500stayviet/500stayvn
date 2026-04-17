'use client';

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
  const json = (await res.json()) as { accounts?: ServerBankAccount[] };
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
  return res.ok;
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
  return res.ok;
}

export async function removeAppBankAccount(id: string): Promise<boolean> {
  const res = await fetch(
    `/api/app/finance/bank-accounts/${encodeURIComponent(id)}`,
    withAppActor({ method: 'DELETE' })
  );
  return res.ok;
}

export async function getAppWithdrawalRequests(): Promise<ServerWithdrawalRequest[]> {
  const res = await fetch('/api/app/finance/withdrawals', withAppActor({ cache: 'no-store' }));
  if (!res.ok) return [];
  const json = (await res.json()) as { withdrawals?: ServerWithdrawalRequest[] };
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
  if (res.ok) return { ok: true };
  try {
    const json = (await res.json()) as { error?: string };
    return { ok: false, message: json.error || 'request_failed' };
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

export async function getAppOwnerBalances(): Promise<ServerOwnerBalances> {
  const res = await fetch('/api/app/finance/balance', withAppActor({ cache: 'no-store' }));
  if (!res.ok) return { totalApprovedRevenue: 0, pendingWithdrawal: 0, availableBalance: 0 };
  return (await res.json()) as ServerOwnerBalances;
}

export async function getAdminOwnerBalances(ownerId: string): Promise<ServerOwnerBalances> {
  const res = await fetch(`/api/admin/finance/balances?ownerId=${encodeURIComponent(ownerId)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return { totalApprovedRevenue: 0, pendingWithdrawal: 0, availableBalance: 0 };
  return (await res.json()) as ServerOwnerBalances;
}
