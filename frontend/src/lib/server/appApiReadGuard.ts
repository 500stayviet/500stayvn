import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';

/** 민감 읽기: 쿼리의 userId 는 반드시 x-app-actor-id 와 일치해야 합니다. */
export function rejectAppReadUnlessActorIsUser(
  request: NextRequest,
  userId: string
): NextResponse | null {
  const uid = (userId || '').trim();
  if (!uid) return appApiError('invalid_user_id', 400);
  const actor = getAppActorId(request);
  if (!actor) return appApiError('actor_required', 401);
  if (actor !== uid) return appApiError('forbidden_actor', 403);
  return null;
}

/** 민감 읽기: actor 는 해당 예약의 게스트 또는 매물 소유자여야 합니다. */
export async function rejectAppReadUnlessBookingParticipant(
  request: NextRequest,
  bookingId: string
): Promise<NextResponse | null> {
  const bid = (bookingId || '').trim();
  if (!bid) return appApiError('invalid_booking_id', 400);
  const actor = getAppActorId(request);
  if (!actor) return appApiError('actor_required', 401);
  const booking = await prisma.booking.findUnique({
    where: { id: bid },
    include: { property: { select: { ownerId: true } } },
  });
  if (!booking) return appApiError('booking_not_found', 404);
  if (actor !== booking.guestId && actor !== booking.property.ownerId) {
    return appApiError('forbidden_actor', 403);
  }
  return null;
}

/** 민감 읽기: 채팅방의 예약 참가자만 허용. */
export async function rejectAppReadUnlessRoomParticipant(
  request: NextRequest,
  roomId: string
): Promise<NextResponse | null> {
  const rid = (roomId || '').trim();
  if (!rid) return appApiError('invalid_room_id', 400);
  const actor = getAppActorId(request);
  if (!actor) return appApiError('actor_required', 401);
  const rows = (await prisma.$queryRawUnsafe(
    `
    SELECT b."guestId" AS "guestId", p."ownerId" AS "ownerId"
    FROM "ChatRoom" r
    JOIN "Booking" b ON b."id" = r."bookingId"
    JOIN "Property" p ON p."id" = b."propertyId"
    WHERE r."id" = $1
    LIMIT 1
    `,
    rid
  )) as Array<{ guestId: string; ownerId: string }>;
  const row = rows[0];
  if (!row) return appApiError('room_not_found', 404);
  if (actor !== row.guestId && actor !== row.ownerId) {
    return appApiError('forbidden_actor', 403);
  }
  return null;
}
