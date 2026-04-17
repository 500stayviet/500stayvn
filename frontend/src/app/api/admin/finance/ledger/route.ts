import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        ownerId: string;
        amount: number;
        type: string;
        refId: string | null;
        note: string | null;
        createdBy: string | null;
        createdAt: Date;
      }>
    >(
      `
      SELECT "id","ownerId","amount","type","refId","note","createdBy","createdAt"
      FROM "AdminFinanceLedger"
      ORDER BY "createdAt" DESC
      LIMIT 3000
      `
    );
    return NextResponse.json({
      entries: rows.map((r) => ({
        ...r,
        refId: r.refId || undefined,
        note: r.note || undefined,
        createdBy: r.createdBy || undefined,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    });
  } catch (error) {
    console.error('GET /api/admin/finance/ledger', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
