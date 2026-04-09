import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  prismaPropertyToPropertyData,
  propertyDataToUncheckedCreate,
  propertyDataToUncheckedUpdate,
} from '@/lib/server/appPropertyMapper';
import { rejectAppWriteUnlessSyncSecret } from '@/lib/server/appSyncWriteGuard';
import type { PropertyData } from '@/types/property';

const MAX_BATCH = 5000;

/** 전체 매물 (소프트 삭제 포함 — 앱 필터링은 클라이언트) */
export async function GET() {
  try {
    const rows = await prisma.property.findMany({ orderBy: { updatedAt: 'desc' } });
    const properties = rows.map(prismaPropertyToPropertyData);
    return NextResponse.json({ properties });
  } catch (e) {
    console.error('GET /api/app/properties', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

/** 전량 동기화(upsert) — 클라이언트 LocalStorage 대체용 */
export async function PUT(request: NextRequest) {
  const denied = rejectAppWriteUnlessSyncSecret(request);
  if (denied) return denied;

  let body: { properties?: PropertyData[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const properties = Array.isArray(body.properties) ? body.properties : [];
  if (properties.length > MAX_BATCH) {
    return NextResponse.json({ error: 'too_many' }, { status: 400 });
  }

  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    const ownerOk = new Set(users.map((u) => u.id));

    await prisma.$transaction(async (tx) => {
      for (const p of properties) {
        if (!p?.id || !p.ownerId || !ownerOk.has(p.ownerId)) continue;
        try {
          await tx.property.upsert({
            where: { id: p.id },
            create: propertyDataToUncheckedCreate(p),
            update: propertyDataToUncheckedUpdate(p),
          });
        } catch (err) {
          console.warn('property upsert skip', p.id, err);
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PUT /api/app/properties', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
