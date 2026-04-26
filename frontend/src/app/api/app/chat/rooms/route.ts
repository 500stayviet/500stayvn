import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import {
  rejectAppReadUnlessActorIsUser,
  rejectAppReadUnlessBookingParticipant,
} from '@/lib/server/appApiReadGuard';
import { reportApiException, reportApiSuccess } from '@/lib/server/apiMonitoring';

type BookingWithRoomRelations = Prisma.BookingGetPayload<{
  include: { property: true; guest: true };
}>;

/**
 * Prisma 페이로드에 `detailJson`이 있어도 일부 TS 언어 서비스가 scalar를 누락할 수 있어
 * 읽기만 교차 타입으로 통일한다.
 */
function getBookingDetailRecord(b: BookingWithRoomRelations): Record<string, unknown> {
  const raw = (b as BookingWithRoomRelations & { detailJson?: Prisma.JsonValue | null })
    .detailJson;
  if (raw == null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  return {};
}

type RoomDto = {
  id: string;
  bookingId: string;
  propertyId: string;
  propertyTitle?: string;
  propertyImage?: string;
  ownerId: string;
  ownerName?: string;
  guestId: string;
  guestName?: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
};

function chatRoomRowToApi(room: { id: string; bookingId: string | null; createdAt: Date }) {
  return {
    id: room.id,
    bookingId: room.bookingId ?? '',
    createdAt: room.createdAt.toISOString(),
  };
}

function mapRoom(room: { id: string; bookingId: string | null; createdAt: Date }): RoomDto {
  return {
    id: room.id,
    bookingId: room.bookingId || '',
    propertyId: '',
    ownerId: '',
    guestId: '',
    createdAt: room.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const userId = request.nextUrl.searchParams.get('userId')?.trim();
  const bookingId = request.nextUrl.searchParams.get('bookingId')?.trim();
  if (!userId && !bookingId) {
    return appApiError('missing_scope', 400);
  }
  if (userId) {
    const deniedUser = rejectAppReadUnlessActorIsUser(request, userId);
    if (deniedUser) return deniedUser;
  }
  if (bookingId) {
    const deniedBooking = await rejectAppReadUnlessBookingParticipant(request, bookingId);
    if (deniedBooking) return deniedBooking;
  }
  try {
    let rooms = await prisma.chatRoom.findMany({
      where: bookingId ? { bookingId } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    if (!bookingId && userId) {
      const bookingRows = await prisma.booking.findMany({
        where: {
          OR: [{ guestId: userId }, { property: { ownerId: userId } }],
        },
        select: { id: true },
      });
      const allowed = new Set(bookingRows.map((b) => b.id));
      rooms = rooms.filter((r) => (r.bookingId ? allowed.has(r.bookingId) : false));
    }
    const bookingIds = rooms.map((r) => r.bookingId).filter((v): v is string => !!v);
    const bookings: BookingWithRoomRelations[] = bookingIds.length
      ? await prisma.booking.findMany({
          where: { id: { in: bookingIds } },
          include: { property: true, guest: true },
        })
      : [];
    const bookingMap = new Map<string, BookingWithRoomRelations>(
      bookings.map((b) => [b.id, b])
    );
    const roomIds = rooms.map((r) => r.id);
    type LatestRow = {
      id: string;
      roomId: string;
      senderId: string;
      content: string;
      createdAt: Date;
    };
    const latestRows: LatestRow[] =
      roomIds.length > 0
        ? await prisma.$queryRaw<LatestRow[]>`
            SELECT DISTINCT ON ("roomId") "id", "roomId", "senderId", "content", "createdAt"
            FROM "Message"
            WHERE "roomId" IN (${Prisma.join(roomIds)})
            ORDER BY "roomId", "createdAt" DESC
          `
        : [];
    const latestMsg = new Map<string, LatestRow>(latestRows.map((m) => [m.roomId, m]));
    const result: RoomDto[] = rooms.map((r) => {
      const dto = mapRoom(r);
      const b = r.bookingId ? bookingMap.get(r.bookingId) : null;
      if (b) {
        const detail = getBookingDetailRecord(b);
        dto.propertyId = b.propertyId;
        dto.propertyTitle = String(detail.propertyTitle || b.property.title || '');
        dto.propertyImage = String(detail.propertyImage || '');
        dto.ownerId = b.property.ownerId;
        dto.ownerName = String(detail.ownerName || '');
        dto.guestId = b.guestId;
        dto.guestName = String(detail.guestName || b.guest.displayName || b.guest.name || '');
      }
      const lm = latestMsg.get(r.id);
      if (lm) {
        dto.lastMessage = lm.content;
        dto.lastMessageAt = lm.createdAt.toISOString();
        dto.lastMessageSenderId = lm.senderId;
      }
      return dto;
    });
    reportApiSuccess('GET /api/app/chat/rooms', 200, startedAt);
    return appApiOk({ rooms: result });
  } catch (e) {
    reportApiException('GET /api/app/chat/rooms', e, startedAt);
    console.error('GET /api/app/chat/rooms', e);
    return appApiError('database_unavailable', 503);
  }
}

type CreateBody = {
  bookingId?: string;
  propertyId?: string;
  ownerId?: string;
  guestId?: string;
};

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }
  const bookingId = (body.bookingId || '').trim();
  if (!bookingId) return appApiError('missing_booking_id', 400);
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });
    if (!booking) return appApiError('booking_not_found', 404);
    const denied = rejectAppWriteUnlessActorAllowed(request, [booking.guestId, booking.property.ownerId]);
    if (denied) return denied;
    const existing = await prisma.chatRoom.findFirst({ where: { bookingId } });
    if (existing) return appApiOk({ room: chatRoomRowToApi(existing) });
    const created = await prisma.chatRoom.create({
      data: { bookingId },
    });
    reportApiSuccess('POST /api/app/chat/rooms', 201, startedAt);
    return appApiOk({ room: chatRoomRowToApi(created) }, 201);
  } catch (e) {
    reportApiException('POST /api/app/chat/rooms', e, startedAt);
    console.error('POST /api/app/chat/rooms', e);
    return appApiError('database_unavailable', 503);
  }
}
