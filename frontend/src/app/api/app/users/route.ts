import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  appSimpleHash,
  prismaUserToUserData,
} from '@/lib/server/appUserMapper';
import type { SignUpData } from '@/lib/api/auth';

/**
 * 앱 회원 목록 (삭제되지 않은 계정만) — PostgreSQL 원장
 */
export async function GET() {
  try {
    const rows = await prisma.user.findMany({
      where: { deleted: false },
      orderBy: { updatedAt: 'desc' },
    });
    const users = rows.map(prismaUserToUserData);
    return NextResponse.json({ users });
  } catch (e) {
    console.error('GET /api/app/users', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

/**
 * 이메일 회원가입
 */
export async function POST(request: NextRequest) {
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

    return NextResponse.json(prismaUserToUserData(created), { status: 201 });
  } catch (e) {
    console.error('POST /api/app/users', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
