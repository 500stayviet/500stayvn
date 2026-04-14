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

async function ensureAdminAccountSchemaCompatibility() {
  // Legacy deployments may still have `password` instead of `passwordHash`.
  // Keep login route resilient by backfilling the expected columns at runtime.
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AdminAccount" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AdminAccount" ADD COLUMN IF NOT EXISTS "nickname" TEXT DEFAULT \'\''
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "AdminAccount" ADD COLUMN IF NOT EXISTS "permissions" JSONB DEFAULT \'{}\'::jsonb'
  );
  const passwordColumnRows = (await prisma.$queryRawUnsafe(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'AdminAccount' AND column_name = 'password' LIMIT 1"
  )) as Array<{ '?column?': number }>;
  if (Array.isArray(passwordColumnRows) && passwordColumnRows.length > 0) {
    await prisma.$executeRawUnsafe(
      'UPDATE "AdminAccount" SET "passwordHash" = "password" WHERE "passwordHash" IS NULL AND "password" IS NOT NULL'
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAdminAccountSchemaCompatibility();
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
    } else if (!account.passwordHash || !verifyAdminPassword(password, account.passwordHash)) {
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
  } catch (error) {
    console.error('admin login failed', error);
    return NextResponse.json({ error: 'Login service unavailable' }, { status: 503 });
  }
}
