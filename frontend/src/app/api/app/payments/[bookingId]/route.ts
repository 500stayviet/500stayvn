import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';
import { transitionBookingOnPaymentUpdate } from '@/lib/server/bookingPaymentTransition';
import { appApiOk } from '@/lib/server/appApiResponses';

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
    const result = await prisma.$transaction(async (tx) => {
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
      const transition = await transitionBookingOnPaymentUpdate(tx as any, {
        bookingId: bid,
        paymentStatus: normalizedStatus,
        refundStatus:
          body.refundStatus !== undefined ? (body.refundStatus || null) : null,
      });
      return {
        payment: (rows as unknown[])[0] || null,
        transition,
      };
    });
    return appApiOk(result);
  } catch (e) {
    console.error('PATCH /api/app/payments/[bookingId]', e);
    return appApiError('database_unavailable', 503);
  }
}
