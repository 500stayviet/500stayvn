import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';

const ALLOWED_TARGET_TYPES = new Set(['user', 'property']);
const ALLOWED_CATEGORIES = new Set(['host', 'guest', 'property']);
const MAX_MEMO_LENGTH = 500;

function sanitizeMemoContent(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/\s+/g, ' ').trim().slice(0, MAX_MEMO_LENGTH);
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const targetType = request.nextUrl.searchParams.get('targetType') || '';
  const targetId = request.nextUrl.searchParams.get('targetId') || '';
  const category = request.nextUrl.searchParams.get('category') || '';

  if (!ALLOWED_TARGET_TYPES.has(targetType) || !targetId || !ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }

  const rows = await prisma.adminSharedMemo.findMany({
    where: { targetType, targetId, category },
    orderBy: { createdAt: 'desc' },
    select: { id: true, content: true, createdAt: true, createdBy: true },
  });

  return NextResponse.json({ rows });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    targetType?: string;
    targetId?: string;
    category?: string;
    content?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const targetType = body.targetType || '';
  const targetId = (body.targetId || '').trim();
  const category = body.category || '';
  const content = sanitizeMemoContent(body.content);

  if (!ALLOWED_TARGET_TYPES.has(targetType) || !targetId || !ALLOWED_CATEGORIES.has(category) || !content) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const created = await prisma.adminSharedMemo.create({
    data: {
      targetType,
      targetId,
      category,
      content,
      createdBy: admin.username,
    },
    select: { id: true, content: true, createdAt: true, createdBy: true },
  });

  return NextResponse.json(created, { status: 201 });
}
