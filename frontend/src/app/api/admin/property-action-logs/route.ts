import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { Prisma } from '@prisma/client';

function genId(): string {
  return `apal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const ACTION_TYPES = new Set(['DELETED', 'CANCELLED']);

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '1000');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(2000, Math.floor(limitRaw))) : 1000;
  const actionType = (request.nextUrl.searchParams.get('actionType') || '').trim();
  try {
    const rows = await prisma.adminPropertyActionLog.findMany({
      where:
        actionType && ACTION_TYPES.has(actionType)
          ? { actionType }
          : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json({ rows });
  } catch (e) {
    console.error('GET /api/admin/property-action-logs', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

type Body = {
  propertyId?: string;
  actionType?: string;
  reason?: string;
  snapshot?: unknown;
  reservationId?: string;
  ownerId?: string;
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
  const propertyId = (body.propertyId || '').trim();
  const actionType = (body.actionType || '').trim();
  if (!propertyId || !ACTION_TYPES.has(actionType)) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
  }
  try {
    const data: Prisma.AdminPropertyActionLogUncheckedCreateInput = {
      id: genId(),
      propertyId,
      actionType,
      reason: body.reason?.trim() || null,
      adminId: me.username,
      reservationId: body.reservationId?.trim() || null,
      ownerId: body.ownerId?.trim() || null,
    };
    if (body.snapshot !== undefined && body.snapshot !== null) {
      data.snapshotJson = body.snapshot as Prisma.InputJsonValue;
    }
    const row = await prisma.adminPropertyActionLog.create({ data });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/admin/property-action-logs', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
