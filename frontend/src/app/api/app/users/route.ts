import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  appSimpleHash,
  prismaUserToUserData,
} from '@/lib/server/appUserMapper';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { appApiError } from '@/lib/server/appApiErrors';
import type { SignUpData } from '@/lib/api/auth';
import { reportApiException, reportApiSuccess } from '@/lib/server/apiMonitoring';

function parsePageParams(request: NextRequest): { limit: number; offset: number } {
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '200');
  const offsetRaw = Number(request.nextUrl.searchParams.get('offset') || '0');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 200;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.min(20000, Math.floor(offsetRaw))) : 0;
  return { limit, offset };
}

type UsersCursor = { updatedAt: string; id: string };

function parseUsersCursor(request: NextRequest): UsersCursor | null {
  const raw = (request.nextUrl.searchParams.get('cursor') || '').trim();
  if (!raw) return null;
  try {
    const decoded = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as UsersCursor;
    if (!decoded?.updatedAt || !decoded?.id) return null;
    return decoded;
  } catch {
    return null;
  }
}

function makeUsersCursor(next: { updatedAt?: Date | null; id: string } | null): string | null {
  if (!next?.updatedAt) return null;
  const payload: UsersCursor = { updatedAt: next.updatedAt.toISOString(), id: next.id };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * 앱 회원 목록
 * - 관리자 세션: 전체(미삭제)
 * - 앱 액터: 본인 한 명만
 */
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const { limit, offset } = parsePageParams(request);
    const cursor = parseUsersCursor(request);
    const admin = await getAdminFromRequest(request);
    if (admin) {
      const rows = await prisma.user.findMany({
        where: {
          deleted: false,
          ...(cursor
            ? {
                OR: [
                  { updatedAt: { lt: new Date(cursor.updatedAt) } },
                  { updatedAt: new Date(cursor.updatedAt), id: { lt: cursor.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: limit,
        ...(cursor ? {} : { skip: offset }),
      });
      const users = rows.map(prismaUserToUserData);
      const nextCursor = makeUsersCursor(rows[rows.length - 1] || null);
      reportApiSuccess('GET /api/app/users', 200, startedAt);
      return NextResponse.json({
        users,
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
    if (!actor) return appApiError('actor_required', 401);
    const row = await prisma.user.findFirst({
      where: { id: actor, deleted: false },
    });
    const users = row ? [prismaUserToUserData(row)] : [];
    reportApiSuccess('GET /api/app/users', 200, startedAt);
    return NextResponse.json({
      users,
      page: {
        limit,
        offset,
        hasMore: false,
        nextOffset: offset + users.length,
        nextCursor: null,
      },
    });
  } catch (e) {
    reportApiException('GET /api/app/users', e, startedAt);
    console.error('GET /api/app/users', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

/**
 * 이메일 회원가입
 */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let body: SignUpData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !password) {
    return NextResponse.json({ error: 'missing_email_or_password' }, { status: 400 });
  }

  try {
    const dup = await prisma.user.findUnique({ where: { email } });
    if (dup && !dup.deleted) {
      return NextResponse.json(
        { error: { code: 'auth/email-already-in-use', message: 'Email already in use' } },
        { status: 409 }
      );
    }

    if (dup && dup.deleted) {
      const revived = await prisma.user.update({
        where: { id: dup.id },
        data: {
          passwordHash: appSimpleHash(password),
          displayName: body.fullName || null,
          name: body.fullName || null,
          phoneNumber: body.phoneNumber || null,
          gender: body.gender || null,
          preferredLanguage: body.preferredLanguage || null,
          role: 'user',
          verificationStatus: 'none',
          isOwner: false,
          blocked: false,
          blockedAt: null,
          blockedReason: null,
          deleted: false,
          deletedAt: null,
          profileJson: null,
        },
      });
      reportApiSuccess('POST /api/app/users', 200, startedAt);
      return NextResponse.json(prismaUserToUserData(revived), { status: 200 });
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const created = await prisma.user.create({
      data: {
        id,
        email,
        passwordHash: appSimpleHash(password),
        displayName: body.fullName || null,
        name: body.fullName || null,
        phoneNumber: body.phoneNumber || null,
        gender: body.gender || null,
        preferredLanguage: body.preferredLanguage || null,
        role: 'user',
        verificationStatus: 'none',
        isOwner: false,
      },
    });

    reportApiSuccess('POST /api/app/users', 201, startedAt);
    return NextResponse.json(prismaUserToUserData(created), { status: 201 });
  } catch (e) {
    reportApiException('POST /api/app/users', e, startedAt);
    console.error('POST /api/app/users', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
