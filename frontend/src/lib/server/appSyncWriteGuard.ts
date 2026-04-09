import { NextRequest, NextResponse } from 'next/server';

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
    return NextResponse.json({ error: 'sync_secret_required' }, { status: 401 });
  }
  return null;
}
