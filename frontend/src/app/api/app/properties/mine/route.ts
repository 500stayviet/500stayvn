import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { prismaPropertyToPropertyData } from '@/lib/server/appPropertyMapper';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import { reportApiException, reportApiSuccess } from '@/lib/server/apiMonitoring';

function parsePageParams(request: NextRequest): { limit: number; offset: number } {
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '100');
  const offsetRaw = Number(request.nextUrl.searchParams.get('offset') || '0');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 100;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.min(20000, Math.floor(offsetRaw))) : 0;
  return { limit, offset };
}

type PropertiesCursor = { updatedAt: string; id: string };

function parsePropertiesCursor(request: NextRequest): PropertiesCursor | null {
  const raw = (request.nextUrl.searchParams.get('cursor') || '').trim();
  if (!raw) return null;
  try {
    const decoded = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as PropertiesCursor;
    if (!decoded?.updatedAt || !decoded?.id) return null;
    return decoded;
  } catch {
    return null;
  }
}

function makePropertiesCursor(next: { updatedAt?: Date | null; id: string } | null): string | null {
  if (!next?.updatedAt) return null;
  const payload: PropertiesCursor = { updatedAt: next.updatedAt.toISOString(), id: next.id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

const hostMineBaseWhere = (actor: string) => ({
  ownerId: actor,
  deleted: false,
  NOT: { id: { contains: '_child_' } },
});

/** Host-owned listings only (no public catalog merge) — `/profile/my-properties`. */
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const actor = getAppActorId(request);
    if (!actor) return appApiError('actor_required', 401);

    const { limit, offset } = parsePageParams(request);
    const cursor = parsePropertiesCursor(request);
    const base = hostMineBaseWhere(actor);

    const rows = await prisma.property.findMany({
      where: cursor
        ? {
            AND: [
              base,
              {
                OR: [
                  { updatedAt: { lt: new Date(cursor.updatedAt) } },
                  { updatedAt: new Date(cursor.updatedAt), id: { lt: cursor.id } },
                ],
              },
            ],
          }
        : base,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      ...(cursor ? {} : { skip: offset }),
    });

    const properties = rows.map(prismaPropertyToPropertyData);
    const nextCursor = makePropertiesCursor(rows[rows.length - 1] || null);
    reportApiSuccess('GET /api/app/properties/mine', 200, startedAt);
    return appApiOk({
      properties,
      page: {
        limit,
        offset,
        hasMore: rows.length === limit,
        nextOffset: offset + rows.length,
        nextCursor,
      },
    });
  } catch (e) {
    reportApiException('GET /api/app/properties/mine', e, startedAt);
    console.error('GET /api/app/properties/mine', e);
    return appApiError('database_unavailable', 503);
  }
}
