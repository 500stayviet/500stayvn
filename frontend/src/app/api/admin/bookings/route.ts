import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { prismaBookingToBookingData } from '@/lib/server/appBookingMapper';

function parsePageParams(request: NextRequest): { limit: number; offset: number } {
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '200');
  const offsetRaw = Number(request.nextUrl.searchParams.get('offset') || '0');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 200;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.min(50000, Math.floor(offsetRaw))) : 0;
  return { limit, offset };
}

type BookingsCursor = { updatedAt: string; id: string };

function parseBookingsCursor(request: NextRequest): BookingsCursor | null {
  const raw = (request.nextUrl.searchParams.get('cursor') || '').trim();
  if (!raw) return null;
  try {
    const decoded = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as BookingsCursor;
    if (!decoded?.updatedAt || !decoded?.id) return null;
    return decoded;
  } catch {
    return null;
  }
}

function makeBookingsCursor(next: { updatedAt?: Date | null; id: string } | null): string | null {
  if (!next?.updatedAt) return null;
  const payload: BookingsCursor = { updatedAt: next.updatedAt.toISOString(), id: next.id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { limit, offset } = parsePageParams(request);
    const cursor = parseBookingsCursor(request);
    const rows = await prisma.booking.findMany({
      where: cursor
        ? {
            OR: [
              { updatedAt: { lt: new Date(cursor.updatedAt) } },
              { updatedAt: new Date(cursor.updatedAt), id: { lt: cursor.id } },
            ],
          }
        : undefined,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      ...(cursor ? {} : { skip: offset }),
    });
    return NextResponse.json({
      bookings: rows.map(prismaBookingToBookingData),
      page: {
        limit,
        offset,
        hasMore: rows.length === limit,
        nextOffset: offset + rows.length,
        nextCursor: makeBookingsCursor(rows[rows.length - 1] || null),
      },
    });
  } catch (e) {
    console.error('GET /api/admin/bookings', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

