import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { Prisma } from '@prisma/client';

function genId(): string {
  return `aack_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const category = (request.nextUrl.searchParams.get('category') || '').trim();
  if (!category) return NextResponse.json({ error: 'invalid_category' }, { status: 400 });

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
      return NextResponse.json({
        ids,
        entries: rows.map((r) => ({
          targetId: r.targetId,
          acknowledgedAt: r.acknowledgedAt.toISOString(),
        })),
      });
    }
    return NextResponse.json({ ids });
  } catch (e) {
    console.error('GET /api/admin/ack-state', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

type Body = {
  category?: string;
  ids?: string[];
};

export async function POST(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const category = (body.category || '').trim();
  const ids = Array.isArray(body.ids)
    ? body.ids.map((v) => String(v || '').trim()).filter(Boolean)
    : [];
  if (!category || ids.length === 0) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
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
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (e) {
    console.error('POST /api/admin/ack-state', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
