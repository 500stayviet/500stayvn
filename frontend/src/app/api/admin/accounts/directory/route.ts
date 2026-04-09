import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await prisma.adminAccount.findMany({
    orderBy: { createdAt: 'asc' },
    select: { username: true, nickname: true },
  });
  return NextResponse.json({
    admins: rows.map((r) => ({
      username: r.username,
      nickname: (r.nickname || '').trim(),
    })),
  });
}
