import { NextResponse } from 'next/server';
import { adminSessionCookieOptions } from '@/lib/server/adminAuthServer';
import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/server/adminSessionToken';

export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', {
    ...adminSessionCookieOptions(60 * 60 * 24 * 7),
    maxAge: 0,
  });
  return res;
}
