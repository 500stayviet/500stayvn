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
        bankName: string;
        accountNumber: string;
        accountHolder: string;
        isPrimary: boolean;
        createdAt: Date;
      }>
    >(
      `
      SELECT "id", "ownerId", "bankName", "accountNumber", "accountHolder", "isPrimary", "createdAt"
      FROM "AdminBankAccount"
      WHERE "ownerId" = $1
      ORDER BY "isPrimary" DESC, "createdAt" DESC
      `,
      ownerId
    );
    return NextResponse.json({
      accounts: rows.map((r) => ({
        ...r,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    });
  } catch (error) {
    console.error('GET /api/app/finance/bank-accounts', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return NextResponse.json({ error: 'actor_required' }, { status: 401 });
  let body: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    isPrimary?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const bankName = String(body.bankName || '').trim();
  const accountNumber = String(body.accountNumber || '').trim();
  const accountHolder = String(body.accountHolder || '').trim();
  if (!bankName || !accountNumber || !accountHolder) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  try {
    const id = crypto.randomUUID();
    const shouldPrimary = Boolean(body.isPrimary);
    await prisma.$transaction(async (tx) => {
      const existing = (await tx.$queryRawUnsafe<Array<{ count: number }>>(
        `SELECT COUNT(*)::int AS count FROM "AdminBankAccount" WHERE "ownerId" = $1`,
        ownerId
      ))[0]?.count ?? 0;
      if (existing === 0 || shouldPrimary) {
        await tx.$executeRawUnsafe(
          `UPDATE "AdminBankAccount" SET "isPrimary" = false, "updatedAt" = NOW() WHERE "ownerId" = $1`,
          ownerId
        );
      }
      await tx.$executeRawUnsafe(
        `
        INSERT INTO "AdminBankAccount"
          ("id","ownerId","bankName","accountNumber","accountHolder","isPrimary","createdAt","updatedAt")
        VALUES
          ($1,$2,$3,$4,$5,$6,NOW(),NOW())
        `,
        id,
        ownerId,
        bankName,
        accountNumber,
        accountHolder,
        existing === 0 || shouldPrimary
      );
    });
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('POST /api/app/finance/bank-accounts', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
