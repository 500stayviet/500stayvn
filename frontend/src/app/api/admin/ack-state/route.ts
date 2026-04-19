import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { observeRouteResponse } from '@/lib/server/apiMonitoring';
import { Prisma } from '@prisma/client';

function genId(): string {
  return `aack_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const route = 'GET /api/admin/ack-state';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);

  const category = (request.nextUrl.searchParams.get('category') || '').trim();
  if (!category)
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_category' }, { status: 400 }),
      route,
      startedAt
    );

  const detail = request.nextUrl.searchParams.get('detail') === '1';

  try {
    const rows = await prisma.$queryRaw<Array<{ targetId: string; acknowledgedAt: Date }>>(
      Prisma.sql`
        SELECT "targetId", "acknowledgedAt"
        FROM "AdminAckState"
        WHERE "adminUsername" = ${me.username}
          AND "category" = ${category}
        ORDER BY "acknowledgedAt" DESC
      `
    );

    const ids = rows.map((r) => r.targetId);
    if (detail) {
      return observeRouteResponse(
        NextResponse.json({
          ids,
          entries: rows.map((r) => ({
            targetId: r.targetId,
            acknowledgedAt: r.acknowledgedAt.toISOString(),
          })),
        }),
        route,
        startedAt
      );
    }
    return observeRouteResponse(NextResponse.json({ ids }), route, startedAt);
  } catch (e) {
    console.error('GET /api/admin/ack-state', e);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}

type Body = {
  category?: string;
  ids?: string[];
};

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const route = 'POST /api/admin/ack-state';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_body' }, { status: 400 }),
      route,
      startedAt
    );
  }

  const category = (body.category || '').trim();
  const ids = Array.isArray(body.ids)
    ? body.ids.map((v) => String(v || '').trim()).filter(Boolean)
    : [];
  if (!category || ids.length === 0) {
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_fields' }, { status: 400 }),
      route,
      startedAt
    );
  }

  try {
    for (const id of ids) {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "AdminAckState"
        ("id","adminUsername","category","targetId","acknowledgedAt")
        VALUES ($1,$2,$3,$4,NOW())
        ON CONFLICT ("adminUsername","category","targetId")
        DO UPDATE SET "acknowledgedAt" = EXCLUDED."acknowledgedAt"
        `,
        genId(),
        me.username,
        category,
        id
      );
    }
    return observeRouteResponse(NextResponse.json({ ok: true, count: ids.length }), route, startedAt);
  } catch (e) {
    console.error('POST /api/admin/ack-state', e);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}
