/**
 * 공개(비로그인) 매물 API 보호 — IP당 분당 요청 제한 + User-Agent 기본 방어
 * ------------------------------------------------------------------
 * - 적용 대상: `assertPublicCatalogGuard` 호출이 있는 **공개 GET** 한정.
 * - `x-app-actor-id` 가 있으면(로그인 앱 사용자) **검사 생략** — 내부 호출·로그인 사용자 방해 방지.
 * - AWS ELB 헬스체크·일부 모니터링 UA 는 429 예외(차단하지 않음). 경로는 운영에서 조정 가능.
 * - Stripe/PG **웹훅** 은 `middleware.ts` 에서 경로 제외 — 본 가드는 매물 공개 API에만 붙입니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAppActorId } from '@/lib/server/appSyncWriteGuard';

const PUBLIC_RATE_MAX = 30;
const PUBLIC_RATE_WINDOW_MS = 60_000;

/** 빈 UA 또는 흔한 CLI/스크래핑 UA — 즉시 429 */
const BLOCKED_UA_SUBSTRINGS = [
  'curl/',
  'wget/',
  'python-requests',
  'aiohttp',
  'scrapy',
  'httpclient',
  'axios/',
  'go-http-client',
  'java/',
  'libwww',
] as const;

/** ALB/NLB·Kubernetes·업타임 등 — 레이트/UA 차단 예외 (필요 시 문자열 추가) */
const TRUSTED_MONITOR_UA_SUBSTRINGS = [
  'ELB-HealthChecker',
  'HealthChecker',
  'kube-probe',
  'GoogleHC',
  'GoogleStackdriverMonitoring',
  'UptimeRobot',
  'StatusCake',
  'Pingdom',
] as const;

type Bucket = { resetAt: number; count: number };
const rateBuckets = new Map<string, Bucket>();

function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return request.headers.get('cf-connecting-ip')?.trim() || 'unknown';
}

function isTrustedMonitorUa(ua: string): boolean {
  const lower = ua.toLowerCase();
  return TRUSTED_MONITOR_UA_SUBSTRINGS.some((s) => lower.includes(s.toLowerCase()));
}

function isBlockedBotUa(ua: string): boolean {
  if (!ua.trim()) return true;
  const lower = ua.toLowerCase();
  return BLOCKED_UA_SUBSTRINGS.some((s) => lower.includes(s.toLowerCase()));
}

function isRateLimited(ip: string, routeKey: string): boolean {
  const key = `${ip}:${routeKey}`;
  const now = Date.now();
  let b = rateBuckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { resetAt: now + PUBLIC_RATE_WINDOW_MS, count: 0 };
    rateBuckets.set(key, b);
  }
  b.count += 1;
  if (rateBuckets.size > 50_000) {
    for (const [k, v] of rateBuckets) {
      if (now >= v.resetAt) rateBuckets.delete(k);
    }
  }
  return b.count > PUBLIC_RATE_MAX;
}

/**
 * 공개 매물 카탈로그 GET 전용. 로그인 액터가 있으면 통과.
 * 실패 시 429 JSON.
 */
export function assertPublicCatalogGuard(
  request: NextRequest,
  routeKey: string
): NextResponse | null {
  if (getAppActorId(request)) return null;

  const ua = request.headers.get('user-agent') || '';
  if (isTrustedMonitorUa(ua)) return null;

  if (isBlockedBotUa(ua)) {
    return NextResponse.json(
      { error: 'too_many_requests', message: 'blocked_user_agent' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const ip = clientIp(request);
  if (isRateLimited(ip, routeKey)) {
    return NextResponse.json(
      { error: 'too_many_requests', message: 'rate_limit' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  return null;
}
