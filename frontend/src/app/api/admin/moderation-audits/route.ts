import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT *
      FROM "AdminModerationAudit"
      ORDER BY "createdAt" DESC
      LIMIT 2000
      `
    );
    return NextResponse.json({ rows });
  } catch (e) {
    console.error('GET /api/admin/moderation-audits', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

type Body = {
  action?: string;
  targetType?: string;
  targetId?: string;
  ownerId?: string;
  reason?: string;
};

function generateAuditId(): string {
  return `amad_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const action = (body.action || '').trim();
  const targetType = (body.targetType || '').trim();
  const targetId = (body.targetId || '').trim();
  if (!action || !targetType || !targetId) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
  }
  try {
    const rows = await prisma.$queryRawUnsafe(
      `
      INSERT INTO "AdminModerationAudit"
      ("id","action","targetType","targetId","ownerId","reason","createdBy","createdAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      RETURNING *
      `,
      generateAuditId(),
      action,
      targetType,
      targetId,
      body.ownerId?.trim() || null,
      body.reason?.trim() || null,
      me.username
    );
    return NextResponse.json((rows as unknown[])[0] || null, { status: 201 });
  } catch (e) {
    console.error('POST /api/admin/moderation-audits', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
