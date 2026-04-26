import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';
import {
  type BookingTransitionTx,
  isPaidStatus,
  transitionBookingOnPaymentUpdate,
} from '@/lib/server/bookingPaymentTransition';
import {
  AlreadyBookedConflictError,
  assertNoOverlapWithConfirmedBookings,
  BookingNotFoundInTransactionError,
  lockBookingRowForUpdate,
  PaymentRowMissingInTransactionError,
} from '@/lib/server/paymentConfirmAvailability';
import {
  PaymentPatchIdempotencyConflictError,
  resolvePaymentPatchIdempotency,
  type PaymentRowSnapshot,
} from '@/lib/server/paymentPatchIdempotency';
import { appApiOk } from '@/lib/server/appApiResponses';

function pickPaymentSnapshot(pay: Record<string, unknown>): PaymentRowSnapshot | null {
  const id = pay.id;
  const status = pay.status;
  const ik = pay.idempotencyKey;
  if (typeof id !== 'string' || typeof status !== 'string') return null;
  return {
    id,
    status,
    idempotencyKey: ik === null || typeof ik === 'string' ? ik : null,
  };
}

type PatchBody = {
  status?: string;
  provider?: string | null;
  externalPaymentId?: string | null;
  idempotencyKey?: string | null;
  webhookEventId?: string | null;
  refundStatus?: string | null;
  refundAmount?: number | null;
  metaJson?: unknown;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await context.params;
  const bid = (bookingId || '').trim();
  if (!bid) return appApiError('invalid_booking_id', 400);
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }
  try {
    const ownerRows = (await prisma.$queryRawUnsafe(
      `
      SELECT b."guestId" AS "guestId", p."ownerId" AS "ownerId"
      FROM "Booking" b
      JOIN "Property" p ON p."id" = b."propertyId"
      WHERE b."id" = $1
      LIMIT 1
      `,
      bid
    )) as Array<{ guestId: string; ownerId: string }>;
    if (!ownerRows[0]) return appApiError('booking_not_found', 404);
    const denied = rejectAppWriteUnlessActorAllowed(request, [ownerRows[0].guestId, ownerRows[0].ownerId]);
    if (denied) return denied;

    const latest = (await prisma.$queryRawUnsafe(
      `
      SELECT "id"
      FROM "PaymentRecord"
      WHERE "bookingId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 1
      `,
      bid
    )) as Array<{ id: string }>;
    if (!latest[0]?.id) return appApiError('not_found', 404);
    const normalizedStatus =
      body.status !== undefined ? String(body.status).trim().toLowerCase() : null;
    const idempotencyKeyRaw =
      body.idempotencyKey !== undefined ? String(body.idempotencyKey).trim() : '';

    const result = await prisma.$transaction(async (tx) => {
      const locked = await lockBookingRowForUpdate(tx, bid);
      if (!locked) {
        throw new BookingNotFoundInTransactionError(bid);
      }

      const payLockedRows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
        `
        SELECT * FROM "PaymentRecord"
        WHERE "id" = $1
        FOR UPDATE
        `,
        latest[0].id,
      );
      const payFull = payLockedRows[0];
      if (!payFull) {
        throw new BookingNotFoundInTransactionError(bid);
      }
      const paySnap = pickPaymentSnapshot(payFull);
      if (!paySnap) {
        throw new BookingNotFoundInTransactionError(bid);
      }

      if (idempotencyKeyRaw) {
        const idem = await resolvePaymentPatchIdempotency({
          tx: tx as unknown as BookingTransitionTx,
          idempotencyKey: idempotencyKeyRaw,
          normalizedPaymentStatus: normalizedStatus,
          refundStatus: body.refundStatus !== undefined ? body.refundStatus : null,
          bookingId: bid,
          pay: paySnap,
          lockedBookingStatus: locked.status,
          beforePendingPaidRecover: async () => {
            await assertNoOverlapWithConfirmedBookings(tx, {
              bookingId: bid,
              propertyId: locked.propertyId,
              checkInDate: locked.checkInDate,
              checkOutDate: locked.checkOutDate,
            });
          },
        });
        if (idem.action === 'return' || idem.action === 'recover_transition') {
          return {
            payment: payFull,
            transition: idem.transition,
          };
        }
      }

      if (isPaidStatus(normalizedStatus) && locked.status === 'pending') {
        await assertNoOverlapWithConfirmedBookings(tx, {
          bookingId: bid,
          propertyId: locked.propertyId,
          checkInDate: locked.checkInDate,
          checkOutDate: locked.checkOutDate,
        });
      }

      const rows = await tx.$queryRawUnsafe(
        `
        UPDATE "PaymentRecord"
        SET
          "status" = COALESCE($2, "status"),
          "provider" = COALESCE($3, "provider"),
          "externalPaymentId" = COALESCE($4, "externalPaymentId"),
          "idempotencyKey" = COALESCE($5, "idempotencyKey"),
          "webhookEventId" = COALESCE($6, "webhookEventId"),
          "refundStatus" = COALESCE($7, "refundStatus"),
          "refundAmount" = COALESCE($8, "refundAmount"),
          "metaJson" = COALESCE($9::jsonb, "metaJson"),
          "updatedAt" = NOW()
        WHERE "id" = $1
        RETURNING *
        `,
        latest[0].id,
        normalizedStatus,
        body.provider !== undefined ? (body.provider || null) : null,
        body.externalPaymentId !== undefined ? (body.externalPaymentId || null) : null,
        body.idempotencyKey !== undefined ? (body.idempotencyKey || null) : null,
        body.webhookEventId !== undefined ? (body.webhookEventId || null) : null,
        body.refundStatus !== undefined ? (body.refundStatus || null) : null,
        body.refundAmount !== undefined ? body.refundAmount : null,
        body.metaJson !== undefined ? JSON.stringify(body.metaJson) : null
      );
      const transition = await transitionBookingOnPaymentUpdate(
        tx as unknown as BookingTransitionTx,
        {
          bookingId: bid,
          paymentStatus: normalizedStatus,
          refundStatus:
            body.refundStatus !== undefined ? (body.refundStatus || null) : null,
        },
      );
      return {
        payment: (rows as unknown[])[0] || null,
        transition,
      };
    });
    return appApiOk(result);
  } catch (e) {
    if (e instanceof AlreadyBookedConflictError) {
      console.error('[ADMIN_ALERT] payment_confirm_race', {
        event: 'overlapping_confirmed_booking',
        bookingId: e.bookingId,
        propertyId: e.propertyId,
        at: new Date().toISOString(),
      });
      return appApiError('already_booked', 409);
    }
    if (e instanceof BookingNotFoundInTransactionError) {
      return appApiError('booking_not_found', 404);
    }
    if (e instanceof PaymentRowMissingInTransactionError) {
      return appApiError('not_found', 404);
    }
    if (e instanceof PaymentPatchIdempotencyConflictError) {
      return appApiError('idempotency_conflict', 409);
    }
    console.error('PATCH /api/app/payments/[bookingId]', e);
    return appApiError('database_unavailable', 503);
  }
}
