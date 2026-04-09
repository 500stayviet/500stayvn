import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  prismaPropertyToPropertyData,
  propertyDataToUncheckedCreate,
} from '@/lib/server/appPropertyMapper';
import { rejectAppWriteUnlessSyncSecret } from '@/lib/server/appSyncWriteGuard';
import type { PropertyData } from '@/types/property';

const MAX_IMPORT = 5000;

/** DB에 매물이 하나도 없을 때만 로컬 데이터 일괄 삽입 */
export async function POST(request: NextRequest) {
  const denied = rejectAppWriteUnlessSyncSecret(request);
  if (denied) return denied;

  let body: { properties?: PropertyData[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const properties = Array.isArray(body.properties) ? body.properties : [];
  if (properties.length === 0) {
    return NextResponse.json({ error: 'empty' }, { status: 400 });
  }
  if (properties.length > MAX_IMPORT) {
    return NextResponse.json({ error: 'too_many' }, { status: 400 });
  }

  try {
    const n = await prisma.property.count();
    if (n > 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'database_not_empty' });
    }

    const users = await prisma.user.findMany({ select: { id: true } });
    const ownerOk = new Set(users.map((u) => u.id));

    let imported = 0;
    for (const p of properties) {
      if (!p?.id || !p.ownerId || !ownerOk.has(p.ownerId)) continue;
      try {
        await prisma.property.create({ data: propertyDataToUncheckedCreate(p) });
        imported += 1;
      } catch (err) {
        console.warn('property import skip', p.id, err);
      }
    }

    const rows = await prisma.property.findMany({ orderBy: { updatedAt: 'desc' } });
    return NextResponse.json({
      ok: true,
      imported,
      properties: rows.map(prismaPropertyToPropertyData),
    });
  } catch (e) {
    console.error('POST /api/app/properties/import', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
