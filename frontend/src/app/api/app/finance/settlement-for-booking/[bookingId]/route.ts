import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bumpBookingUpdatedAtForDomainSignal } from '@/lib/server/bumpBookingDomainSignal';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';

/**
 * Remove settlement queue + approval rows for a booking (ledger unchanged).
 * Allowed for the guest or the property owner.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId: rawId } = await context.params;
  const bookingId = String(rawId || '').trim();
  if (!bookingId) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, propertyId: true },
  });
  if (!booking) return NextResponse.json({ ok: true });

  const property = await prisma.property.findUnique({
    where: { id: booking.propertyId },
    select: { ownerId: true },
  });
  const ownerId = property?.ownerId || '';
  const denied = rejectAppWriteUnlessActorAllowed(request, [booking.guestId, ownerId].filter(Boolean));
  if (denied) return denied;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementPendingQueue" WHERE "bookingId" = $1`, bookingId);
      await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementApproval" WHERE "bookingId" = $1`, bookingId);
    });
    await bumpBookingUpdatedAtForDomainSignal(bookingId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/app/finance/settlement-for-booking', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
