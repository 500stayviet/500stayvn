import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Body = {
  userId?: string;
  all?: boolean;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const roomId = (id || '').trim();
  if (!roomId) return NextResponse.json({ error: 'invalid_room_id' }, { status: 400 });
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const userId = (body.userId || '').trim();
  try {
    const result = await prisma.message.updateMany({
      where: {
        roomId,
        isRead: false,
        ...(body.all ? {} : { senderId: { not: userId } }),
      },
      data: { isRead: true },
    });
    return NextResponse.json({ updated: result.count });
  } catch (e) {
    console.error('PATCH /api/app/chat/rooms/[id]/read', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
