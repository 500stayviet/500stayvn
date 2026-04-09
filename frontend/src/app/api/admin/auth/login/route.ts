import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  adminSessionCookieOptions,
  createSignedSessionValue,
  hashAdminPassword,
  verifyAdminPassword,
} from '@/lib/server/adminAuthServer';
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/server/adminSessionToken';

export const dynamic = 'force-dynamic';

function getBootstrapCredentials(): { username: string; password: string } {
  const username =
    process.env.ADMIN_BOOTSTRAP_USERNAME?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_USERNAME?.trim() ||
    'admin';
  const password =
    process.env.ADMIN_BOOTSTRAP_PASSWORD ||
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
    'admin1234';
  return { username, password };
}

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) {
    return NextResponse.json({ error: 'username and password required' }, { status: 400 });
  }

  let account = await prisma.adminAccount.findUnique({ where: { username } });

  if (!account) {
    const n = await prisma.adminAccount.count();
    const boot = getBootstrapCredentials();
    if (n === 0 && username === boot.username && password === boot.password) {
      account = await prisma.adminAccount.create({
        data: {
          username: boot.username,
          nickname: '',
          passwordHash: hashAdminPassword(password),
          isSuperAdmin: true,
          permissions: {},
        },
      });
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } else if (!verifyAdminPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = createSignedSessionValue(account.id);
  const res = NextResponse.json({
    ok: true,
    username: account.username,
    isSuperAdmin: account.isSuperAdmin,
  });
  res.cookies.set(ADMIN_SESSION_COOKIE_NAME, token, adminSessionCookieOptions(60 * 60 * 24 * 7));
  return res;
}
