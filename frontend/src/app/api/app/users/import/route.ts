import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  localStorageUserToPrismaUncheckedCreate,
  prismaUserToUserData,
} from '@/lib/server/appUserMapper';
import { rejectAppWriteUnlessSyncSecret } from '@/lib/server/appSyncWriteGuard';
import type { UserData } from '@/lib/api/auth';

const MAX_IMPORT = 2000;

/**
 * 로컬 스토리지에만 있던 회원을 최초 1회 DB로 승격 (DB가 비어 있을 때만)
 */
export async function POST(request: NextRequest) {
  const denied = rejectAppWriteUnlessSyncSecret(request);
  if (denied) return denied;

  let body: { users?: UserData[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const users = Array.isArray(body.users) ? body.users : [];
  if (users.length === 0) {
    return NextResponse.json({ error: 'empty' }, { status: 400 });
  }
  if (users.length > MAX_IMPORT) {
    return NextResponse.json({ error: 'too_many' }, { status: 400 });
  }

  try {
    const n = await prisma.user.count();
    if (n > 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'database_not_empty' });
    }

    let imported = 0;
    for (const u of users) {
      if (!u?.uid || !u.email) continue;
      try {
        await prisma.user.create({
          data: localStorageUserToPrismaUncheckedCreate(u),
        });
        imported += 1;
      } catch (err) {
        console.warn('import user skip', u.uid, err);
      }
    }

    const rows = await prisma.user.findMany({ where: { deleted: false } });
    return NextResponse.json({
      ok: true,
      imported,
      users: rows.map(prismaUserToUserData),
    });
  } catch (e) {
    console.error('POST /api/app/users/import', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
