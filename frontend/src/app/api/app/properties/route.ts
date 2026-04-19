import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  prismaPropertyToPropertyData,
  propertyDataToUncheckedCreate,
  propertyDataToUncheckedUpdate,
} from '@/lib/server/appPropertyMapper';
import {
  rejectAppWriteUnlessSyncSecret,
  getAppActorId,
} from '@/lib/server/appSyncWriteGuard';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import type { PropertyData } from '@/types/property';
import { reportApiException, reportApiSuccess } from '@/lib/server/apiMonitoring';
import { assertPublicCatalogGuard } from '@/lib/server/publicApiGuard';
import { mapPropertiesToPublicDTO } from '@/lib/server/publicPropertyMask';

const MAX_BATCH = 5000;

function parsePageParams(request: NextRequest): { limit: number; offset: number } {
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '200');
  const offsetRaw = Number(request.nextUrl.searchParams.get('offset') || '0');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 200;
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

/**
 * 매물 목록
 * - 관리자 또는 x-app-sync-secret: 전체
 * - 앱 액터: 본인 소유 + 예약한 매물 + 공개(active·미삭제·미숨김) 카탈로그
 */
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const { limit, offset } = parsePageParams(request);
    const cursor = parsePropertiesCursor(request);
    const admin = await getAdminFromRequest(request);
    const enforce = process.env.APP_SYNC_ENFORCE_WRITE === 'true';
    const secret = process.env.APP_SYNC_SECRET?.trim();
    const hdr = request.headers.get('x-app-sync-secret');
    const syncOk = Boolean(enforce && secret && hdr === secret);

    if (admin) {
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
      const nextCursor = makePropertiesCursor(rows[rows.length - 1] || null);
      reportApiSuccess('GET /api/app/properties', 200, startedAt);
      return NextResponse.json({
        properties: rows.map(prismaPropertyToPropertyData),
        page: {
          limit,
          offset,
          hasMore: rows.length === limit,
          nextOffset: offset + rows.length,
          nextCursor,
        },
      });
    }
    if (syncOk) {
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
      const nextCursor = makePropertiesCursor(rows[rows.length - 1] || null);
      reportApiSuccess('GET /api/app/properties', 200, startedAt);
      return NextResponse.json({
        properties: rows.map(prismaPropertyToPropertyData),
        page: {
          limit,
          offset,
          hasMore: rows.length === limit,
          nextOffset: offset + rows.length,
          nextCursor,
        },
      });
    }

    const actor = getAppActorId(request);
    /**
     * 비로그인: 공개 활성 매물만 마스킹 DTO로 반환 (레이트리밋·UA 검사는 `assertPublicCatalogGuard`).
     * 로그인(`x-app-actor-id`): 기존처럼 소유·예약·카탈로그 병합 목록(비마스킹).
     */
    if (!actor) {
      const guard = assertPublicCatalogGuard(request, 'GET /api/app/properties');
      if (guard) return guard;
      const rows = await prisma.property.findMany({
        where: {
          AND: [
            { deleted: false, hidden: false, status: 'active' },
            ...(cursor
              ? [
                  {
                    OR: [
                      { updatedAt: { lt: new Date(cursor.updatedAt) } },
                      { updatedAt: new Date(cursor.updatedAt), id: { lt: cursor.id } },
                    ],
                  },
                ]
              : []),
          ],
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: limit,
        ...(cursor ? {} : { skip: offset }),
      });
      const nextCursor = makePropertiesCursor(rows[rows.length - 1] || null);
      reportApiSuccess('GET /api/app/properties', 200, startedAt);
      return NextResponse.json({
        properties: mapPropertiesToPublicDTO(rows.map(prismaPropertyToPropertyData)),
        page: {
          limit,
          offset,
          hasMore: rows.length === limit,
          nextOffset: offset + rows.length,
          nextCursor,
        },
      });
    }

    const booked = await prisma.booking.findMany({
      where: { guestId: actor },
      select: { propertyId: true },
    });
    const bookedIds = [...new Set(booked.map((b) => b.propertyId))];

    const rows = await prisma.property.findMany({
      where: {
        AND: [
          {
            OR: [
              { ownerId: actor },
              ...(bookedIds.length > 0 ? [{ id: { in: bookedIds } }] : []),
              { deleted: false, hidden: false, status: 'active' },
            ],
          },
          ...(cursor
            ? [
                {
                  OR: [
                    { updatedAt: { lt: new Date(cursor.updatedAt) } },
                    { updatedAt: new Date(cursor.updatedAt), id: { lt: cursor.id } },
                  ],
                },
              ]
            : []),
        ],
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: limit,
      ...(cursor ? {} : { skip: offset }),
    });
    const properties = rows.map(prismaPropertyToPropertyData);
    const nextCursor = makePropertiesCursor(rows[rows.length - 1] || null);
    reportApiSuccess('GET /api/app/properties', 200, startedAt);
    return NextResponse.json({
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
    reportApiException('GET /api/app/properties', e, startedAt);
    console.error('GET /api/app/properties', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

/** 전량 동기화(upsert) — 클라이언트 LocalStorage 대체용 */
export async function PUT(request: NextRequest) {
  const startedAt = Date.now();
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

    reportApiSuccess('PUT /api/app/properties', 200, startedAt);
    return NextResponse.json({ ok: true });
  } catch (e) {
    reportApiException('PUT /api/app/properties', e, startedAt);
    console.error('PUT /api/app/properties', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
