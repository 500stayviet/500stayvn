import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

export type AppSettlementStateRow = {
  bookingId: string;
  approvalStatus: 'approved' | 'held' | null;
  inPendingQueue: boolean;
};

/**
 * Settlement approval / pending-queue flags for owner bookings (DB only).
 * P2.1: AppApi 봉투(`appApiOk` / `appApiError`).
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
        CASE
          WHEN s."status" IN ('approved', 'held') THEN s."status"
          ELSE NULL
        END AS "approvalStatus",
        (q."bookingId" IS NOT NULL) AS "inPendingQueue"
      FROM "Booking" b
      INNER JOIN "Property" p ON p."id" = b."propertyId" AND p."ownerId" = $1
      LEFT JOIN "AdminSettlementApproval" s ON s."bookingId" = b."id"
      LEFT JOIN "AdminSettlementPendingQueue" q ON q."bookingId" = b."id"
      `,
      ownerId
    );

    const states: AppSettlementStateRow[] = rows.map((r) => ({
      bookingId: r.bookingId,
      approvalStatus:
        r.approvalStatus === 'approved' || r.approvalStatus === 'held' ? r.approvalStatus : null,
      inPendingQueue: Boolean(r.inPendingQueue),
    }));

    return appApiOk({ states });
  } catch (error) {
    console.error('GET /api/app/finance/settlement-state', error);
    return appApiError('database_unavailable', 503);
  }
}
