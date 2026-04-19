import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppActorId, rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';
import { Prisma } from '@prisma/client';

function genId(): string {
  return `apal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const ACTION_TYPES = new Set(['DELETED', 'CANCELLED']);

type Body = {
  propertyId?: string;
  actionType?: string;
  reason?: string;
  snapshot?: unknown;
  reservationId?: string;
  ownerId?: string;
};

export async function POST(request: NextRequest) {
  const actor = getAppActorId(request);
  if (!actor) return NextResponse.json({ error: 'actor_required' }, { status: 401 });

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

  const prop = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  });
  if (!prop) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const denied = rejectAppWriteUnlessActorAllowed(request, [prop.ownerId]);
  if (denied) return denied;

  if (actionType === 'CANCELLED') {
    const ownerFromBody = (body.ownerId || '').trim();
    if (!ownerFromBody || ownerFromBody !== actor || ownerFromBody !== prop.ownerId) {
      return NextResponse.json({ error: 'forbidden_actor' }, { status: 403 });
    }
  }

  try {
    const data: Prisma.AdminPropertyActionLogUncheckedCreateInput = {
      id: genId(),
      propertyId,
      actionType,
      reason: body.reason?.trim() || null,
      adminId: actor,
      reservationId: body.reservationId?.trim() || null,
      ownerId: prop.ownerId,
    };
    if (body.snapshot !== undefined && body.snapshot !== null) {
      data.snapshotJson = body.snapshot as Prisma.InputJsonValue;
    }
    const row = await prisma.adminPropertyActionLog.create({ data });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST /api/app/property-action-logs', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
