import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  bookingDataToUncheckedCreate,
  bookingDataToUncheckedUpdate,
  prismaBookingToBookingData,
} from '@/lib/server/appBookingMapper';
import { rejectAppWriteUnlessSyncSecret } from '@/lib/server/appSyncWriteGuard';
import type { BookingData } from '@/lib/api/bookings';

const MAX_BATCH = 5000;

export async function GET() {
  try {
    const rows = await prisma.booking.findMany({ orderBy: { updatedAt: 'desc' } });
    const bookings = rows.map(prismaBookingToBookingData);
    return NextResponse.json({ bookings });
  } catch (e) {
    console.error('GET /api/app/bookings', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
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

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PUT /api/app/bookings', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
