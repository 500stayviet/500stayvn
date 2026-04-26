import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

export async function GET(request: NextRequest) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return appApiError('actor_required', 401);
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
    return appApiOk({ totalApprovedRevenue, pendingWithdrawal, availableBalance });
  } catch (error) {
    console.error('GET /api/app/finance/balance', error);
    return appApiError('database_unavailable', 503);
  }
}
