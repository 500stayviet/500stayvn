import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const ownerId = (request.nextUrl.searchParams.get('ownerId') || '').trim();
  if (!ownerId) return NextResponse.json({ error: 'ownerId_required' }, { status: 400 });
  try {
    const [approvedRow] = await prisma.$queryRawUnsafe<Array<{ amount: number }>>(
      `
      SELECT COALESCE(SUM("amount"), 0)::float8 AS amount
      FROM "AdminFinanceLedger"
      WHERE "ownerId" = $1
        AND "type" = 'settlement_approved'
      `,
      ownerId
    );
    const [pendingRow] = await prisma.$queryRawUnsafe<Array<{ amount: number }>>(
      `
      SELECT COALESCE(SUM("amount"), 0)::float8 AS amount
      FROM "AdminWithdrawalRequest"
      WHERE "ownerId" = $1
        AND (CASE WHEN "status" = 'approved' THEN 'processing' ELSE "status" END) NOT IN ('rejected','completed')
      `,
      ownerId
    );
    const [lockedRow] = await prisma.$queryRawUnsafe<Array<{ amount: number }>>(
      `
      SELECT COALESCE(SUM("amount"), 0)::float8 AS amount
      FROM "AdminWithdrawalRequest"
      WHERE "ownerId" = $1
        AND (CASE WHEN "status" = 'approved' THEN 'processing' ELSE "status" END) <> 'rejected'
      `,
      ownerId
    );
    const totalApprovedRevenue = Number(approvedRow?.amount || 0);
    const pendingWithdrawal = Number(pendingRow?.amount || 0);
    const availableBalance = Math.max(0, totalApprovedRevenue - Number(lockedRow?.amount || 0));
    return NextResponse.json({ totalApprovedRevenue, pendingWithdrawal, availableBalance });
  } catch (error) {
    console.error('GET /api/admin/finance/balances', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
