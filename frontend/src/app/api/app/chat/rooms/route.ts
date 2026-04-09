import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  const userId = request.nextUrl.searchParams.get('userId')?.trim();
  const bookingId = request.nextUrl.searchParams.get('bookingId')?.trim();
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
    const bookings = bookingIds.length
      ? await prisma.booking.findMany({
          where: { id: { in: bookingIds } },
          include: { property: true, guest: true },
        })
      : [];
    const bookingMap = new Map(bookings.map((b) => [b.id, b]));
    const messages = rooms.length
      ? await prisma.message.findMany({
          where: { roomId: { in: rooms.map((r) => r.id) } },
          orderBy: { createdAt: 'desc' },
        })
      : [];
    const latestMsg = new Map<string, (typeof messages)[number]>();
    for (const m of messages) {
      if (!latestMsg.has(m.roomId)) latestMsg.set(m.roomId, m);
    }
    const result: RoomDto[] = rooms.map((r) => {
      const dto = mapRoom(r);
      const b = r.bookingId ? bookingMap.get(r.bookingId) : null;
      if (b) {
        const detail = (b.detailJson || {}) as Record<string, unknown>;
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
    return NextResponse.json({ rooms: result });
  } catch (e) {
    console.error('GET /api/app/chat/rooms', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

type CreateBody = {
  bookingId?: string;
  propertyId?: string;
  ownerId?: string;
  guestId?: string;
};

export async function POST(request: NextRequest) {
  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const bookingId = (body.bookingId || '').trim();
  if (!bookingId) return NextResponse.json({ error: 'missing_booking_id' }, { status: 400 });
  try {
    const existing = await prisma.chatRoom.findFirst({ where: { bookingId } });
    if (existing) return NextResponse.json(existing);
    const created = await prisma.chatRoom.create({
      data: { bookingId },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST /api/app/chat/rooms', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
