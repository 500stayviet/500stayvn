import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await context.params;
  const id = (params.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const row = await prisma.adminSharedMemo.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.adminSharedMemo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
