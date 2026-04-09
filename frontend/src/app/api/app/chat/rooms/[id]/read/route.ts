import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';

type Body = {
  userId?: string;
  all?: boolean;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const roomId = (id || '').trim();
  if (!roomId) return NextResponse.json({ error: 'invalid_room_id' }, { status: 400 });
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const userId = (body.userId || '').trim();
  if (!body.all && !userId) {
    return NextResponse.json({ error: 'invalid_user_id' }, { status: 400 });
  }
  try {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { bookingId: true },
    });
    const bookingId = room?.bookingId || null;
    if (!bookingId) return NextResponse.json({ error: 'room_not_found' }, { status: 404 });
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: { select: { ownerId: true } } },
    });
    if (!booking) return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
    const denied = rejectAppWriteUnlessActorAllowed(request, [booking.guestId, booking.property.ownerId]);
    if (denied) return denied;

    const result = await prisma.message.updateMany({
      where: {
        roomId,
        isRead: false,
        ...(body.all ? {} : { senderId: { not: userId || booking.guestId } }),
      },
      data: { isRead: true },
    });
    return NextResponse.json({ updated: result.count });
  } catch (e) {
    console.error('PATCH /api/app/chat/rooms/[id]/read', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
