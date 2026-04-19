import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bumpBookingUpdatedAtForDomainSignal } from '@/lib/server/bumpBookingDomainSignal';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

/**
 * 예약 삭제 등 — 해당 예약의 정산 승인·대기 큐 행만 제거(원장은 유지).
 * 본인 소유 매물 예약만 허용.
 */
export async function POST(request: NextRequest) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return NextResponse.json({ error: 'actor_required' }, { status: 401 });
  let body: { bookingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const bookingId = String(body.bookingId || '').trim();
  if (!bookingId) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

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
      return NextResponse.json({ error: 'forbidden_or_missing' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementPendingQueue" WHERE "bookingId" = $1`, bookingId);
      await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementApproval" WHERE "bookingId" = $1`, bookingId);
    });
    await bumpBookingUpdatedAtForDomainSignal(bookingId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/app/finance/settlement-purge', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
