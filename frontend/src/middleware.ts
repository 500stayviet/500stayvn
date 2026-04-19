import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * 앱 로그인과 동기화되는 비 HttpOnly 쿠키 — `auth.ts` 의 `APP_ACTOR_UID_COOKIE` 와 동일 문자열 유지.
 * (미들웨어는 Edge 이므로 `auth.ts` 를 import 하지 않음)
 */
const APP_ACTOR_UID_COOKIE = 'stayviet_app_uid';

/**
 * 외부 결제 웹훅(Stripe, PG 등) — 미들웨어에서 로그인·쿠키 검사를 하면 장애가 나므로 제외.
 * 실제 서명 검증은 각 웹훅 라우트에서 수행.
 */
function isWebhookExemptPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (p.includes('/webhooks/')) return true;
  if (p.endsWith('/webhook')) return true;
  if (p.includes('stripe') && p.includes('webhook')) return true;
  return false;
}

/** Edge 미들웨어에서는 Node `crypto` 미사용 — NextAuth 라우트와 동일 시크릿을 권장 */
function resolveAuthSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    '500stayviet-fallback-auth-secret'
  );
}

async function hasBookingPageSession(request: NextRequest): Promise<boolean> {
  const cookie = request.cookies.get(APP_ACTOR_UID_COOKIE)?.value;
  if (cookie && cookie.trim().length > 0) return true;
  try {
    const token = await getToken({ req: request, secret: resolveAuthSecret() });
    return Boolean(token?.sub);
  } catch {
    return false;
  }
}

/** 결제 API: 페이지 네비와 달리 `x-app-actor-id` 만 있는 클라이언트 fetch 도 허용 */
async function isPaymentApiAuthorized(request: NextRequest): Promise<boolean> {
  if (request.headers.get('x-app-actor-id')?.trim()) return true;
  const cookie = request.cookies.get(APP_ACTOR_UID_COOKIE)?.value;
  if (cookie && cookie.trim().length > 0) return true;
  try {
    const token = await getToken({ req: request, secret: resolveAuthSecret() });
    return Boolean(token?.sub);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isWebhookExemptPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/booking')) {
    if (!(await hasBookingPageSession(request))) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('returnUrl', `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/api/app/payments')) {
    if (!(await isPaymentApiAuthorized(request))) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/booking/:path*', '/api/app/payments/:path*'],
};
