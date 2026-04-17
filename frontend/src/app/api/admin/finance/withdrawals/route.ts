import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';

type ActionType = 'approve' | 'reject' | 'hold' | 'resume' | 'complete';

function nextStatusFromAction(current: string, action: ActionType): string | null {
  const normalized = current === 'approved' ? 'processing' : current;
  if (action === 'approve' && normalized === 'pending') return 'processing';
  if (action === 'reject' && normalized !== 'completed' && normalized !== 'rejected') return 'rejected';
  if (action === 'hold' && normalized !== 'completed' && normalized !== 'rejected' && normalized !== 'held')
    return 'held';
  if (action === 'resume' && normalized === 'held') return 'processing';
  if (action === 'complete' && normalized === 'processing') return 'completed';
  return null;
}

function ledgerTypeForAction(action: ActionType): string {
  switch (action) {
    case 'approve':
      return 'withdrawal_processing';
    case 'reject':
      return 'withdrawal_rejected_refund';
    case 'hold':
      return 'withdrawal_held';
    case 'resume':
      return 'withdrawal_resumed';
    case 'complete':
      return 'withdrawal_completed';
  }
}

function ledgerAmountForAction(action: ActionType, amount: number): number {
  return action === 'reject' ? amount : 0;
}

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        ownerId: string;
        amount: number;
        bankAccountId: string;
        bankLabel: string;
        status: string;
        requestedAt: Date;
        reviewedAt: Date | null;
        reviewedBy: string | null;
        rejectReason: string | null;
      }>
    >(
      `
      SELECT
        "id","ownerId","amount","bankAccountId","bankLabel","status",
        "requestedAt","reviewedAt","reviewedBy","rejectReason"
      FROM "AdminWithdrawalRequest"
      ORDER BY "requestedAt" DESC
      `
    );
    return NextResponse.json({
      withdrawals: rows.map((r) => ({
        ...r,
        status: r.status === 'approved' ? 'processing' : r.status,
        requestedAt: new Date(r.requestedAt).toISOString(),
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : undefined,
      })),
    });
  } catch (error) {
    console.error('GET /api/admin/finance/withdrawals', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let body: { id?: string; action?: ActionType; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const id = String(body.id || '').trim();
  const action = body.action;
  const reason = String(body.reason || '').trim() || null;
  if (!id || !action) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<Array<{ ownerId: string; amount: number; status: string }>>(
        `SELECT "ownerId","amount","status" FROM "AdminWithdrawalRequest" WHERE "id" = $1 LIMIT 1`,
        id
      );
      const current = rows[0];
      if (!current) throw new Error('not_found');
      const next = nextStatusFromAction(current.status, action);
      if (!next) throw new Error('invalid_transition');

      await tx.$executeRawUnsafe(
        `
        UPDATE "AdminWithdrawalRequest"
        SET "status" = $1, "reviewedAt" = NOW(), "reviewedBy" = $2, "rejectReason" = $3, "updatedAt" = NOW()
        WHERE "id" = $4
        `,
        next,
        me.username,
        reason,
        id
      );

      await tx.$executeRawUnsafe(
        `
        INSERT INTO "AdminFinanceLedger"
          ("id","ownerId","amount","type","refId","note","createdBy","createdAt")
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,NOW())
        `,
        crypto.randomUUID(),
        current.ownerId,
        ledgerAmountForAction(action, current.amount),
        ledgerTypeForAction(action),
        id,
        reason || `Withdrawal ${action}`,
        me.username
      );
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (error instanceof Error && error.message === 'invalid_transition') {
      return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
    }
    console.error('PATCH /api/admin/finance/withdrawals', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
