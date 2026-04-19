import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppActorId, rejectAppWriteUnlessActorAllowed } from '@/lib/server/appSyncWriteGuard';

/** 호스트 앱에서만 허용하는 감사 행위(확장 시 여기에 추가) */
const ALLOWED_ACTIONS = new Set(['property_ad_ended_by_host']);

function generateAuditId(): string {
  return `amad_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

type Body = {
  action?: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
};

/**
 * 로그인 사용자(앱 액터)가 본인 소유 리소스에 대해 남기는 운영 감사 행.
 * 관리자 감사 화면과 동일한 `AdminModerationAudit` 테이블을 사용합니다.
 */
export async function POST(request: NextRequest) {
  const actor = getAppActorId(request);
  if (!actor) return NextResponse.json({ error: 'actor_required' }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const action = (body.action || '').trim();
  const targetType = (body.targetType || '').trim();
  const targetId = (body.targetId || '').trim();
  if (!action || !targetType || !targetId || !ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'invalid_fields' }, { status: 400 });
  }

  const prop = await prisma.property.findUnique({
    where: { id: targetId },
    select: { ownerId: true },
  });
  if (!prop) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const denied = rejectAppWriteUnlessActorAllowed(request, [prop.ownerId]);
  if (denied) return denied;

  try {
    const rows = await prisma.$queryRawUnsafe(
      `
      INSERT INTO "AdminModerationAudit"
      ("id","action","targetType","targetId","ownerId","reason","createdBy","createdAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      RETURNING *
      `,
      generateAuditId(),
      action,
      targetType,
      targetId,
      prop.ownerId,
      body.reason?.trim() || null,
      actor
    );
    return NextResponse.json((rows as unknown[])[0] || null, { status: 201 });
  } catch (e) {
    console.error('POST /api/app/moderation-audit', e);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}
