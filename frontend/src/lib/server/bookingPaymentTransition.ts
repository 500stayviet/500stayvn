import type { Prisma } from '@prisma/client';

const PAID_PAYMENT_STATUSES = new Set([
  'paid',
  'succeeded',
  'success',
  'completed',
]);
const REFUNDED_PAYMENT_STATUSES = new Set([
  'refunded',
  'refund_completed',
  'refund_succeeded',
]);

function normalizeStatus(status: string | null | undefined): string {
  return String(status || '')
    .trim()
    .toLowerCase();
}

function isPaidStatus(status: string | null | undefined): boolean {
  return PAID_PAYMENT_STATUSES.has(normalizeStatus(status));
}
function isRefundedStatus(status: string | null | undefined): boolean {
  return REFUNDED_PAYMENT_STATUSES.has(normalizeStatus(status));
}

type BookingTransitionTx = {
  booking: {
    findUnique: (args: unknown) => Promise<{
      id: string;
      status: string;
      detailJson: Prisma.JsonValue | null;
    } | null>;
    update: (args: unknown) => Promise<unknown>;
  };
};

export async function transitionBookingOnPaymentUpdate(
  tx: BookingTransitionTx,
  args: {
    bookingId: string;
    paymentStatus: string | null | undefined;
    refundStatus: string | null | undefined;
  },
): Promise<{ bookingConfirmed: boolean; bookingCancelled: boolean }> {
  const booking = await tx.booking.findUnique({
    where: { id: args.bookingId },
    select: {
      id: true,
      status: true,
      detailJson: true,
    },
  });
  if (!booking) {
    return { bookingConfirmed: false, bookingCancelled: false };
  }

  if (isRefundedStatus(args.refundStatus)) {
    if (booking.status === 'pending' || booking.status === 'confirmed') {
      const nowIso = new Date().toISOString();
      const detail = ((booking.detailJson || {}) as Record<string, unknown>) || {};
      const cancelledStatus =
        booking.status === 'pending' ? 'cancelled_before' : 'cancelled_after';
      const nextDetail = {
        ...detail,
        status: cancelledStatus,
        paymentStatus: 'refunded',
        cancelledAt:
          typeof detail.cancelledAt === 'string' ? detail.cancelledAt : nowIso,
        cancelReason:
          typeof detail.cancelReason === 'string'
            ? detail.cancelReason
            : 'payment_refunded',
      };
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: cancelledStatus,
          detailJson: nextDetail as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
      return { bookingConfirmed: false, bookingCancelled: true };
    }
    return { bookingConfirmed: false, bookingCancelled: false };
  }

  if (!isPaidStatus(args.paymentStatus) || booking.status !== 'pending') {
    return { bookingConfirmed: false, bookingCancelled: false };
  }

  const nowIso = new Date().toISOString();
  const detail = ((booking.detailJson || {}) as Record<string, unknown>) || {};
  const nextDetail = {
    ...detail,
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentDate: typeof detail.paymentDate === 'string' ? detail.paymentDate : nowIso,
    confirmedAt: typeof detail.confirmedAt === 'string' ? detail.confirmedAt : nowIso,
  };

  await tx.booking.update({
    where: { id: booking.id },
    data: {
      status: 'confirmed',
      detailJson: nextDetail as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  });

  return { bookingConfirmed: true, bookingCancelled: false };
}

