import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mergeProfileJson,
  prismaUserToUserData,
  userDataPatchToPrisma,
} from '@/lib/server/appUserMapper';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import type { Prisma } from '@prisma/client';
import type { UserData } from '@/lib/api/auth';

/** 관리자 세션으로만 변경 가능한 앱 사용자 필드 (`/api/admin/*` UI) */
const ADMIN_APP_USER_PATCH_KEYS = new Set([
  'blocked',
  'blockedAt',
  'blockedReason',
  'verification_status',
  'role',
  'deleted',
  'deletedAt',
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const uid = (id || '').trim();
  if (!uid) return appApiError('invalid_id', 400);

  const admin = await getAdminFromRequest(request);
  const actor = getAppActorId(request);
  if (!admin && actor !== uid) return appApiError('forbidden_actor', 403);

  try {
    const row = await prisma.user.findFirst({
      where: { id: uid, deleted: false },
    });
    if (!row) return appApiError('not_found', 404);
    return appApiOk({ user: prismaUserToUserData(row) });
  } catch (e) {
    console.error('GET /api/app/users/[id]', e);
    return appApiError('database_unavailable', 503);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const uid = (id || '').trim();
  if (!uid) return appApiError('invalid_id', 400);

  let body: Partial<UserData>;
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }

  const actor = getAppActorId(request);
  const isSelf = !!actor && actor === uid;
  const admin = !isSelf ? await getAdminFromRequest(request) : null;

  if (!isSelf && !admin) {
    if (!actor) return appApiError('actor_required', 401);
    return appApiError('forbidden_actor', 403);
  }

  if (admin && !isSelf) {
    const filtered: Partial<UserData> = {};
    for (const key of Object.keys(body) as Array<keyof UserData>) {
      if (ADMIN_APP_USER_PATCH_KEYS.has(String(key))) {
        (filtered as Record<string, unknown>)[key as string] = body[key];
      }
    }
    if (Object.keys(filtered).length === 0) {
      return appApiError('admin_patch_empty', 400);
    }
    body = filtered;
  }

  try {
    const row = await prisma.user.findUnique({ where: { id: uid } });
    if (!row || row.deleted) {
      return appApiError('not_found', 404);
    }

    const flat = userDataPatchToPrisma(body) as Prisma.UserUpdateInput;
    const data: Prisma.UserUpdateInput = { ...flat };

    if (body.private_data !== undefined || body.kyc_steps !== undefined) {
      data.profileJson = mergeProfileJson(row.profileJson, body);
    }

    const updated = await prisma.user.update({
      where: { id: uid },
      data,
    });

    return appApiOk({ user: prismaUserToUserData(updated) });
  } catch (e) {
    console.error('PATCH /api/app/users/[id]', e);
    return appApiError('database_unavailable', 503);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const uid = (id || '').trim();
  if (!uid) return appApiError('invalid_id', 400);

  const actor = getAppActorId(request);
  if (!actor || actor !== uid) {
    if (!actor) return appApiError('actor_required', 401);
    return appApiError('forbidden_actor', 403);
  }

  try {
    const row = await prisma.user.findUnique({ where: { id: uid } });
    if (!row || row.deleted) {
      return appApiError('not_found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: uid },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });

    return appApiOk({ user: prismaUserToUserData(updated) });
  } catch (e) {
    console.error('DELETE /api/app/users/[id]', e);
    return appApiError('database_unavailable', 503);
  }
}
