import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { observeRouteResponse } from '@/lib/server/apiMonitoring';

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
  const startedAt = Date.now();
  const route = 'GET /api/admin/finance/withdrawals';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);
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
    return observeRouteResponse(
      NextResponse.json({
        withdrawals: rows.map((r) => ({
          ...r,
          status: r.status === 'approved' ? 'processing' : r.status,
          requestedAt: new Date(r.requestedAt).toISOString(),
          reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : undefined,
        })),
      }),
      route,
      startedAt
    );
  } catch (error) {
    console.error('GET /api/admin/finance/withdrawals', error);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}

export async function PATCH(request: NextRequest) {
  const startedAt = Date.now();
  const route = 'PATCH /api/admin/finance/withdrawals';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);
  let body: { id?: string; action?: ActionType; reason?: string };
  try {
    body = await request.json();
  } catch {
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_body' }, { status: 400 }),
      route,
      startedAt
    );
  }
  const id = String(body.id || '').trim();
  const action = body.action;
  const reason = String(body.reason || '').trim() || null;
  if (!id || !action)
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_input' }, { status: 400 }),
      route,
      startedAt
    );

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
    /** Raw SQL은 Prisma 확장 미들웨어를 타지 않음 → `adminWithdrawalRequest` 도메인 이벤트·배지를 위해 한 번 Prisma 쓰기 */
    await prisma.adminWithdrawalRequest.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
    return observeRouteResponse(NextResponse.json({ ok: true }), route, startedAt);
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      return observeRouteResponse(NextResponse.json({ error: 'not_found' }, { status: 404 }), route, startedAt);
    }
    if (error instanceof Error && error.message === 'invalid_transition') {
      return observeRouteResponse(
        NextResponse.json({ error: 'invalid_transition' }, { status: 409 }),
        route,
        startedAt
      );
    }
    console.error('PATCH /api/admin/finance/withdrawals', error);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}
