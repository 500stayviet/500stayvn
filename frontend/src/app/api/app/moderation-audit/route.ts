import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { appApiError } from '@/lib/server/appApiErrors';
import { appApiOk } from '@/lib/server/appApiResponses';
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
 * P2.1: AppApi 봉투.
 */
export async function POST(request: NextRequest) {
  const actor = getAppActorId(request);
  if (!actor) return appApiError('actor_required', 401);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return appApiError('invalid_body', 400);
  }

  const action = (body.action || '').trim();
  const targetType = (body.targetType || '').trim();
  const targetId = (body.targetId || '').trim();
  if (!action || !targetType || !targetId || !ALLOWED_ACTIONS.has(action)) {
    return appApiError('invalid_fields', 400);
  }

  const prop = await prisma.property.findUnique({
    where: { id: targetId },
    select: { ownerId: true },
  });
  if (!prop) return appApiError('not_found', 404);
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
    const created = (rows as unknown[])[0];
    if (!created || typeof created !== 'object') {
      return appApiError('database_unavailable', 503);
    }
    return appApiOk(created, 201);
  } catch (e) {
    console.error('POST /api/app/moderation-audit', e);
    return appApiError('database_unavailable', 503);
  }
}
