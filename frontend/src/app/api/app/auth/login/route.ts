import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import { appSimpleHash, prismaUserToUserData } from '@/lib/server/appUserMapper';

/**
 * 이메일/비밀번호 로그인 (앱 전용 — NextAuth OAuth와 별도)
 * P2.1: `AppApi` 성공/실패 봉투 (`appApiOk` / `appApiError`)
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !password) {
    return appApiError('missing_email_or_password', 400);
  }

  try {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u || u.deleted) {
      return appApiError('auth/user-not-found', 401);
    }
    if (!u.passwordHash) {
      return appApiError('auth/social_login_required', 401);
    }
    if (u.blocked) {
      return appApiError('auth/user-blocked', 403);
    }
    if (u.passwordHash !== appSimpleHash(password)) {
      return appApiError('auth/wrong-password', 401);
    }

    return appApiOk({ user: prismaUserToUserData(u) });
  } catch (e) {
    console.error('POST /api/app/auth/login', e);
    return appApiError('database_unavailable', 503);
  }
}
