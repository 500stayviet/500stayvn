import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appSimpleHash, prismaUserToUserData } from '@/lib/server/appUserMapper';

/**
 * 이메일/비밀번호 로그인 (앱 전용 — NextAuth OAuth와 별도)
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !password) {
    return NextResponse.json({ error: 'missing_credentials' }, { status: 400 });
  }

  try {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u || u.deleted) {
      return NextResponse.json(
        { error: { code: 'auth/user-not-found', message: 'User not found' } },
        { status: 401 }
      );
    }
    if (!u.passwordHash) {
      return NextResponse.json(
        { error: { code: 'auth/wrong-password', message: 'Use social login' } },
        { status: 401 }
      );
    }
    if (u.blocked) {
      return NextResponse.json(
        { error: { code: 'auth/user-blocked', message: 'This account is blocked by admin' } },
        { status: 403 }
      );
    }
    if (u.passwordHash !== appSimpleHash(password)) {
      return NextResponse.json(
        { error: { code: 'auth/wrong-password', message: 'Wrong password' } },
        { status: 401 }
      );
    }

    return NextResponse.json({ user: prismaUserToUserData(u) });
  } catch (e) {
    console.error('POST /api/app/auth/login', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
