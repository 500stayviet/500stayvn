import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

export async function GET(request: NextRequest) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return NextResponse.json({ error: 'actor_required' }, { status: 401 });
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
      WHERE "ownerId" = $1
      ORDER BY "requestedAt" DESC
      `,
      ownerId
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
    console.error('GET /api/app/finance/withdrawals', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return NextResponse.json({ error: 'actor_required' }, { status: 401 });
  let body: { amount?: number; bankAccountId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const amount = Number(body.amount || 0);
  const bankAccountId = String(body.bankAccountId || '').trim();
  if (!Number.isFinite(amount) || amount <= 0 || !bankAccountId) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  try {
    const bankRows = await prisma.$queryRawUnsafe<
      Array<{ id: string; bankName: string; accountNumber: string }>
    >(
      `
      SELECT "id","bankName","accountNumber"
      FROM "AdminBankAccount"
      WHERE "id" = $1 AND "ownerId" = $2
      LIMIT 1
      `,
      bankAccountId,
      ownerId
    );
    const bank = bankRows[0];
    if (!bank) return NextResponse.json({ error: 'bank_account_not_found' }, { status: 404 });

    const requestId = crypto.randomUUID();
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `
        INSERT INTO "AdminWithdrawalRequest"
          ("id","ownerId","amount","bankAccountId","bankLabel","status","requestedAt","createdAt","updatedAt")
        VALUES
          ($1,$2,$3,$4,$5,'pending',NOW(),NOW(),NOW())
        `,
        requestId,
        ownerId,
        amount,
        bankAccountId,
        `${bank.bankName} - ${bank.accountNumber}`
      );
      await tx.$executeRawUnsafe(
        `
        INSERT INTO "AdminFinanceLedger"
          ("id","ownerId","amount","type","refId","note","createdAt")
        VALUES
          ($1,$2,$3,'withdrawal_requested',$4,'Withdrawal requested',NOW())
        `,
        crypto.randomUUID(),
        ownerId,
        -amount,
        requestId
      );
    });
    return NextResponse.json({ ok: true, id: requestId }, { status: 201 });
  } catch (error) {
    console.error('POST /api/app/finance/withdrawals', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
