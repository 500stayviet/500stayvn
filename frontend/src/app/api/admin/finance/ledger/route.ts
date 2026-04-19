import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { observeRouteResponse } from '@/lib/server/apiMonitoring';

const LEDGER_TYPES = new Set([
  'settlement_approved',
  'settlement_held',
  'settlement_reverted_pending',
  'settlement_reverted_request',
  'withdrawal_requested',
  'withdrawal_processing',
  'withdrawal_held',
  'withdrawal_resumed',
  'withdrawal_completed',
  'withdrawal_rejected_refund',
]);

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const route = 'GET /api/admin/finance/ledger';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);
  const sinceParam = request.nextUrl.searchParams.get('since');
  try {
    if (sinceParam) {
      const since = new Date(sinceParam);
      if (!Number.isFinite(since.getTime())) {
        return observeRouteResponse(
          NextResponse.json({ error: 'invalid_since' }, { status: 400 }),
          route,
          startedAt
        );
      }
      const rows = await prisma.adminFinanceLedger.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });
      return observeRouteResponse(
        NextResponse.json({
          entries: rows.map((r) => ({
            id: r.id,
            ownerId: r.ownerId,
            amount: r.amount,
            type: r.type,
            refId: r.refId || undefined,
            note: r.note || undefined,
            createdBy: r.createdBy || undefined,
            createdAt: r.createdAt.toISOString(),
          })),
        }),
        route,
        startedAt
      );
    }

    const rows = await prisma.adminFinanceLedger.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3000,
    });
    return observeRouteResponse(
      NextResponse.json({
        entries: rows.map((r) => ({
          id: r.id,
          ownerId: r.ownerId,
          amount: r.amount,
          type: r.type,
          refId: r.refId || undefined,
          note: r.note || undefined,
          createdBy: r.createdBy || undefined,
          createdAt: r.createdAt.toISOString(),
        })),
      }),
      route,
      startedAt
    );
  } catch (error) {
    console.error('GET /api/admin/finance/ledger', error);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}

/**
 * Append one finance ledger row (감사·잔액 산출의 서버 단일 원장).
 * 환불 승인(refund_approved)은 POST /api/admin/finance/refund-ledger 사용.
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const route = 'POST /api/admin/finance/ledger';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);

  let body: {
    ownerId?: string;
    amount?: unknown;
    type?: string;
    refId?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_body' }, { status: 400 }),
      route,
      startedAt
    );
  }

  const ownerId = String(body.ownerId || '').trim();
  const type = String(body.type || '').trim();
  const amount = Number(body.amount);
  const refId = body.refId != null && String(body.refId).trim() ? String(body.refId).trim() : null;
  const note = body.note != null && String(body.note).trim() ? String(body.note).trim() : null;

  if (!ownerId || !LEDGER_TYPES.has(type) || !Number.isFinite(amount)) {
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_input' }, { status: 400 }),
      route,
      startedAt
    );
  }

  try {
    await prisma.adminFinanceLedger.create({
      data: {
        ownerId,
        amount,
        type,
        refId,
        note,
        createdBy: me.username,
      },
    });
    return observeRouteResponse(NextResponse.json({ ok: true }), route, startedAt);
  } catch (error) {
    console.error('POST /api/admin/finance/ledger', error);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}
