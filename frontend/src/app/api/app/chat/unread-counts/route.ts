import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appApiError } from '@/lib/server/appApiErrors';
import { rejectAppReadUnlessActorIsUser } from '@/lib/server/appApiReadGuard';

export async function GET(request: NextRequest) {
  const userId = (request.nextUrl.searchParams.get('userId') || '').trim();
  if (!userId) return appApiError('invalid_user_id', 400);
  const denied = rejectAppReadUnlessActorIsUser(request, userId);
  if (denied) return denied;
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `
      SELECT
        CASE
          WHEN b."guestId" = $1 THEN 'guest'
          WHEN p."ownerId" = $1 THEN 'owner'
          ELSE 'other'
        END AS role,
        COUNT(*)::int AS count
      FROM "Message" m
      JOIN "ChatRoom" r ON r."id" = m."roomId"
      JOIN "Booking" b ON b."id" = r."bookingId"
      JOIN "Property" p ON p."id" = b."propertyId"
      WHERE m."isRead" = false
        AND m."senderId" <> $1
        AND (b."guestId" = $1 OR p."ownerId" = $1)
      GROUP BY role
      `,
      userId
    )) as Array<{ role: string; count: number }>;

    let asGuest = 0;
    let asOwner = 0;
    for (const row of rows) {
      if (row.role === 'guest') asGuest = Number(row.count) || 0;
      if (row.role === 'owner') asOwner = Number(row.count) || 0;
    }
    return NextResponse.json({ asGuest, asOwner });
  } catch (e) {
    console.error('GET /api/app/chat/unread-counts', e);
    return appApiError('database_unavailable', 503);
  }
}
