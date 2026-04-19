import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertPublicCatalogGuard } from '@/lib/server/publicApiGuard';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

/**
 * 매물별 예약 점유 구간(가용 달력용) — 게스트 PII 없이 checkIn/checkOut 만 반환.
 * 비로그인 시 `assertPublicCatalogGuard` 적용, 로그인 액터는 동일 데이터(추가 비용 없음).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const pid = (id || '').trim();
  if (!pid) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const actor = getAppActorId(request);
  if (!actor) {
    const guard = assertPublicCatalogGuard(request, 'GET /api/app/properties/[id]/availability');
    if (guard) return guard;
    const visible = await prisma.property.findFirst({
      where: { id: pid, deleted: false, hidden: false, status: 'active' },
      select: { id: true },
    });
    if (!visible) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  } else {
    const row = await prisma.property.findUnique({
      where: { id: pid },
      select: { deleted: true, hidden: true, ownerId: true },
    });
    if (!row || row.deleted) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    if (row.hidden && row.ownerId !== actor) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
  }

  try {
    const rows = await prisma.booking.findMany({
      where: {
        propertyId: pid,
        status: { in: ['pending', 'confirmed'] },
      },
      select: { checkInDate: true, checkOutDate: true },
    });
    return NextResponse.json({
      ranges: rows.map((r) => ({
        checkIn: r.checkInDate.toISOString(),
        checkOut: r.checkOutDate.toISOString(),
      })),
    });
  } catch (e) {
    console.error('GET /api/app/properties/[id]/availability', pid, e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
