import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

/**
 * 임대인 본인 예약의 정산 승인·승인대기 큐 상태(서버 DB).
 */
export async function GET(request: NextRequest) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return appApiError('actor_required', 401);
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        bookingId: string;
        approvalStatus: string | null;
        inPendingQueue: boolean;
      }>
    >(
      `
      SELECT
        b."id" AS "bookingId",
        s."status" AS "approvalStatus",
        CASE WHEN q."bookingId" IS NULL THEN false ELSE true END AS "inPendingQueue"
      FROM "Booking" b
      INNER JOIN "Property" p ON p."id" = b."propertyId"
      LEFT JOIN "AdminSettlementApproval" s ON s."bookingId" = b."id"
      LEFT JOIN "AdminSettlementPendingQueue" q ON q."bookingId" = b."id"
      WHERE p."ownerId" = $1
        AND COALESCE(b."detailJson"->>'paymentStatus', '') = 'paid'
        AND b."status" <> 'cancelled'
      ORDER BY b."updatedAt" DESC
      LIMIT 2000
      `,
      ownerId
    );
    return appApiOk({
      overlays: rows.map((r) => ({
        bookingId: r.bookingId,
        approvalStatus: r.approvalStatus,
        inPendingQueue: Boolean(r.inPendingQueue),
      })),
    });
  } catch (error) {
    console.error('GET /api/app/finance/settlement-overlay', error);
    return appApiError('database_unavailable', 503);
  }
}
