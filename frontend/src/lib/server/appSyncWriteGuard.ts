import { NextRequest, NextResponse } from 'next/server';
import { appApiError } from '@/lib/server/appApiErrors';

/**
 * 서버 간·BFF 전용. 브라우저 SPA는 비밀을 숨길 수 없으므로
 * `APP_SYNC_ENFORCE_WRITE=true` 는 BFF/프록시가 `x-app-sync-secret` 을 붙일 때만 켜세요.
 * 기본(미설정 또는 false)이면 검사하지 않습니다.
 */
export function rejectAppWriteUnlessSyncSecret(
  request: NextRequest
): NextResponse | null {
  if (process.env.APP_SYNC_ENFORCE_WRITE !== 'true') return null;
  const secret = process.env.APP_SYNC_SECRET?.trim();
  if (!secret) return null;
  const hdr = request.headers.get('x-app-sync-secret');
  if (!hdr || hdr !== secret) {
    return appApiError('sync_secret_required', 401);
  }
  return null;
}

/**
 * 앱 쓰기 요청의 행위자(사용자) 헤더:
 * - x-app-actor-id
 *
 * 리소스 소유·참가자 검증이 필요한 `/api/app/*` 쓰기·민감 읽기에서는 **항상** 이 헤더를 요구합니다.
 * (`APP_API_ENFORCE_ACTOR` 로 끄지 않습니다 — 운영 안전 기본값.)
 */
export function getAppActorId(request: NextRequest): string {
  return (request.headers.get('x-app-actor-id') || '').trim();
}

export function rejectAppWriteUnlessActorAllowed(
  request: NextRequest,
  allowedActorIds: string[]
): NextResponse | null {
  const actor = getAppActorId(request);
  if (!actor) {
    return appApiError('actor_required', 401);
  }
  const allow = new Set(
    allowedActorIds
      .map((v) => String(v || '').trim())
      .filter(Boolean)
  );
  if (!allow.has(actor)) {
    return appApiError('forbidden_actor', 403);
  }
  return null;
}
