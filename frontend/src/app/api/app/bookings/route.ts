import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  bookingDataToUncheckedCreate,
  bookingDataToUncheckedUpdate,
  prismaBookingToBookingData,
} from '@/lib/server/appBookingMapper';
import {
  rejectAppWriteUnlessSyncSecret,
  getAppActorId,
} from '@/lib/server/appSyncWriteGuard';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { appApiError } from '@/lib/server/appApiErrors';
import type { BookingData } from '@/lib/api/bookings';
import { reportApiException, reportApiSuccess } from '@/lib/server/apiMonitoring';

const MAX_BATCH = 5000;

function parsePageParams(request: NextRequest): { limit: number; offset: number } {
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '200');
  const offsetRaw = Number(request.nextUrl.searchParams.get('offset') || '0');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 200;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.min(20000, Math.floor(offsetRaw))) : 0;
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

function iso(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim()) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * 서버에서도 중복 예약(동일 매물의 pending/confirmed 기간 겹침)을 막아
 * 클라이언트 우회 호출에서도 골든패스 데이터 무결성을 보장합니다.
 */
function hasOverlappingActiveBookings(bookings: BookingData[]): boolean {
  const byProperty = new Map<string, Array<{ start: string; end: string }>>();
  for (const b of bookings) {
    if (!b?.propertyId) continue;
    if (b.status !== 'pending' && b.status !== 'confirmed') continue;
    const start = iso(b.checkInDate);
    const end = iso(b.checkOutDate);
    if (!start || !end || start >= end) continue;
    if (!byProperty.has(b.propertyId)) byProperty.set(b.propertyId, []);
    byProperty.get(b.propertyId)!.push({ start, end });
  }
  for (const ranges of byProperty.values()) {
    ranges.sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < ranges.length; i += 1) {
      // [prev.start, prev.end) vs [curr.start, curr.end)
      if (ranges[i].start < ranges[i - 1].end) return true;
    }
  }
  return false;
}

/**
 * 예약 목록
 * - 관리자 또는 sync secret: 전체
 * - 앱 액터: 게스트이거나 해당 매물 소유자인 예약만
 */
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const { limit, offset } = parsePageParams(request);
    const cursor = parseBookingsCursor(request);
    const admin = await getAdminFromRequest(request);
    const enforce = process.env.APP_SYNC_ENFORCE_WRITE === 'true';
    const secret = process.env.APP_SYNC_SECRET?.trim();
    const hdr = request.headers.get('x-app-sync-secret');
    const syncOk = Boolean(enforce && secret && hdr === secret);

    if (admin || syncOk) {
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
      const nextCursor = makeBookingsCursor(rows[rows.length - 1] || null);
      reportApiSuccess('GET /api/app/bookings', 200, startedAt);
      return NextResponse.json({
        bookings: rows.map(prismaBookingToBookingData),
        page: {
          limit,
          offset,
          hasMore: rows.length === limit,
          nextOffset: offset + rows.length,
          nextCursor,
        },
      });
    }

    const actor = getAppActorId(request);
    if (!actor) return appApiError('actor_required', 401);

    const rows = await prisma.booking.findMany({
      where: {
        AND: [
          { OR: [{ guestId: actor }, { property: { ownerId: actor } }] },
          ...(cursor
            ? [
                {
                  OR: [
                    { updatedAt: { lt: new Date(cursor.updatedAt) } },
                    { updatedAt: new Date(cursor.updatedAt), id: { lt: cursor.id } },
                  ],
                },
              ]
            : []),
        ],
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      ...(cursor ? {} : { skip: offset }),
    });
    const nextCursor = makeBookingsCursor(rows[rows.length - 1] || null);
    reportApiSuccess('GET /api/app/bookings', 200, startedAt);
    return NextResponse.json({
      bookings: rows.map(prismaBookingToBookingData),
      page: {
        limit,
        offset,
        hasMore: rows.length === limit,
        nextOffset: offset + rows.length,
        nextCursor,
      },
    });
  } catch (e) {
    reportApiException('GET /api/app/bookings', e, startedAt);
    console.error('GET /api/app/bookings', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const startedAt = Date.now();
  const denied = rejectAppWriteUnlessSyncSecret(request);
  if (denied) return denied;

  let body: { bookings?: BookingData[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const bookings = Array.isArray(body.bookings) ? body.bookings : [];
  if (bookings.length > MAX_BATCH) {
    return NextResponse.json({ error: 'too_many' }, { status: 400 });
  }
  if (hasOverlappingActiveBookings(bookings)) {
    return NextResponse.json({ error: 'duplicate_booking_overlap' }, { status: 409 });
  }

  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    const userOk = new Set(users.map((u) => u.id));
    const props = await prisma.property.findMany({ select: { id: true } });
    const propOk = new Set(props.map((p) => p.id));

    await prisma.$transaction(async (tx) => {
      for (const b of bookings) {
        if (!b?.id || !b.propertyId || !b.guestId) continue;
        if (!userOk.has(b.guestId) || !propOk.has(b.propertyId)) continue;
        try {
          await tx.booking.upsert({
            where: { id: b.id },
            create: bookingDataToUncheckedCreate(b),
            update: bookingDataToUncheckedUpdate(b),
          });
        } catch (err) {
          console.warn('booking upsert skip', b.id, err);
        }
      }
    });

    reportApiSuccess('PUT /api/app/bookings', 200, startedAt);
    return NextResponse.json({ ok: true });
  } catch (e) {
    reportApiException('PUT /api/app/bookings', e, startedAt);
    console.error('PUT /api/app/bookings', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
