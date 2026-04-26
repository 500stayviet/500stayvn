import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  prismaPropertyToPropertyData,
  propertyDataToUncheckedCreate,
} from '@/lib/server/appPropertyMapper';
import { rejectAppWriteUnlessSyncSecret } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
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
    return appApiError('invalid_body', 400);
  }

  const properties = Array.isArray(body.properties) ? body.properties : [];
  if (properties.length === 0) {
    return appApiError('empty', 400, 'properties array is empty.');
  }
  if (properties.length > MAX_IMPORT) {
    return appApiError('too_many', 400);
  }

  try {
    const n = await prisma.property.count();
    if (n > 0) {
      return appApiOk({ skipped: true, reason: 'database_not_empty' as const });
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
    return appApiOk({
      imported,
      properties: rows.map(prismaPropertyToPropertyData),
    });
  } catch (e) {
    console.error('POST /api/app/properties/import', e);
    return appApiError('database_unavailable', 503);
  }
}
