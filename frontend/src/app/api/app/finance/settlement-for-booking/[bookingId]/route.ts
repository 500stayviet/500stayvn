import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bumpBookingUpdatedAtForDomainSignal } from '@/lib/server/bumpBookingDomainSignal';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';

/**
 * Remove settlement queue + approval rows for a booking (ledger unchanged).
 * Allowed for the guest or the property owner.
 * P2.1: AppApi 봉투.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId: rawId } = await context.params;
  const bookingId = String(rawId || '').trim();
  if (!bookingId) return appApiError('invalid_input', 400);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, propertyId: true },
  });
  if (!booking) return appApiOk({});

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
    return appApiOk({});
  } catch (error) {
    console.error('DELETE /api/app/finance/settlement-for-booking', error);
    return appApiError('database_unavailable', 503);
  }
}
