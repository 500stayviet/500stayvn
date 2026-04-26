import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bumpBookingUpdatedAtForDomainSignal } from '@/lib/server/bumpBookingDomainSignal';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

/**
 * 예약 삭제 등 — 해당 예약의 정산 승인·대기 큐 행만 제거(원장은 유지).
 * 본인 소유 매물 예약만 허용.
 * P2.1: AppApi 봉투.
 */
export async function POST(request: NextRequest) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return appApiError('actor_required', 401);
  let body: { bookingId?: string };
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }
  const bookingId = String(body.bookingId || '').trim();
  if (!bookingId) return appApiError('invalid_input', 400);

  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ ok: number }>>(
      `
      SELECT 1 AS ok
      FROM "Booking" b
      INNER JOIN "Property" p ON p."id" = b."propertyId"
      WHERE b."id" = $1 AND p."ownerId" = $2
      LIMIT 1
      `,
      bookingId,
      ownerId
    );
    if (rows.length === 0) {
      return appApiError('forbidden_or_missing', 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementPendingQueue" WHERE "bookingId" = $1`, bookingId);
      await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementApproval" WHERE "bookingId" = $1`, bookingId);
    });
    await bumpBookingUpdatedAtForDomainSignal(bookingId);
    return appApiOk({});
  } catch (error) {
    console.error('POST /api/app/finance/settlement-purge', error);
    return appApiError('database_unavailable', 503);
  }
}
