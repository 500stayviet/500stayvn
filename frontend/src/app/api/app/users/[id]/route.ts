import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  mergeProfileJson,
  prismaUserToUserData,
  userDataPatchToPrisma,
} from '@/lib/server/appUserMapper';
import { rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';
import type { Prisma } from '@prisma/client';
import type { UserData } from '@/lib/api/auth';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const uid = (id || '').trim();
  if (!uid) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  try {
    const row = await prisma.user.findFirst({
      where: { id: uid, deleted: false },
    });
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(prismaUserToUserData(row));
  } catch (e) {
    console.error('GET /api/app/users/[id]', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const uid = (id || '').trim();
  if (!uid) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  let body: Partial<UserData>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const denied = rejectAppWriteUnlessActorAllowed(request, [uid]);
  if (denied) return denied;

  try {
    const row = await prisma.user.findUnique({ where: { id: uid } });
    if (!row || row.deleted) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
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

    return NextResponse.json(prismaUserToUserData(updated));
  } catch (e) {
    console.error('PATCH /api/app/users/[id]', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const uid = (id || '').trim();
  if (!uid) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const denied = rejectAppWriteUnlessActorAllowed(request, [uid]);
  if (denied) return denied;

  try {
    const row = await prisma.user.findUnique({ where: { id: uid } });
    if (!row || row.deleted) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: uid },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json(prismaUserToUserData(updated));
  } catch (e) {
    console.error('DELETE /api/app/users/[id]', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
