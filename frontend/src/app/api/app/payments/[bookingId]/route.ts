import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';

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
  if (!bid) return NextResponse.json({ error: 'invalid_booking_id' }, { status: 400 });
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
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
    if (!ownerRows[0]) return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
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
    if (!latest[0]?.id) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const rows = await prisma.$queryRawUnsafe(
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
      body.status !== undefined ? String(body.status).trim().toLowerCase() : null,
      body.provider !== undefined ? (body.provider || null) : null,
      body.externalPaymentId !== undefined ? (body.externalPaymentId || null) : null,
      body.idempotencyKey !== undefined ? (body.idempotencyKey || null) : null,
      body.webhookEventId !== undefined ? (body.webhookEventId || null) : null,
      body.refundStatus !== undefined ? (body.refundStatus || null) : null,
      body.refundAmount !== undefined ? body.refundAmount : null,
      body.metaJson !== undefined ? JSON.stringify(body.metaJson) : null
    );
    return NextResponse.json((rows as unknown[])[0] || null);
  } catch (e) {
    console.error('PATCH /api/app/payments/[bookingId]', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
