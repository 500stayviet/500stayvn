'use client';

export type ServerSettlementCandidate = {
  bookingId: string;
  ownerId: string;
  propertyTitle: string;
  propertyAddress?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  amount: number;
  approvalStatus?: 'approved' | 'held' | null;
  approved: boolean;
  inPendingQueue: boolean;
};

export async function getSettlementCandidatesServer(): Promise<ServerSettlementCandidate[]> {
  const res = await fetch('/api/admin/finance/settlements', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { candidates?: ServerSettlementCandidate[] };
  return Array.isArray(json.candidates) ? json.candidates : [];
}

export async function patchSettlementServer(input: {
  action:
    | 'move_to_pending'
    | 'hold_pending'
    | 'approve'
    | 'hold_approved'
    | 'resume_pending'
    | 'resume_request';
  bookingId: string;
  ownerId?: string;
  amount?: number;
  reason?: string;
}): Promise<boolean> {
  const res = await fetch('/api/admin/finance/settlements', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.ok;
}
