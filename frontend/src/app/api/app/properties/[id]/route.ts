import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  prismaPropertyToPropertyData,
  propertyDataToUncheckedUpdate,
} from '@/lib/server/appPropertyMapper';
import { assertPublicCatalogGuard } from '@/lib/server/publicApiGuard';
import { mapPropertiesToPublicDTO } from '@/lib/server/publicPropertyMask';
import { getAppActorId, rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import type { PropertyData } from '@/types/property';

/**
 * 단일 매물 조회 — 비로그인은 공개 활성만 마스킹 DTO, 로그인은 소유자·비삭제 매물 전체(숨김은 소유자만).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pid = (id || '').trim();
  if (!pid) return appApiError('invalid_id', 400);

  const actor = getAppActorId(request);
  try {
    if (!actor) {
      const guard = assertPublicCatalogGuard(request, 'GET /api/app/properties/[id]');
      if (guard) return guard;
      const row = await prisma.property.findFirst({
        where: { id: pid, deleted: false, hidden: false, status: 'active' },
      });
      if (!row) return appApiError('not_found', 404);
      const full = prismaPropertyToPropertyData(row);
      return appApiOk({ property: mapPropertiesToPublicDTO([full])[0] });
    }

    const row = await prisma.property.findUnique({ where: { id: pid } });
    if (!row || row.deleted) return appApiError('not_found', 404);
    if (row.hidden && row.ownerId !== actor) {
      return appApiError('not_found', 404);
    }
    return appApiOk({ property: prismaPropertyToPropertyData(row) });
  } catch (e) {
    console.error('GET /api/app/properties/[id]', pid, e);
    return appApiError('database_unavailable', 503);
  }
}

/**
 * 소유자 단일 매물 수정 (앱 액터)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pid = (id || '').trim();
  if (!pid) return appApiError('invalid_id', 400);

  let body: { property?: PropertyData };
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }
  const incoming = body.property;
  if (!incoming || typeof incoming !== 'object' || incoming.id !== pid) {
    return appApiError('invalid_fields', 400);
  }

  try {
    const row = await prisma.property.findUnique({ where: { id: pid } });
    if (!row) return appApiError('not_found', 404);
    const denied = rejectAppWriteUnlessActorAllowed(request, [row.ownerId]);
    if (denied) return denied;

    const existing = prismaPropertyToPropertyData(row);
    const merged: PropertyData = {
      ...existing,
      ...incoming,
      id: pid,
      ownerId: row.ownerId,
    };

    const updated = await prisma.property.update({
      where: { id: pid },
      data: propertyDataToUncheckedUpdate(merged),
    });
    return appApiOk({ property: prismaPropertyToPropertyData(updated) });
  } catch (e) {
    console.error('PUT /api/app/properties/[id]', pid, e);
    return appApiError('database_unavailable', 503);
  }
}

/**
 * 매물 영구 삭제: 관련 예약·채팅·메시지 정리 후 Property 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pid = (id || '').trim();
  if (!pid) return appApiError('invalid_id', 400);

  try {
    const row = await prisma.property.findUnique({
      where: { id: pid },
      select: { ownerId: true },
    });
    if (!row) return appApiError('not_found', 404);
    const denied = rejectAppWriteUnlessActorAllowed(request, [row.ownerId]);
    if (denied) return denied;

    await prisma.$transaction(async (tx) => {
      const bookings = await tx.booking.findMany({
        where: { propertyId: pid },
        select: { id: true },
      });
      const bidList = bookings.map((b) => b.id);

      if (bidList.length > 0) {
        const rooms = await tx.chatRoom.findMany({
          where: { bookingId: { in: bidList } },
          select: { id: true },
        });
        const roomIds = rooms.map((r) => r.id);
        if (roomIds.length > 0) {
          await tx.message.deleteMany({ where: { roomId: { in: roomIds } } });
        }
        await tx.chatRoom.deleteMany({ where: { bookingId: { in: bidList } } });
        await tx.booking.deleteMany({ where: { propertyId: pid } });
      }

      await tx.property.delete({ where: { id: pid } });
    });

    return appApiOk({ deleted: true });
  } catch (e) {
    console.warn('DELETE /api/app/properties/[id]', pid, e);
    return appApiError('delete_failed', 409);
  }
}
