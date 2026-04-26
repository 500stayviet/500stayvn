import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  localStorageUserToPrismaUncheckedCreate,
  prismaUserToUserData,
} from '@/lib/server/appUserMapper';
import { rejectAppWriteUnlessSyncSecret } from '@/lib/server/appSyncWriteGuard';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
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
    return appApiError('invalid_body', 400);
  }

  const users = Array.isArray(body.users) ? body.users : [];
  if (users.length === 0) {
    return appApiError('empty', 400, 'users array is empty.');
  }
  if (users.length > MAX_IMPORT) {
    return appApiError('too_many', 400);
  }

  try {
    const n = await prisma.user.count();
    if (n > 0) {
      return appApiOk({ skipped: true, reason: 'database_not_empty' as const });
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
    return appApiOk({
      imported,
      users: rows.map(prismaUserToUserData),
    });
  } catch (e) {
    console.error('POST /api/app/users/import', e);
    return appApiError('database_unavailable', 503);
  }
}
