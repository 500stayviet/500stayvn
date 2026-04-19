/**
 * 관리자·핵심 API 관측(미니 런북)
 * - `API_SLOW_MS`: 이 ms 이상 걸리면 Sentry `api_slow` / `slow_operation`(경고).
 * - `API_ACCESS_LOG=1`: 완료 요청을 JSON 한 줄로 stdout(로그 수집기 연동).
 * - 5xx 응답은 `api_http_5xx`로 Sentry에 남김.
 */
import * as Sentry from '@sentry/nextjs';
import type { NextResponse } from 'next/server';

const SLOW_MS = Number(process.env.API_SLOW_MS || 1200);
const ACCESS_LOG = process.env.API_ACCESS_LOG === '1';

export function reportApiSuccess(route: string, status: number, startedAtMs: number): void {
  const durationMs = Date.now() - startedAtMs;
  if (durationMs < SLOW_MS) return;
  Sentry.captureMessage('api_slow', {
    level: 'warning',
    tags: { route, status: String(status) },
    extra: { durationMs, slowThresholdMs: SLOW_MS },
  });
}

export function reportApiException(
  route: string,
  error: unknown,
  startedAtMs?: number
): void {
  const durationMs =
    typeof startedAtMs === 'number' ? Math.max(0, Date.now() - startedAtMs) : undefined;
  Sentry.captureException(error, {
    tags: { route },
    extra: durationMs != null ? { durationMs } : undefined,
  });
}

/**
 * 배치·폴링 등 HTTP 라우트 밖 작업이 느릴 때만 Sentry에 남깁니다.
 */
export function reportSlowOperation(
  operation: string,
  startedAtMs: number,
  extra?: Record<string, unknown>
): void {
  const durationMs = Date.now() - startedAtMs;
  if (durationMs < SLOW_MS) return;
  Sentry.captureMessage('slow_operation', {
    level: 'warning',
    tags: { operation },
    extra: { durationMs, slowThresholdMs: SLOW_MS, ...extra },
  });
}

/**
 * 핵심 API: `Server-Timing` + Sentry 브레드크럼 + (옵션) JSON 액세스 로그 + 느림/5xx 알림.
 * `API_ACCESS_LOG=1` 이면 모든 완료 요청을 한 줄 JSON으로 남깁니다(로그 수집용).
 */
export function observeRouteResponse<T>(
  res: NextResponse<T>,
  route: string,
  startedAtMs: number
): NextResponse<T> {
  const durationMs = Date.now() - startedAtMs;
  try {
    res.headers.set('Server-Timing', `app;dur=${durationMs}`);
  } catch {
    /* ignore */
  }

  Sentry.addBreadcrumb({
    category: 'http.api',
    message: route,
    level: res.status >= 500 ? 'error' : res.status >= 400 ? 'warning' : 'info',
    data: { status: res.status, durationMs },
  });

  if (ACCESS_LOG) {
    console.info(
      JSON.stringify({
        k: 'api_route',
        route,
        status: res.status,
        durationMs,
        at: new Date().toISOString(),
      })
    );
  }

  if (res.status >= 500) {
    Sentry.captureMessage('api_http_5xx', {
      level: 'error',
      tags: { route, status: String(res.status) },
      extra: { durationMs },
    });
  }

  reportApiSuccess(route, res.status, startedAtMs);
  return res;
}

