import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { prismaPropertyToPropertyData } from '@/lib/server/appPropertyMapper';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const me = await getAdminFromRequest(request);
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const pid = decodeURIComponent(id || '');
    if (!pid) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }
    const row = await prisma.property.findUnique({ where: { id: pid } });
    if (!row) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    return NextResponse.json(prismaPropertyToPropertyData(row));
  } catch (e) {
    console.error('GET /api/admin/properties/[id]', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

