import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

/** P2.1: AppApi 봉투 — 대표 계좌 지정 / 계좌 삭제. */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return appApiError('actor_required', 401);
  const { id } = await context.params;
  let body: { isPrimary?: boolean };
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }
  if (!body || body.isPrimary !== true) {
    return appApiError('unsupported_action', 400);
  }
  try {
    await prisma.$transaction(async (tx) => {
      const found = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT "id" FROM "AdminBankAccount" WHERE "id" = $1 AND "ownerId" = $2 LIMIT 1`,
        id,
        ownerId
      );
      if (!found[0]) throw new Error('not_found');
      await tx.$executeRawUnsafe(
        `UPDATE "AdminBankAccount" SET "isPrimary" = false, "updatedAt" = NOW() WHERE "ownerId" = $1`,
        ownerId
      );
      await tx.$executeRawUnsafe(
        `UPDATE "AdminBankAccount" SET "isPrimary" = true, "updatedAt" = NOW() WHERE "id" = $1`,
        id
      );
    });
    return appApiOk({});
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      return appApiError('not_found', 404);
    }
    console.error('PATCH /api/app/finance/bank-accounts/[id]', error);
    return appApiError('database_unavailable', 503);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return appApiError('actor_required', 401);
  const { id } = await context.params;
  try {
    await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<Array<{ id: string; isPrimary: boolean }>>(
        `
        SELECT "id","isPrimary"
        FROM "AdminBankAccount"
        WHERE "id" = $1 AND "ownerId" = $2
        LIMIT 1
        `,
        id,
        ownerId
      );
      const target = rows[0];
      if (!target) throw new Error('not_found');
      await tx.$executeRawUnsafe(`DELETE FROM "AdminBankAccount" WHERE "id" = $1`, id);
      if (target.isPrimary) {
        await tx.$executeRawUnsafe(
          `
          UPDATE "AdminBankAccount"
          SET "isPrimary" = true, "updatedAt" = NOW()
          WHERE "id" = (
            SELECT "id" FROM "AdminBankAccount"
            WHERE "ownerId" = $1
            ORDER BY "createdAt" ASC
            LIMIT 1
          )
          `,
          ownerId
        );
      }
    });
    return appApiOk({});
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      return appApiError('not_found', 404);
    }
    console.error('DELETE /api/app/finance/bank-accounts/[id]', error);
    return appApiError('database_unavailable', 503);
  }
}
