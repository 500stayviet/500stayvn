import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';

function genId(): string {
  return `aslg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '1000');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(2000, Math.floor(limitRaw))) : 1000;
  try {
    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT *
      FROM "AdminSystemLog"
      ORDER BY "ts" DESC
      LIMIT $1
      `,
      limit
    );
    return NextResponse.json({ rows });
  } catch (e) {
    console.error('GET /api/admin/system-logs', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

type Body = {
  severity?: string;
  message?: string;
  category?: string;
  bookingId?: string;
  ownerId?: string;
  snapshot?: Record<string, string>;
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
  const severity = (body.severity || '').trim();
  const message = (body.message || '').trim();
  if (!severity || !message) return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
  try {
    const rows = await prisma.$queryRawUnsafe(
      `
      INSERT INTO "AdminSystemLog"
      ("id","ts","severity","message","category","bookingId","ownerId","snapshotJson","createdBy")
      VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7::jsonb,$8)
      RETURNING *
      `,
      genId(),
      severity,
      message,
      body.category?.trim() || null,
      body.bookingId?.trim() || null,
      body.ownerId?.trim() || null,
      body.snapshot ? JSON.stringify(body.snapshot) : null,
      me.username
    );
    return NextResponse.json((rows as unknown[])[0] || null, { status: 201 });
  } catch (e) {
    console.error('POST /api/admin/system-logs', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!me.isSuperAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "AdminSystemLog"`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/system-logs', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
