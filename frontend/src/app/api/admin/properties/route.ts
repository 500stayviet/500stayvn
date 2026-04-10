import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { prismaPropertyToPropertyData } from '@/lib/server/appPropertyMapper';

function parsePageParams(request: NextRequest): { limit: number; offset: number } {
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '200');
  const offsetRaw = Number(request.nextUrl.searchParams.get('offset') || '0');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 200;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.min(50000, Math.floor(offsetRaw))) : 0;
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

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { limit, offset } = parsePageParams(request);
    const cursor = parsePropertiesCursor(request);
    const rows = await prisma.property.findMany({
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
    return NextResponse.json({
      properties: rows.map(prismaPropertyToPropertyData),
      page: {
        limit,
        offset,
        hasMore: rows.length === limit,
        nextOffset: offset + rows.length,
        nextCursor: makePropertiesCursor(rows[rows.length - 1] || null),
      },
    });
  } catch (e) {
    console.error('GET /api/admin/properties', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

