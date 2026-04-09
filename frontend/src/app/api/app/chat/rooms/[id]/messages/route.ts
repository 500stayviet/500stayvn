import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const roomId = (id || '').trim();
  if (!roomId) return NextResponse.json({ error: 'invalid_room_id' }, { status: 400 });
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '200');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Math.floor(limitRaw))) : 200;
  const before = (request.nextUrl.searchParams.get('before') || '').trim();
  try {
    const rows = await prisma.message.findMany({
      where: {
        roomId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const ordered = [...rows].reverse();
    const messages = ordered.map((m) => ({
      id: m.id,
      chatRoomId: m.roomId,
      senderId: m.senderId,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      isRead: m.isRead,
    }));
    return NextResponse.json({ messages });
  } catch (e) {
    console.error('GET /api/app/chat/rooms/[id]/messages', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

type PostBody = {
  senderId?: string;
  content?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const roomId = (id || '').trim();
  if (!roomId) return NextResponse.json({ error: 'invalid_room_id' }, { status: 400 });
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const senderId = (body.senderId || '').trim();
  const content = (body.content || '').trim();
  if (!senderId || !content) return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
  const denied = rejectAppWriteUnlessActorAllowed(request, [senderId]);
  if (denied) return denied;
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
    if (senderId !== booking.guestId && senderId !== booking.property.ownerId) {
      return NextResponse.json({ error: 'forbidden_sender' }, { status: 403 });
    }

    const msg = await prisma.message.create({
      data: {
        roomId,
        senderId,
        content,
        isRead: false,
      },
    });
    return NextResponse.json(
      {
        id: msg.id,
        chatRoomId: msg.roomId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        isRead: msg.isRead,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error('POST /api/app/chat/rooms/[id]/messages', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
