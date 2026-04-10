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
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Math.floor(limitRaw))) : 200;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.min(20000, Math.floor(offsetRaw))) : 0;
  return { limit, offset };
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
    const admin = await getAdminFromRequest(request);
    const enforce = process.env.APP_SYNC_ENFORCE_WRITE === 'true';
    const secret = process.env.APP_SYNC_SECRET?.trim();
    const hdr = request.headers.get('x-app-sync-secret');
    const syncOk = Boolean(enforce && secret && hdr === secret);

    if (admin || syncOk) {
      const rows = await prisma.booking.findMany({
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      });
      reportApiSuccess('GET /api/app/bookings', 200, startedAt);
      return NextResponse.json({
        bookings: rows.map(prismaBookingToBookingData),
        page: { limit, offset, hasMore: rows.length === limit, nextOffset: offset + rows.length },
      });
    }

    const actor = getAppActorId(request);
    if (!actor) return appApiError('actor_required', 401);

    const rows = await prisma.booking.findMany({
      where: {
        OR: [{ guestId: actor }, { property: { ownerId: actor } }],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });
    reportApiSuccess('GET /api/app/bookings', 200, startedAt);
    return NextResponse.json({
      bookings: rows.map(prismaBookingToBookingData),
      page: { limit, offset, hasMore: rows.length === limit, nextOffset: offset + rows.length },
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
