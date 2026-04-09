import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';

export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get('bookingId')?.trim();
  const userId = request.nextUrl.searchParams.get('userId')?.trim();
  try {
    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT *
      FROM "PaymentRecord"
      WHERE ($1::text IS NULL OR "bookingId" = $1)
        AND ($2::text IS NULL OR "userId" = $2)
      ORDER BY "createdAt" DESC
      LIMIT 200
      `,
      bookingId || null,
      userId || null
    );
    return NextResponse.json({ payments: rows });
  } catch (e) {
    console.error('GET /api/app/payments', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

type CreatePaymentBody = {
  bookingId?: string;
  userId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  provider?: string;
  externalPaymentId?: string;
  idempotencyKey?: string;
  webhookEventId?: string;
  refundStatus?: string;
  refundAmount?: number;
  metaJson?: unknown;
};

function generatePaymentId(): string {
  return `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: NextRequest) {
  let body: CreatePaymentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const bookingId = (body.bookingId || '').trim();
  const userId = (body.userId || '').trim();
  if (!bookingId || !userId || typeof body.amount !== 'number' || Number.isNaN(body.amount)) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
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
      bookingId
    )) as Array<{ guestId: string; ownerId: string }>;
    if (!ownerRows[0]) return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
    if (userId !== ownerRows[0].guestId && userId !== ownerRows[0].ownerId) {
      return NextResponse.json({ error: 'invalid_payment_actor' }, { status: 403 });
    }
    const denied = rejectAppWriteUnlessActorAllowed(request, [ownerRows[0].guestId, ownerRows[0].ownerId]);
    if (denied) return denied;

    const idempotencyKey = (body.idempotencyKey || '').trim();
    if (idempotencyKey) {
      const existing = (await prisma.$queryRawUnsafe(
        `
        SELECT *
        FROM "PaymentRecord"
        WHERE "idempotencyKey" = $1
        ORDER BY "createdAt" DESC
        LIMIT 1
        `,
        idempotencyKey
      )) as unknown[];
      if (existing[0]) return NextResponse.json(existing[0], { status: 200 });
    }

    const rows = await prisma.$queryRawUnsafe(
      `
      INSERT INTO "PaymentRecord"
      ("id","bookingId","userId","amount","currency","status","provider","externalPaymentId","idempotencyKey","webhookEventId","refundStatus","refundAmount","metaJson","createdAt","updatedAt")
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, NOW(), NOW())
      RETURNING *
      `,
      generatePaymentId(),
      bookingId,
      userId,
      body.amount,
      (body.currency || 'vnd').trim().toLowerCase(),
      (body.status || 'pending').trim().toLowerCase(),
      body.provider || null,
      body.externalPaymentId || null,
      idempotencyKey || null,
      body.webhookEventId || null,
      body.refundStatus || null,
      typeof body.refundAmount === 'number' ? body.refundAmount : null,
      body.metaJson ? JSON.stringify(body.metaJson) : null
    );
    return NextResponse.json((rows as unknown[])[0] || null, { status: 201 });
  } catch (e) {
    console.error('POST /api/app/payments', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
