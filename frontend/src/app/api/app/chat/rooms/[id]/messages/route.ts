import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import { rejectAppReadUnlessRoomParticipant } from '@/lib/server/appApiReadGuard'; 
import { reportApiException, reportApiSuccess } from '@/lib/server/apiMonitoring';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const roomId = (id || '').trim();
  if (!roomId) return appApiError('invalid_room_id', 400);
  const deniedRead = await rejectAppReadUnlessRoomParticipant(request, roomId);
  if (deniedRead) return deniedRead;
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
    reportApiSuccess('GET /api/app/chat/rooms/[id]/messages', 200, startedAt);
    return appApiOk({ messages });
  } catch (e) {
    reportApiException('GET /api/app/chat/rooms/[id]/messages', e, startedAt);
    console.error('GET /api/app/chat/rooms/[id]/messages', e);
    return appApiError('database_unavailable', 503);
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
  const startedAt = Date.now();
  const { id } = await context.params;
  const roomId = (id || '').trim();
  if (!roomId) return appApiError('invalid_room_id', 400);
  let body: PostBody;
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }
  const senderId = (body.senderId || '').trim();
  const content = (body.content || '').trim();
  if (!senderId || !content) return appApiError('invalid_fields', 400);
  const denied = rejectAppWriteUnlessActorAllowed(request, [senderId]);
  if (denied) return denied;
  try {
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      select: { bookingId: true },
    });
    const bookingId = room?.bookingId || null;
    if (!bookingId) return appApiError('room_not_found', 404);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: { select: { ownerId: true } } },
    });
    if (!booking) return appApiError('booking_not_found', 404);
    if (senderId !== booking.guestId && senderId !== booking.property.ownerId) {
      return appApiError('forbidden_sender', 403);
    }

    const msg = await prisma.message.create({
      data: {
        roomId,
        senderId,
        content,
        isRead: false,
      },
    });
    return appApiOk(
      {
        message: {
          id: msg.id,
          chatRoomId: msg.roomId,
          senderId: msg.senderId,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          isRead: msg.isRead,
        },
      },
      201
    );
  } catch (e) {
    reportApiException('POST /api/app/chat/rooms/[id]/messages', e, startedAt);
    console.error('POST /api/app/chat/rooms/[id]/messages', e);
    return appApiError('database_unavailable', 503);
  }
}
