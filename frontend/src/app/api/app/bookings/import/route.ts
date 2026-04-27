import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  bookingDataToUncheckedCreate,
  prismaBookingToBookingData,
} from '@/lib/server/appBookingMapper';
import { rejectAppWriteUnlessSyncSecret } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import type { BookingData } from '@/lib/api/bookings';

const MAX_IMPORT = 5000;

export async function POST(request: NextRequest) {
  const denied = rejectAppWriteUnlessSyncSecret(request);
  if (denied) return denied;

  let body: { bookings?: BookingData[] };
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }

  const bookings = Array.isArray(body.bookings) ? body.bookings : [];
  if (bookings.length === 0) {
    return appApiError('empty', 400);
  }
  if (bookings.length > MAX_IMPORT) return appApiError('too_many', 400);

  try {
    const n = await prisma.booking.count();
    if (n > 0) {
      return appApiOk({ skipped: true, reason: 'database_not_empty' as const });
    }

    const users = await prisma.user.findMany({ select: { id: true } });
    const userOk = new Set(users.map((u) => u.id));
    const props = await prisma.property.findMany({ select: { id: true } });
    const propOk = new Set(props.map((p) => p.id));

    let imported = 0;
    for (const b of bookings) {
      if (!b?.id || !b.propertyId || !b.guestId) continue;
      if (!userOk.has(b.guestId) || !propOk.has(b.propertyId)) continue;
      try {
        await prisma.booking.create({ data: bookingDataToUncheckedCreate(b) });
        imported += 1;
      } catch (err) {
        console.warn('booking import skip', b.id, err);
      }
    }

    const rows = await prisma.booking.findMany({ orderBy: { updatedAt: 'desc' } });
    return appApiOk({
      imported,
      bookings: rows.map(prismaBookingToBookingData),
    });
  } catch (e) {
    console.error('POST /api/app/bookings/import', e);
    return appApiError('database_unavailable', 503);
  }
}
