import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { observeRouteResponse } from '@/lib/server/apiMonitoring';
import { bumpBookingUpdatedAtForDomainSignal } from '@/lib/server/bumpBookingDomainSignal';

/**
 * Record refund_approved in AdminFinanceLedger (server ledger).
 * Idempotent when the same bookingId already has refund_approved.
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const route = 'POST /api/admin/finance/refund-ledger';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);

  let body: { bookingId?: string; ownerId?: string; amount?: number };
  try {
    body = await request.json();
  } catch {
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_body' }, { status: 400 }),
      route,
      startedAt
    );
  }

  const bookingId = String(body.bookingId || '').trim();
  const ownerId = String(body.ownerId || '').trim();
  const amount = Number(body.amount);
  if (!bookingId || !ownerId || !Number.isFinite(amount) || amount < 0) {
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_input' }, { status: 400 }),
      route,
      startedAt
    );
  }

  try {
    const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT "id" FROM "AdminFinanceLedger" WHERE "refId" = $1 AND "type" = 'refund_approved' LIMIT 1`,
      bookingId
    );
    if (existing.length > 0) {
      return observeRouteResponse(
        NextResponse.json({ ok: true, duplicate: true }),
        route,
        startedAt
      );
    }

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "AdminFinanceLedger" ("id","ownerId","amount","type","refId","note","createdBy","createdAt")
      VALUES ($1,$2,$3,'refund_approved',$4,$5,$6,NOW())
      `,
      randomUUID(),
      ownerId,
      amount,
      bookingId,
      'Admin refund approved (guest)',
      me.username
    );
    await bumpBookingUpdatedAtForDomainSignal(bookingId);
    return observeRouteResponse(NextResponse.json({ ok: true }), route, startedAt);
  } catch (error) {
    console.error('POST /api/admin/finance/refund-ledger', error);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}
