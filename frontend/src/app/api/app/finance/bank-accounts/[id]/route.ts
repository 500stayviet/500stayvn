import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return NextResponse.json({ error: 'actor_required' }, { status: 401 });
  const { id } = await context.params;
  let body: { isPrimary?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  if (!body || body.isPrimary !== true) {
    return NextResponse.json({ error: 'unsupported_action' }, { status: 400 });
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    console.error('PATCH /api/app/finance/bank-accounts/[id]', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ownerId = getAppActorId(request);
  if (!ownerId) return NextResponse.json({ error: 'actor_required' }, { status: 401 });
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    console.error('DELETE /api/app/finance/bank-accounts/[id]', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
