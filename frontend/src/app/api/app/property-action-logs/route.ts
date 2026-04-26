import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
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

/** 호스트 액터 기준 매물 조치 로그 기록. P2.1: AppApi 봉투. */
export async function POST(request: NextRequest) {
  const actor = getAppActorId(request);
  if (!actor) return appApiError('actor_required', 401);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }

  const propertyId = (body.propertyId || '').trim();
  const actionType = (body.actionType || '').trim();
  if (!propertyId || !ACTION_TYPES.has(actionType)) {
    return appApiError('invalid_fields', 400);
  }

  const prop = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  });
  if (!prop) return appApiError('not_found', 404);

  const denied = rejectAppWriteUnlessActorAllowed(request, [prop.ownerId]);
  if (denied) return denied;

  if (actionType === 'CANCELLED') {
    const ownerFromBody = (body.ownerId || '').trim();
    if (!ownerFromBody || ownerFromBody !== actor || ownerFromBody !== prop.ownerId) {
      return appApiError('forbidden_actor', 403);
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
    return appApiOk(row, 201);
  } catch (e) {
    console.error('POST /api/app/property-action-logs', e);
    return appApiError('database_unavailable', 503);
  }
}
